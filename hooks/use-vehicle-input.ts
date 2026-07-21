import { useEffect, useState } from 'react';

export type VehicleCategory = 'cut_through' | 'parking' | 'driving';
export type VehicleType = 'Car' | 'Moto' | 'Ebike' | 'Truck';

export function useVehicleInput(
    onLog: (category: VehicleCategory, type: VehicleType) => void,
    onUndoVehicle: () => void,
    onUndoStroke: () => void,
    isDrawingMode: boolean
) {
    const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (
                e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement ||
                (e.target as Element)?.closest("[contenteditable]")
            ) return;

            let key = e.key.toLowerCase();
            const code = e.code.toLowerCase();

            // FIX: Normalize Numpad keys (e.g., "numpad1" becomes "1")
            if (code.startsWith("numpad") && !isNaN(Number(code.slice(6)))) {
                key = code.replace("numpad", "");
            }

            const targetKeys = ['1', '2', '3', 'm', 'e', 'b', 't', 'z', 'shift'];

            if (targetKeys.includes(key)) {
                if (key !== 'shift') e.preventDefault();
                setPressedKeys((prev) => new Set(prev).add(key));
            }

            if (key === 'z') {
                if (e.shiftKey || isDrawingMode) {
                    onUndoStroke();
                } else {
                    onUndoVehicle();
                }
                return;
            }

            if (['1', '2', '3'].includes(key)) {
                let category: VehicleCategory = 'cut_through';
                if (key === '1') category = 'cut_through';
                if (key === '2') category = 'parking';
                if (key === '3') category = 'driving';

                const currentPressed = new Set(pressedKeys);
                currentPressed.add(key);

                let activeModifiers = 0;
                let selectedType: VehicleType = 'Car';

                if (currentPressed.has('m')) { activeModifiers++; selectedType = 'Moto'; }
                if (currentPressed.has('e') || currentPressed.has('b')) { activeModifiers++; selectedType = 'Ebike'; }
                if (currentPressed.has('t')) { activeModifiers++; selectedType = 'Truck'; }

                if (activeModifiers > 1) {
                    selectedType = 'Car';
                }

                onLog(category, selectedType);
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            let key = e.key.toLowerCase();
            const code = e.code.toLowerCase();

            if (code.startsWith("numpad") && !isNaN(Number(code.slice(6)))) {
                key = code.replace("numpad", "");
            }

            setPressedKeys((prev) => {
                const newSet = new Set(prev);
                newSet.delete(key);
                return newSet;
            });
        };

        window.addEventListener('keydown', handleKeyDown, { passive: false });
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [pressedKeys, isDrawingMode, onLog, onUndoVehicle, onUndoStroke]);
}
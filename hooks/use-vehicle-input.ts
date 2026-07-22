import { useEffect, useState } from 'react';

export type VehicleCategory = 'cut_through' | 'parking' | 'driving';
export type VehicleType = 'Car' | 'Moto' | 'Ebike' | 'Truck';

export function useVehicleInput(
    onLog: (category: VehicleCategory, type: VehicleType, hasQ: boolean, hasN: boolean) => void,
    onUndoVehicle: () => void,
    onRedoVehicle: () => void,
    onUndoStroke: () => void,
    onRedoStroke: () => void,
    onRetroactiveQ: () => void,
    onRetroactiveN: () => void,
    isDrawingMode: boolean
) {
    const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
    const [qUsed, setQUsed] = useState(false);
    const [nUsed, setNUsed] = useState(false);

    const getActiveType = (): VehicleType => {
        let activeModifiers = 0;
        let selectedType: VehicleType = 'Car';

        if (pressedKeys.has('m')) { activeModifiers++; selectedType = 'Moto'; }
        if (pressedKeys.has('e') || pressedKeys.has('b')) { activeModifiers++; selectedType = 'Ebike'; }
        if (pressedKeys.has('t')) { activeModifiers++; selectedType = 'Truck'; }

        return activeModifiers > 1 ? 'Car' : selectedType;
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (
                e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement ||
                (e.target as Element)?.closest("[contenteditable]")
            ) return;

            let key = e.key.toLowerCase();
            const code = e.code.toLowerCase();

            if (code.startsWith("numpad") && !isNaN(Number(code.slice(6)))) {
                key = code.replace("numpad", "");
            }

            const targetKeys = ['1', '2', '3', 'm', 'e', 'b', 't', 'z', 'r', 'q', 'n', 'shift'];

            if (targetKeys.includes(key)) {
                if (key !== 'shift') e.preventDefault();
                setPressedKeys((prev) => new Set(prev).add(key));

                // Reset usage flags when keys are newly pressed
                if (key === 'q') setQUsed(false);
                if (key === 'n') setNUsed(false);
            }

            if (key === 'z') {
                if (e.shiftKey || isDrawingMode) onUndoStroke();
                else onUndoVehicle();
                return;
            }

            if (key === 'r') {
                if (e.shiftKey || isDrawingMode) onRedoStroke();
                else onRedoVehicle();
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

                if (activeModifiers > 1) selectedType = 'Car';

                const hasQ = currentPressed.has('q');
                const hasN = currentPressed.has('n');

                if (hasQ) setQUsed(true);
                if (hasN) setNUsed(true);

                onLog(category, selectedType, hasQ, hasN);
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            let key = e.key.toLowerCase();
            const code = e.code.toLowerCase();

            if (code.startsWith("numpad") && !isNaN(Number(code.slice(6)))) {
                key = code.replace("numpad", "");
            }

            // If Q or N were released WITHOUT being combined with a log action, apply retroactively
            if (key === 'q' && !qUsed && pressedKeys.has('q')) onRetroactiveQ();
            if (key === 'n' && !nUsed && pressedKeys.has('n')) onRetroactiveN();

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
    }, [pressedKeys, isDrawingMode, qUsed, nUsed, onLog, onUndoVehicle, onRedoVehicle, onUndoStroke, onRedoStroke, onRetroactiveQ, onRetroactiveN]);

    return { activeModifierType: getActiveType() };
}
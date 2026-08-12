"use client"

import { useEffect, useRef, useState } from 'react'
import { VehicleCategory, VehicleType } from '@/lib/types/types'

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
    const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set())
    const pressedKeysRef = useRef<Set<string>>(new Set())

    useEffect(() => {
        pressedKeysRef.current = pressedKeys
    }, [pressedKeys])

    const [qUsed, setQUsed] = useState(false)
    const [nUsed, setNUsed] = useState(false)

    const getActiveType = (): VehicleType => {
        let activeModifiers = 0
        let selectedType: VehicleType = 'Car'

        const keys = pressedKeysRef.current
        if (keys.has('m')) { activeModifiers++; selectedType = 'Moto' }
        if (keys.has('e') || keys.has('b')) { activeModifiers++; selectedType = 'Ebike' }
        if (keys.has('t')) { activeModifiers++; selectedType = 'Truck' }

        return activeModifiers > 1 ? 'Car' : selectedType
    }

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (
                e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement ||
                (e.target as Element)?.closest("[contenteditable]")
            ) return

            let key = e.key.toLowerCase()
            const code = e.code.toLowerCase()
            if (code.startsWith("numpad") && !isNaN(Number(code.slice(6)))) {
                key = code.replace("numpad", "")
            }

            const targetKeys = ['1', '2', '3', 'm', 'e', 'b', 't', 'z', 'r', 'q', 'n', 'shift']
            if (targetKeys.includes(key)) {
                if (key !== 'shift') e.preventDefault()
                setPressedKeys((prev) => {
                    const next = new Set(prev)
                    next.add(key)
                    return next
                })
                if (key === 'q') setQUsed(false)
                if (key === 'n') setNUsed(false)
            }

            // Prevent multi-triggering when holding down keys (key repeat)
            if (e.repeat) return

            if (key === 'z') {
                if (e.shiftKey || isDrawingMode) onUndoStroke()
                else onUndoVehicle()
                return
            }

            if (key === 'r') {
                if (e.shiftKey || isDrawingMode) onRedoStroke()
                else onRedoVehicle()
                return
            }

            if (['1', '2', '3'].includes(key)) {
                const category: VehicleCategory = key === '1' ? 'cut_through' : key === '2' ? 'parking' : 'driving'
                const currentPressed = new Set(pressedKeysRef.current)
                currentPressed.add(key)

                let activeModifiers = 0
                let selectedType: VehicleType = 'Car'
                if (currentPressed.has('m')) { activeModifiers++; selectedType = 'Moto' }
                if (currentPressed.has('e') || currentPressed.has('b')) { activeModifiers++; selectedType = 'Ebike' }
                if (currentPressed.has('t')) { activeModifiers++; selectedType = 'Truck' }
                if (activeModifiers > 1) selectedType = 'Car'

                const hasQ = currentPressed.has('q')
                const hasN = currentPressed.has('n')

                if (hasQ) setQUsed(true)
                if (hasN) setNUsed(true)

                onLog(category, selectedType, hasQ, hasN)
            }
        }

        const handleKeyUp = (e: KeyboardEvent) => {
            let key = e.key.toLowerCase()
            const code = e.code.toLowerCase()
            if (code.startsWith("numpad") && !isNaN(Number(code.slice(6)))) {
                key = code.replace("numpad", "")
            }

            if (key === 'q' && !qUsed && pressedKeysRef.current.has('q')) onRetroactiveQ()
            if (key === 'n' && !nUsed && pressedKeysRef.current.has('n')) onRetroactiveN()

            setPressedKeys((prev) => {
                const newSet = new Set(prev)
                newSet.delete(key)
                return newSet
            })
        }

        window.addEventListener('keydown', handleKeyDown, { passive: false })
        window.addEventListener('keyup', handleKeyUp)

        return () => {
            window.removeEventListener('keydown', handleKeyDown)
            window.removeEventListener('keyup', handleKeyUp)
        }
    }, [isDrawingMode, qUsed, nUsed, onLog, onUndoVehicle, onRedoVehicle, onUndoStroke, onRedoStroke, onRetroactiveQ, onRetroactiveN])

    return { activeModifierType: getActiveType() }
}
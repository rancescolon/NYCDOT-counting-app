"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ChevronRight, Undo2 } from "lucide-react"

export type VehicleCategory = 'cut_through' | 'parking' | 'driving'
export type VehicleType = 'Car' | 'Moto' | 'Ebike' | 'Truck'

interface HelpSidebarProps {
    isOpen: boolean
    onClose: () => void
    onUndo: () => void
    canUndo: boolean
    onLog?: (category: VehicleCategory, type: VehicleType) => void
    activeModifierType: VehicleType
}

const keyboardShortcuts = [
    {
        keys: ["1"],
        description: "Mark Sidewalk Cut Through",
        color: "bg-blue-500",
    },
    {
        keys: ["2"],
        description: "Mark Sidewalk Parking",
        color: "bg-emerald-500",
    },
    {
        keys: ["3"],
        description: "Mark Sidewalk Driving",
        color: "bg-amber-500",
    },
    {
        keys: ["Hold M"],
        description: "Motorcycle Modifier",
        color: "bg-purple-500",
    },
    {
        keys: ["Hold E", "Hold B"],
        description: "E-Bike Modifier",
        color: "bg-purple-500",
    },
    {
        keys: ["Hold T"],
        description: "Truck Modifier",
        color: "bg-purple-500",
    },
    {
        keys: ["Shift"],
        description: "Drawing Mode",
        color: "bg-red-500",
    },
    {
        keys: ["↑", "↓"],
        description: "Slow down / Speed up",
        color: "bg-gray-500",
    },
    {
        keys: ["?"],
        description: "Toggle this help menu",
        color: "bg-gray-800",
    },
]

export default function HelpSidebar({
                                        isOpen,
                                        onClose,
                                        onUndo,
                                        canUndo = false,
                                        onLog,
                                        activeModifierType
                                    }: HelpSidebarProps) {
    const [isCollapsed, setIsCollapsed] = useState(false)

    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose()
            }
        }
        if (isOpen) {
            document.addEventListener("keydown", handleEscape)
        }
        return () => {
            document.removeEventListener("keydown", handleEscape)
        }
    }, [isOpen, onClose])

    const handleUndoClick = () => {
        if (onUndo && canUndo) {
            onUndo()
        }
    }

    if (!isOpen) return null

    return (
        <>
            <div
                className={`fixed top-0 right-0 h-full bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-2xl z-40 transition-all duration-300 ease-in-out ${
                    isCollapsed ? "w-12" : "w-80"
                } animate-in slide-in-from-right duration-300`}
            >
                {/* Side Arrow Button */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                            if (isCollapsed) {
                                setIsCollapsed(false)
                            } else {
                                onClose()
                            }
                        }}
                        className="h-16 w-8 rounded-l-lg rounded-r-none bg-white dark:bg-gray-800 border border-r-0 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 shadow-lg transition-all duration-200"
                        title={isCollapsed ? "Expand sidebar" : "Close help"}
                    >
                        <ChevronRight
                            className={`h-5 w-5 text-gray-600 dark:text-gray-300 transition-transform duration-200 ${
                                isCollapsed ? "rotate-180" : ""
                            }`}
                        />
                    </Button>
                </div>

                <div className="flex flex-col h-full">
                    {!isCollapsed && (
                        <>
                            {/* Header / Undo Button */}
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                                <Button
                                    onClick={handleUndoClick}
                                    disabled={!canUndo}
                                    className={`w-full flex items-center justify-center gap-3 h-12 transition-all duration-200 ${
                                        canUndo
                                            ? "bg-orange-500 hover:bg-orange-600 text-white hover:scale-105 hover:shadow-md"
                                            : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                                    }`}
                                >
                                    <Undo2 className="h-5 w-5" />
                                    <span className="font-semibold">Undo Last Count</span>
                                    <kbd className="px-2 py-1 text-xs font-mono bg-black/20 text-white rounded">Z</kbd>
                                </Button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-4">
                                <div className="space-y-3" style={{ userSelect: "none" }}>
                                    {keyboardShortcuts.map((shortcut, index) => {
                                        const isClickable = ["1", "2", "3"].includes(shortcut.keys[0]) && !!onLog;
                                        return (
                                            <div
                                                key={index}
                                                onClick={() => {
                                                    if (isClickable && onLog) {
                                                        if (shortcut.keys[0] === "1") onLog("cut_through", activeModifierType)
                                                        if (shortcut.keys[0] === "2") onLog("parking", activeModifierType)
                                                        if (shortcut.keys[0] === "3") onLog("driving", activeModifierType)
                                                    }
                                                }}
                                                className={`flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 transition-all duration-200 ${
                                                    isClickable ? "hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer hover:scale-105 shadow-sm" : ""
                                                }`}
                                            >
                                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                                    <div className="flex gap-2">
                                                        {shortcut.keys.map((key, keyIndex) => (
                                                            <kbd
                                                                key={keyIndex}
                                                                className={`px-3 py-2 text-sm font-mono ${shortcut.color} text-white rounded shadow-md min-w-[2rem] text-center font-bold`}
                                                            >
                                                                {key}
                                                            </kbd>
                                                        ))}
                                                    </div>
                                                    <span className="text-sm text-gray-700 dark:text-gray-200 font-medium">
                                                        {shortcut.description}
                                                    </span>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>

                                <div className="mt-6 bg-gray-100 dark:bg-blue-900/20 border border-blue-700 dark:border-blue-800 rounded-lg p-4 mb-4">
                                    <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-3 text-sm">Quick Tips</h4>
                                    <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
                                        <li>• Press <strong>1, 2, or 3</strong> to log a vehicle (incorporates any held modifier).</li>
                                        <li>• Hold <strong>M, E/B, or T</strong> to change the vehicle type.</li>
                                        <li>• Press <strong>Shift</strong> to toggle drawing restricted zones.</li>
                                        <li>• Press <strong>Z</strong> to undo the last logged vehicle.</li>
                                        <li>• Press <strong>Shift + Z</strong> to undo the last drawn line.</li>
                                    </ul>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    )
}
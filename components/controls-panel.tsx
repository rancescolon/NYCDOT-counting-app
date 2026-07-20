"use client"

import React from "react"
import { Button } from "@/components/ui/button"

export type VehicleCategory = 'cut_through' | 'parking' | 'driving'
export type VehicleType = 'Car' | 'Moto' | 'Ebike' | 'Truck'

export interface CountEntry {
    id: string
    timestamp: string
    category: VehicleCategory
    type: VehicleType
    videoIndex: number
}

interface ControlsPanelProps {
    lastEntry?: CountEntry
    isDrawingMode: boolean
    onToggleDrawingMode: () => void
    totalCount: number
}

export function ControlsPanel({
                                  lastEntry,
                                  isDrawingMode,
                                  onToggleDrawingMode,
                                  totalCount
                              }: ControlsPanelProps) {

    const formatCategory = (cat: string) => {
        if (cat === 'cut_through') return 'Cut Through'
        if (cat === 'parking') return 'Parking'
        if (cat === 'driving') return 'Driving'
        return cat
    }

    return (
        <div className="flex items-center justify-end gap-6 w-full">

            {/* Total Session Stats */}
            <div className="flex flex-col items-end">
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
          Total Vehicles
        </span>
                <span className="text-lg font-bold text-slate-700 dark:text-slate-200">
          {totalCount}
        </span>
            </div>

            {/* Vertical Divider */}
            <div className="w-px h-10 bg-slate-300 dark:bg-slate-600 hidden sm:block"></div>

            {/* Last Logged Feedback */}
            <div className="flex flex-col items-start min-w-[160px]">
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
          Last Logged
        </span>
                <div className="h-7 flex items-center">
                    {lastEntry ? (
                        <span
                            className="font-bold text-lg text-emerald-600 dark:text-emerald-400 animate-in fade-in slide-in-from-bottom-1">
              {formatCategory(lastEntry.category)}
                            {lastEntry.type !== 'Car' && (
                                <span className="ml-2 text-amber-500 dark:text-amber-400 text-sm">
                  {/* Removed parenthesis here */}
                                    {lastEntry.type}
                </span>
                            )}
            </span>
                    ) : (
                        <span className="text-sm text-slate-400 italic">Waiting for input...</span>
                    )}
                </div>
            </div>

            {/* Drawing Mode Toggle Button */}
            <Button
                onClick={onToggleDrawingMode}
                variant={isDrawingMode ? "default" : "outline"}
                className={`min-w-[160px] font-semibold transition-all duration-200 ${
                    isDrawingMode
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                        : 'bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border-slate-300 dark:border-slate-600'
                }`}
                title="Shortcut: Hold Shift"
            >
                {isDrawingMode ? 'Drawing Mode: ON' : 'Drawing Mode: OFF'}
            </Button>

        </div>
    )
}

export default ControlsPanel
"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

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
    onClearStrokes: () => void
    onExport: () => void
    totalCount: number
}

export function ControlsPanel({
                                  lastEntry,
                                  isDrawingMode,
                                  onToggleDrawingMode,
                                  onClearStrokes,
                                  onExport,
                                  totalCount
                              }: ControlsPanelProps) {

    const formatCategory = (cat: string) => {
        if (cat === 'cut_through') return 'Cut Through'
        if (cat === 'parking') return 'Sidewalk Parking'
        if (cat === 'driving') return 'Sidewalk Driving'
        return cat
    }

    return (
        <div className="flex items-center justify-end gap-3 w-full">

            {/* Stats Group (Side-by-side layout to eliminate vertical height breaking) */}
            <div className="flex items-center gap-4 px-2 py-1 shrink-0">
                {/* Total Stat */}
                <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
            Total:
          </span>
                    <span className="text-lg font-bold text-slate-700 dark:text-slate-200">
            {totalCount}
          </span>
                </div>

                <div className="w-px h-6 bg-slate-300 dark:bg-slate-700"></div>

                {/* Last Logged Stat */}
                <div className="flex items-center gap-1.5 max-w-[220px]">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider shrink-0">
            Last:
          </span>
                    <div className="flex items-center truncate">
                        {lastEntry ? (
                            <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400 truncate" title={`${formatCategory(lastEntry.category)} ${lastEntry.type !== 'Car' ? `(${lastEntry.type})` : ''}`}>
                {formatCategory(lastEntry.category)}
                                {lastEntry.type !== 'Car' && (
                                    <span className="ml-1 text-amber-500 dark:text-amber-400 text-xs">
                    ({lastEntry.type})
                  </span>
                                )}
              </span>
                        ) : (
                            <span className="text-xs text-slate-400 italic">Waiting...</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
                <Button
                    onClick={onExport}
                    variant="outline"
                    size="icon"
                    className="w-12 h-12 flex items-center justify-center bg-green-600 hover:bg-green-700 text-white border-none shadow-sm transition-all duration-200 hover:scale-105"
                    title="Export to Excel"
                >
                    <Download className="h-5 w-5" />
                </Button>

                {isDrawingMode && (
                    <Button
                        onClick={onClearStrokes}
                        variant="destructive"
                        className="h-12 px-4 font-semibold shadow-sm animate-in fade-in"
                    >
                        Clear
                    </Button>
                )}

                <Button
                    onClick={onToggleDrawingMode}
                    variant={isDrawingMode ? "default" : "outline"}
                    className={`h-12 px-4 font-semibold transition-all duration-200 ${
                        isDrawingMode
                            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                            : 'bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border-slate-300 dark:border-slate-600'
                    }`}
                    title="Shortcut: Shift"
                >
                    {isDrawingMode ? 'Drawing: ON' : 'Drawing: OFF'}
                </Button>
            </div>

        </div>
    )
}

export default ControlsPanel
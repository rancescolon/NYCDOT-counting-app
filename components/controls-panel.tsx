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
    note?: string
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
        <div className="flex items-center justify-end gap-2 xl:gap-3 w-full">

            {/* Stats Group */}
            <div className="flex items-center gap-3 px-1 py-1 shrink-0">
                {/* Total Stat */}
                <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
            Total:
          </span>
                    <span className="text-base font-bold text-slate-700 dark:text-slate-200">
            {totalCount}
          </span>
                </div>

                {/* Last Logged Stat */}
                <div className="flex items-center gap-1.5 max-w-[170px] xl:max-w-[210px]">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider shrink-0">
            Last:
          </span>
                    <div className="flex items-center truncate">
                        {lastEntry ? (
                            <span className="font-bold text-xs text-emerald-600 dark:text-emerald-400 truncate" title={`${formatCategory(lastEntry.category)} ${lastEntry.type !== 'Car' ? `(${lastEntry.type})` : ''} ${lastEntry.note ? '?' : ''}`}>
                {formatCategory(lastEntry.category)}

                                {lastEntry.type !== 'Car' && (
                                    <span className="ml-1 text-amber-500 dark:text-amber-400 text-[10px]">
                    ({lastEntry.type})
                  </span>
                                )}

                                {/* NEW: Display (?) if a note or Q modifier exists */}
                                {lastEntry.note && (
                                    <span className="ml-1 text-red-500 dark:text-red-500 font-bold text-[11px]">
                    (?)
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
            <div className="flex items-center gap-1.5 shrink-0">
                <Button
                    onClick={onExport}
                    variant="outline"
                    size="icon"
                    className="w-11 h-11 flex items-center justify-center bg-green-600 hover:bg-green-700 text-white border-none shadow-sm transition-all duration-200 hover:scale-105"
                    title="Export to Excel"
                >
                    <Download className="h-5 w-5" />
                </Button>

                {isDrawingMode && (
                    <Button
                        onClick={onClearStrokes}
                        variant="destructive"
                        className="h-11 px-3 text-xs font-semibold shadow-sm animate-in fade-in"
                    >
                        Clear
                    </Button>
                )}

                <Button
                    onClick={onToggleDrawingMode}
                    variant={isDrawingMode ? "default" : "outline"}
                    className={`h-11 px-3 text-xs font-semibold transition-all duration-200 ${
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
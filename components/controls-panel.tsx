"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { CountEntry } from "@/lib/types/types"
import { VideoToolConfig } from "@/lib/config/video-tool.config"

interface ControlsPanelProps {
    totalCount?: number
    lastEntry?: CountEntry
    lastEntryLabel?: React.ReactNode
    isDrawingMode?: boolean
    onToggleDrawingMode?: () => void
    onClearStrokes?: () => void
    onExport?: () => void
    config?: VideoToolConfig
    customActions?: React.ReactNode
}

export function ControlsPanel({
                                  totalCount,
                                  lastEntry,
                                  lastEntryLabel,
                                  isDrawingMode = false,
                                  onToggleDrawingMode = () => {},
                                  onClearStrokes = () => {},
                                  onExport = () => {},
                                  config,
                                  customActions
                              }: ControlsPanelProps) {

    const formatCategory = (cat: string) => {
        if (cat === 'cut_through') return 'Cut Through'
        if (cat === 'parking') return 'Sidewalk Parking'
        if (cat === 'driving') return 'Sidewalk Driving'
        return cat
    }

    // Fallback to formatting the raw lastEntry object if lastEntryLabel isn't passed directly
    const resolvedLastEntryLabel = lastEntryLabel ?? (lastEntry ? (
        <span className="font-bold text-xs text-emerald-600 dark:text-emerald-400 truncate">
            {formatCategory(lastEntry.category)}
            {lastEntry.type && lastEntry.type !== 'Car' && <span className="ml-1 text-amber-500 text-[10px]">({lastEntry.type})</span>}
            {lastEntry.note && <span className="ml-1 text-red-500 font-bold text-[12px]">(?)</span>}
        </span>
    ) : null)

    const showExport = config ? config.features.export : true;
    const showDrawing = config ? config.features.drawingMode : true;

    return (
        <div className="flex items-center justify-end gap-2 xl:gap-3 w-full">
            {(totalCount !== undefined || resolvedLastEntryLabel) && (
                <div className="flex items-center gap-3 px-1 py-1 shrink-0">
                    {totalCount !== undefined && (
                        <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
                                Total:
                            </span>
                            <span className="text-base font-bold text-slate-700 dark:text-slate-200">
                                {totalCount}
                            </span>
                        </div>
                    )}

                    {resolvedLastEntryLabel && (
                        <div className="flex items-center gap-1.5 max-w-[170px] xl:max-w-[210px]">
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider shrink-0">
                                Last:
                            </span>
                            <div className="flex items-center truncate">
                                {resolvedLastEntryLabel}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {customActions}

            <div className="flex items-center gap-1.5 shrink-0">
                {showExport && (
                    <Button onClick={onExport} variant="outline" size="icon" className="w-11 h-11 flex items-center justify-center bg-green-600 hover:bg-green-700 text-white border-none shadow-sm transition-all duration-200 hover:scale-105">
                        <Download className="h-5 w-5" />
                    </Button>
                )}
                {showDrawing && isDrawingMode && (
                    <Button onClick={onClearStrokes} variant="destructive" className="h-11 px-3 text-xs font-semibold shadow-sm animate-in fade-in">
                        Clear
                    </Button>
                )}
                {showDrawing && (
                    <Button onClick={onToggleDrawingMode} variant={isDrawingMode ? "default" : "outline"} className={`h-11 px-3 text-xs font-semibold transition-all duration-200 ${isDrawingMode ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm' : 'bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border-slate-300 dark:border-slate-600'}`}>
                        {isDrawingMode ? 'Drawing: ON' : 'Drawing: OFF'}
                    </Button>
                )}
            </div>
        </div>
    )
}
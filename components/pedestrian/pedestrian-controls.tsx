"use client"

import React from "react"
import {
    ArrowUp,
    ArrowDown,
    ArrowLeft,
    ArrowRight,
    Download,
} from "lucide-react"
import { Button } from "@/components/ui/button"

export interface CountEntry {
    id: string
    timestamp: number
    key: string
    videoFile: string
    realTime?: Date | null
}

interface PedestrianControlsProps {
    counts: CountEntry[]
    onExport?: () => void
    align?: "left" | "right"
}

const KEY_CONFIG: Record<
    string,
    {
        label: string
        colorBg: string
        icon: React.ReactNode
    }
> = {
    "1": { label: "Eastbound (North)", colorBg: "bg-blue-600 text-white", icon: <ArrowRight className="w-6 h-6" /> },
    "2": { label: "Westbound (North)", colorBg: "bg-blue-600 text-white", icon: <ArrowLeft className="w-6 h-6" /> },
    "3": { label: "Eastbound (South)", colorBg: "bg-red-500 text-white", icon: <ArrowRight className="w-6 h-6" /> },
    "4": { label: "Westbound (South)", colorBg: "bg-red-500 text-white", icon: <ArrowLeft className="w-6 h-6" /> },
    "5": { label: "Northbound (East)", colorBg: "bg-emerald-500 text-white", icon: <ArrowUp className="w-6 h-6" /> },
    "6": { label: "Southbound (East)", colorBg: "bg-emerald-500 text-white", icon: <ArrowDown className="w-6 h-6" /> },
    "7": { label: "Northbound (West)", colorBg: "bg-amber-500 text-white", icon: <ArrowUp className="w-6 h-6" /> },
    "8": { label: "Southbound (West)", colorBg: "bg-amber-500 text-white", icon: <ArrowDown className="w-6 h-6" /> },
}

export function DirectionArrowIndicator({ activeKey }: { activeKey?: string | null }) {
    const activeConfig = activeKey ? KEY_CONFIG[activeKey] : null
    return (
        <div
            className={`flex items-center justify-center w-[72px] h-12 rounded-md shadow-sm transition-all duration-200 ${
                activeConfig ? activeConfig.colorBg : "bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600"
            }`}
        >
            {activeConfig ? activeConfig.icon : <ArrowUp className="w-6 h-6 opacity-30" />}
        </div>
    )
}

export function PedestrianControls({
                                       counts,
                                       onExport,
                                       align = "left",
                                   }: PedestrianControlsProps) {
    const lastEntry = counts.length > 0 ? counts[counts.length - 1] : null
    const activeConfig = lastEntry ? KEY_CONFIG[lastEntry.key] : null

    const directionCount = lastEntry
        ? counts.filter((c) => c.key === lastEntry.key).length
        : 0

    const totalCount = counts.length
    const alignmentClass = align === "right" ? "justify-end" : "justify-start"

    return (
        <div className={`flex items-center gap-2 w-full ${alignmentClass}`}>
            {/* Total Count Card */}
            <div className="flex flex-col items-center justify-center px-4 py-1 w-[72px] h-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-sm">
                <span className="text-base font-bold leading-tight text-slate-800 dark:text-slate-100">
                    {totalCount}
                </span>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-none">
                    Total
                </span>
            </div>

            {/* Direction Arrow Indicator */}
            <DirectionArrowIndicator activeKey={lastEntry?.key} />

            {/* Direction Count Card */}
            <div
                className={`flex flex-col items-center justify-center px-4 py-1 w-[72px] h-12 rounded-md shadow-sm transition-all duration-200 ${
                    activeConfig
                        ? activeConfig.colorBg
                        : "bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                }`}
            >
                <span className="text-base font-bold leading-tight">
                    {directionCount}
                </span>
                <span className="text-[11px] font-medium leading-none opacity-90">
                    Direction
                </span>
            </div>

            {/* Action Buttons Cluster */}
            <div className="flex items-center gap-1.5 ml-auto">
                {onExport && (
                    <Button
                        onClick={onExport}
                        disabled={counts.length === 0}
                        aria-label="Export Counts"
                        className="w-12 h-12 p-0 bg-[#1ca74c] hover:bg-green-700 text-white rounded-[10px] flex items-center justify-center shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download className="w-[22px] h-[22px]" />
                    </Button>
                )}
            </div>
        </div>
    )
}
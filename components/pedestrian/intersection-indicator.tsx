"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { MapPin, RotateCcw, Check } from "lucide-react"
import { VisualIndicator } from "@/components/visual-indicator"

export interface IntersectionPoint {
    id: string
    label: string
    bgColor: string
    textColor: string
    x?: number
    y?: number
}

interface IntersectionOverlayProps {
    intersections: IntersectionPoint[]
    isLabeling: boolean
    labelingStep: number
    showFinalConfirmation: boolean
    redoingIndex: number | null
    glowingIntersectionId?: string | null
    onVideoClick: (e: React.MouseEvent<HTMLDivElement>) => void
    onRedo: (index: number) => void
    onConfirmAll: () => void
}

export function IntersectionOverlay({
                                        intersections,
                                        isLabeling,
                                        labelingStep,
                                        showFinalConfirmation,
                                        redoingIndex,
                                        glowingIntersectionId,
                                        onVideoClick,
                                        onRedo,
                                        onConfirmAll,
                                    }: IntersectionOverlayProps) {
    const currentConfig = intersections[redoingIndex !== null ? redoingIndex : labelingStep] || intersections[0]

    return (
        <VisualIndicator>
            {/* Placed Markers with 1.5-Second Vibrant Glow Effect */}
            {intersections.map((point, index) => {
                if (point.x === undefined || point.y === undefined) return null

                const isCurrentlyMarking = isLabeling && (redoingIndex === index || (redoingIndex === null && labelingStep === index))
                const isActionGlowing = glowingIntersectionId?.startsWith(point.id)
                const isGlowing = isCurrentlyMarking || isActionGlowing

                return (
                    <div
                        key={point.id}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-auto"
                        style={{ left: `${point.x}%`, top: `${point.y}%` }}
                    >
                        {/* Ping Glow Background Indicator - Keyed to force restart on repeat clicks */}
                        {isGlowing && (
                            <div
                                key={glowingIntersectionId || `glow-${point.id}`}
                                className={`absolute rounded-full pointer-events-none animate-ping ${point.bgColor}`}
                                style={{
                                    width: "2.25rem",
                                    height: "2.25rem",
                                    opacity: 1,
                                    animationDuration: "1.5s",
                                }}
                            />
                        )}

                        <div
                            className={`w-5 h-5 rounded-full ${point.bgColor} border-2 border-white shadow-lg transition-all duration-300 relative z-10 ${
                                isGlowing ? "scale-110 shadow-xl" : ""
                            }`}
                        />
                        <span className="absolute top-6 whitespace-nowrap text-xs font-semibold px-2 py-0.5 rounded bg-black/75 text-white backdrop-blur-sm z-10">
                            {point.label.replace(" Intersection", "")}
                        </span>
                    </div>
                )
            })}

            {/* 4-Step Marking Overlay Prompt */}
            {isLabeling && !showFinalConfirmation && (
                <div
                    className="absolute inset-0 cursor-crosshair pointer-events-auto bg-black/40 backdrop-blur-sm z-40 animate-in fade-in duration-300"
                    onClick={onVideoClick}
                >
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-6 border border-white/20 max-w-sm">
                            <div className="flex items-center gap-3 mb-3">
                                <div className={`w-4 h-4 rounded-full ${currentConfig.bgColor} shadow-sm animate-pulse`} />
                                <h3 className="text-lg font-semibold text-gray-800">
                                    {redoingIndex !== null ? `Redo ${currentConfig.label}` : `Step ${labelingStep + 1} of 4`}
                                </h3>
                            </div>
                            <p className={`text-base font-medium ${currentConfig.textColor} mb-2`}>
                                Click to {redoingIndex !== null ? "replace" : "mark"}: {currentConfig.label}
                            </p>
                            <p className="text-sm text-gray-600">Click anywhere on the video to place the marker</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Final Review Confirmation Modal */}
            {showFinalConfirmation && (
                <div className="absolute inset-0 pointer-events-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
                    <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl border border-white/20 w-full max-w-md mx-auto animate-in slide-in-from-bottom-4 duration-500">
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <MapPin className="h-5 w-5 text-blue-600 flex-shrink-0" />
                                <h3 className="text-lg font-semibold text-gray-800">Review Intersection Points</h3>
                            </div>
                            <p className="text-sm text-gray-600 mb-6">
                                All 4 intersections have been marked. Click the redo button next to any point to adjust it, or confirm to continue.
                            </p>

                            <div className="space-y-3 mb-6">
                                {intersections.map((intersection, index) => (
                                    <div
                                        key={intersection.id}
                                        className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-gray-50/50 animate-in slide-in-from-left duration-300"
                                        style={{ animationDelay: `${index * 100}ms` }}
                                    >
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className={`w-3 h-3 rounded-full ${intersection.bgColor} shadow-sm flex-shrink-0`} />
                                            <span className="font-medium text-gray-700 truncate">{intersection.label}</span>
                                        </div>
                                        <Button
                                            onClick={() => onRedo(index)}
                                            variant="outline"
                                            size="sm"
                                            className="flex items-center gap-2 flex-shrink-0 ml-3 h-8 px-3 hover:scale-105 transition-transform duration-200"
                                        >
                                            <RotateCcw className="h-3 w-3" />
                                            <span className="text-xs">Redo</span>
                                        </Button>
                                    </div>
                                ))}
                            </div>

                            <Button
                                onClick={onConfirmAll}
                                className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2 h-12 hover:scale-105 transition-all duration-200"
                            >
                                <Check className="h-4 w-4" />
                                Confirm All Points
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </VisualIndicator>
    )
}
"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, Pause, Rewind, FastForward, HelpCircle, SkipBack, Download } from "lucide-react"
import { ControlsPanel } from "./controls-panel"

export type VehicleCategory = 'cut_through' | 'parking' | 'driving'
export type VehicleType = 'Car' | 'Moto' | 'Ebike' | 'Truck'

export interface CountEntry {
    id: string
    timestamp: string
    category: VehicleCategory
    type: VehicleType
    videoIndex: number
}

interface VideoControlsProps {
    isPlaying: boolean
    playbackRate: number
    onTogglePlay: () => void
    onChangePlaybackRate: (rate: number) => void
    isVideoLoaded: boolean
    onUndo: () => void
    onFinish: () => void
    onClearVideo: () => void
    canUndo: boolean
    canFinish: boolean
    currentTime: number
    duration: number
    onSeek: (time: number) => void
    onShowHelp?: () => void
    totalCount: number
    lastEntry?: CountEntry
    isDrawingMode: boolean
    onToggleDrawingMode: () => void
    onClearStrokes: () => void
    onExport: () => void
}

export default function VideoControls({
                                          isPlaying,
                                          playbackRate,
                                          onTogglePlay,
                                          onChangePlaybackRate,
                                          isVideoLoaded,
                                          onUndo,
                                          onFinish,
                                          onClearVideo,
                                          canUndo,
                                          canFinish,
                                          currentTime,
                                          duration,
                                          onSeek,
                                          onShowHelp,
                                          totalCount,
                                          lastEntry,
                                          isDrawingMode,
                                          onToggleDrawingMode,
                                          onClearStrokes,
                                      }: VideoControlsProps) {
    const [isScrubbing, setIsScrubbing] = useState(false)
    const scrubBarRef = useRef<HTMLDivElement>(null)
    const helpButtonRef = useRef<HTMLButtonElement>(null)

    const handleSlowDown = () => {
        const newRate = Math.max(0.25, playbackRate - 0.25)
        onChangePlaybackRate(newRate)
    }

    const handleSpeedUp = () => {
        const newRate = Math.min(16, playbackRate + 0.25)
        onChangePlaybackRate(newRate)
    }

    const formatTime = (timeInSeconds: number) => {
        if (isNaN(timeInSeconds) || timeInSeconds < 0) return "00:00"
        const minutes = Math.floor(timeInSeconds / 60)
        const seconds = Math.floor(timeInSeconds % 60)
        return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    }

    const handleScrub = useCallback(
        (e: React.MouseEvent | MouseEvent) => {
            if (!scrubBarRef.current || !isVideoLoaded || duration === 0) return

            const rect = scrubBarRef.current.getBoundingClientRect()
            const clickX = e.clientX - rect.left
            const percentage = Math.max(0, Math.min(1, clickX / rect.width))
            const newTime = percentage * duration
            onSeek(newTime)
        },
        [isVideoLoaded, duration, onSeek],
    )

    const handleScrubStart = useCallback(
        (e: React.MouseEvent) => {
            if (!isVideoLoaded) return
            e.preventDefault()
            e.stopPropagation()
            setIsScrubbing(true)
            handleScrub(e)
        },
        [isVideoLoaded, handleScrub],
    )

    const handleScrubEnd = useCallback(() => {
        setIsScrubbing(false)
    }, [])

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isScrubbing) {
                handleScrub(e)
            }
        }
        const handleMouseUp = () => {
            if (isScrubbing) {
                handleScrubEnd()
            }
        }

        window.addEventListener("mousemove", handleMouseMove)
        window.addEventListener("mouseup", handleMouseUp)

        return () => {
            window.removeEventListener("mousemove", handleMouseMove)
            window.removeEventListener("mouseup", handleMouseUp)
        }
    }, [isScrubbing, handleScrub, handleScrubEnd])

    const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0

    return (
        <Card className="shadow-lg rounded-t-none rounded-b-lg border-t-0">
            <CardContent className="p-4 flex flex-col gap-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700">
                <div
                    className="relative w-full h-2 bg-slate-300 dark:bg-slate-600 rounded-full cursor-pointer group transition-all duration-200 hover:h-3"
                    ref={scrubBarRef}
                    onMouseDown={handleScrubStart}
                >
                    <div
                        className="absolute h-full bg-primary rounded-full transition-all duration-100 ease-linear"
                        style={{ width: `${progressPercentage}%` }}
                    />
                    <div
                        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full shadow-md transition-all duration-200 group-hover:scale-125 group-hover:shadow-lg"
                        style={{
                            left: `${progressPercentage}%`,
                            transform: `translateX(-50%) translateY(-50%)`,
                            boxShadow: isScrubbing ? "0 0 12px rgba(59, 130, 246, 0.5)" : undefined,
                        }}
                    />
                </div>

                <div className="flex justify-between text-sm font-medium text-slate-700 dark:text-slate-300 tabular-nums">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                </div>

                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                        {/* Skip Back 5s Button */}
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => onSeek(Math.max(0, currentTime - 5))}
                            disabled={!isVideoLoaded}
                            className="w-12 h-12 flex items-center justify-center hover:bg-accent bg-white dark:bg-slate-700 transition-all duration-200 shadow-sm border-slate-200 dark:border-slate-600 hover:scale-105 hover:shadow-lg disabled:hover:scale-100"
                            title="Back 5s"
                        >
                            <SkipBack className="h-5 w-5 transition-transform duration-200"/>
                        </Button>

                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleSlowDown}
                            disabled={!isVideoLoaded || playbackRate <= 0.25}
                            className="w-12 h-12 flex items-center justify-center hover:bg-accent bg-white dark:bg-slate-700 transition-all duration-200 shadow-sm border-slate-200 dark:border-slate-600 hover:scale-105 hover:shadow-lg disabled:hover:scale-100"
                            title="Slow down (←)"
                        >
                            <Rewind className="h-5 w-5 transition-transform duration-200"/>
                        </Button>

                        <Button
                            variant="outline"
                            size="lg"
                            onClick={onTogglePlay}
                            disabled={!isVideoLoaded}
                            className="flex-1 h-12 flex items-center justify-center bg-white dark:bg-slate-700 hover:bg-accent transition-all duration-200 shadow-sm border-slate-200 dark:border-slate-600 font-semibold text-base hover:scale-105 hover:shadow-lg disabled:hover:scale-100"
                        >
                            {isPlaying ? (
                                <>
                                    <Pause className="h-5 w-5 mr-3 transition-transform duration-200"/>
                                    <span className="leading-none">Pause</span>
                                </>
                            ) : (
                                <>
                                    <Play className="h-5 w-5 mr-3 transition-transform duration-200"/>
                                    <span className="leading-none">Play</span>
                                </>
                            )}
                        </Button>

                        <div
                            className="flex items-center bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg shadow-sm h-12 px-4 gap-3">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 min-w-[50px] text-center">
                {playbackRate.toFixed(2)}x
              </span>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onChangePlaybackRate(Math.max(0.25, playbackRate - 0.25))}
                                    disabled={!isVideoLoaded}
                                    className="h-7 px-2 text-xs font-bold"
                                    title="Slow down"
                                >
                                    -
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onChangePlaybackRate(playbackRate + 0.25)}
                                    disabled={!isVideoLoaded}
                                    className="h-7 px-2 text-xs font-bold"
                                    title="Speed up"
                                >
                                    +
                                </Button>
                            </div>
                        </div>

                        <Button
                            ref={helpButtonRef}
                            variant="outline"
                            size="icon"
                            onClick={onShowHelp}
                            data-help-trigger
                            className="w-12 h-12 flex items-center justify-center hover:bg-accent bg-white dark:bg-slate-700 transition-all duration-200 shadow-sm border-slate-200 dark:border-slate-600 hover:scale-105 hover:shadow-lg"
                            title="Help (?)"
                        >
                            <HelpCircle className="h-5 w-5 transition-transform duration-200"/>
                        </Button>
                    </div>

                    <div className="flex items-center flex-1 justify-end w-full">
                        <ControlsPanel
                            lastEntry={lastEntry}
                            isDrawingMode={isDrawingMode}
                            onToggleDrawingMode={onToggleDrawingMode}
                            onClearStrokes={onClearStrokes}
                            onExport={onFinish}
                            totalCount={totalCount}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
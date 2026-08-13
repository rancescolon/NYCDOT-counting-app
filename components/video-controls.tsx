"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, Pause, HelpCircle, Undo } from "lucide-react"
import { ControlsPanel } from "./controls-panel"
import { VideoToolConfig } from "@/lib/config/video-tool.config"

interface VideoControlsProps {
    videoRef: React.RefObject<HTMLVideoElement>
    isPlaying: boolean
    playbackRate: number
    onTogglePlay: () => void
    onChangePlaybackRate: (rate: number) => void
    isVideoLoaded: boolean
    config: VideoToolConfig
    onUndo?: () => void
    canUndo?: boolean
    onShowHelp?: () => void
    children?: React.ReactNode
}

export default function VideoControls({
                                          videoRef,
                                          isPlaying,
                                          playbackRate,
                                          onTogglePlay,
                                          onChangePlaybackRate,
                                          isVideoLoaded,
                                          config,
                                          onUndo,
                                          canUndo = false,
                                          onShowHelp,
                                          children
                                      }: VideoControlsProps) {
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [isScrubbing, setIsScrubbing] = useState(false)

    const scrubBarRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const video = videoRef.current
        if (!video) return

        const updateTime = () => setCurrentTime(video.currentTime)
        const updateDuration = () => setDuration(video.duration || 0)

        video.addEventListener("timeupdate", updateTime)
        video.addEventListener("loadedmetadata", updateDuration)
        video.addEventListener("durationchange", updateDuration)

        setCurrentTime(video.currentTime || 0)
        setDuration(video.duration || 0)

        return () => {
            video.removeEventListener("timeupdate", updateTime)
            video.removeEventListener("loadedmetadata", updateDuration)
            video.removeEventListener("durationchange", updateDuration)
        }
    }, [videoRef, isVideoLoaded])

    const formatTime = (timeInSeconds: number) => {
        if (isNaN(timeInSeconds) || timeInSeconds < 0) return "00:00"
        const minutes = Math.floor(timeInSeconds / 60)
        const seconds = Math.floor(timeInSeconds % 60)
        return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    }

    const handleSeek = useCallback((time: number) => {
        if (videoRef.current) {
            videoRef.current.currentTime = time
            setCurrentTime(time)
        }
    }, [videoRef])

    const handleScrub = useCallback((e: React.MouseEvent | MouseEvent) => {
        if (!scrubBarRef.current || !isVideoLoaded || duration === 0) return
        const rect = scrubBarRef.current.getBoundingClientRect()
        const clickX = e.clientX - rect.left
        const percentage = Math.max(0, Math.min(1, clickX / rect.width))
        handleSeek(percentage * duration)
    }, [isVideoLoaded, duration, handleSeek])

    const handleScrubStart = useCallback((e: React.MouseEvent) => {
        if (!isVideoLoaded) return
        e.preventDefault()
        e.stopPropagation()
        setIsScrubbing(true)
        handleScrub(e)
    }, [isVideoLoaded, handleScrub])

    const handleScrubEnd = useCallback(() => setIsScrubbing(false), [])

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => { if (isScrubbing) handleScrub(e) }
        const handleMouseUp = () => { if (isScrubbing) handleScrubEnd() }
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
                {config.features.scrubBar && (
                    <>
                        <div
                            className="relative w-full h-2 bg-slate-300 dark:bg-slate-600 rounded-full cursor-pointer group transition-all duration-200 hover:h-3"
                            ref={scrubBarRef}
                            onMouseDown={handleScrubStart}
                        >
                            <div className="absolute h-full bg-primary rounded-full transition-all duration-100 ease-linear" style={{ width: `${progressPercentage}%` }} />
                            <div
                                className="absolute top-1/2 w-4 h-4 bg-primary rounded-full shadow-md transition-all duration-200 group-hover:scale-125"
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
                    </>
                )}

                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                        {config.features.playbackControls && (
                            <Button
                                variant="outline"
                                size="lg"
                                onClick={onTogglePlay}
                                disabled={!isVideoLoaded}
                                className="flex-1 h-12 flex items-center justify-center font-semibold text-base"
                            >
                                {isPlaying ? (
                                    <><Pause className="h-5 w-5 mr-3" /> Pause</>
                                ) : (
                                    <><Play className="h-5 w-5 mr-3" /> Play</>
                                )}
                            </Button>
                        )}

                        {config.features.speedAdjustment && (
                            <div className="flex items-center bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg shadow-sm h-12 px-4 gap-3">
                                <span className="text-sm font-semibold min-w-[50px] text-center">
                                    {playbackRate.toFixed(2)}x
                                </span>
                                <div className="flex items-center gap-1.5">
                                    <Button variant="ghost" size="sm" onClick={() => onChangePlaybackRate(Math.max(0.25, playbackRate - 0.25))} disabled={!isVideoLoaded} className="h-8 w-8 text-lg font-bold">
                                        -
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => onChangePlaybackRate(playbackRate + 0.25)} disabled={!isVideoLoaded} className="h-8 w-8 text-lg font-bold">
                                        +
                                    </Button>
                                </div>
                            </div>
                        )}

                        {config.features.help && onShowHelp && (
                            <Button variant="outline" size="icon" onClick={onShowHelp} className="w-12 h-12">
                                <HelpCircle className="h-5 w-5" />
                            </Button>
                        )}

                        {config.features.undoRedo && onUndo && (
                            <Button variant="outline" size="icon" onClick={onUndo} disabled={!canUndo} className="w-12 h-12">
                                <Undo className="h-5 w-5" />
                            </Button>
                        )}
                    </div>

                    <div className="flex items-center flex-1 justify-end w-full">
                        <ControlsPanel>
                            {children}
                        </ControlsPanel>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
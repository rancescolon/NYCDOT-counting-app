"use client"

import React, { useState, useRef, useCallback, useEffect } from "react"
import VideoPlayer from "@/components/video-player"
import VideoControls from "@/components/video-controls"
import VideoEndPrompt from "@/components/video-end-prompt"
import VideoTimeInputDialog from "@/components/video-time-input-dialog"
import VideoRestorePrompt from "@/components/video-restore-prompt"
import HelpSidebar from "@/components/help-sidebar"
import { videoToolConfigs } from "@/lib/config/video-tool.config"
import { HelpSidebarConfig } from "@/lib/config/sidebar.config"
import { IntersectionOverlay, IntersectionPoint } from "./intersection-indicator"
import { PedestrianControls } from "./pedestrian-controls"
import * as XLSX from "xlsx-js-style"

const KEY_ACTION_MAPPINGS: Record<string, { label: string; intersectionId: string }> = {
    "1": { label: "Count Eastbound (North)", intersectionId: "north" },
    "2": { label: "Count Westbound (North)", intersectionId: "north" },
    "3": { label: "Count Eastbound (South)", intersectionId: "south" },
    "4": { label: "Count Westbound (South)", intersectionId: "south" },
    "5": { label: "Count Northbound (East)", intersectionId: "east" },
    "6": { label: "Count Southbound (East)", intersectionId: "east" },
    "7": { label: "Count Northbound (West)", intersectionId: "west" },
    "8": { label: "Count Southbound (West)", intersectionId: "west" },
}

export default function PedestrianPage() {
    const videoRef = useRef<HTMLVideoElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const config = videoToolConfigs.pedestrian
    const sidebarConfig = HelpSidebarConfig.pedestrian

    // Video States
    const [videoSrc, setVideoSrc] = useState<string | null>(null)
    const [videoFiles, setVideoFiles] = useState<File[]>([])
    const [currentFileIndex, setCurrentFileIndex] = useState(0)
    const [isPlaying, setIsPlaying] = useState(false)
    const [playbackRate, setPlaybackRate] = useState(1.0)

    // UI Dialog States
    const [showHelp, setShowHelp] = useState(false)
    const [showEndPrompt, setShowEndPrompt] = useState(false)
    const [showTimePrompt, setShowTimePrompt] = useState(false)
    const [showRestorePrompt, setShowRestorePrompt] = useState(false)
    const [videoStartTime, setVideoStartTime] = useState<Date | null>(null)

    // Intersection Marking States
    const [intersections, setIntersections] = useState<IntersectionPoint[]>([
        { id: "north", label: "North Intersection", bgColor: "bg-blue-500", textColor: "text-blue-600" },
        { id: "east", label: "East Intersection", bgColor: "bg-emerald-500", textColor: "text-emerald-600" },
        { id: "south", label: "South Intersection", bgColor: "bg-red-500", textColor: "text-red-600" },
        { id: "west", label: "West Intersection", bgColor: "bg-amber-500", textColor: "text-amber-600" },
    ])
    const [isLabeling, setIsLabeling] = useState(false)
    const [labelingStep, setLabelingStep] = useState(0)
    const [redoingIndex, setRedoingIndex] = useState<number | null>(null)
    const [showFinalConfirmation, setShowFinalConfirmation] = useState(false)

    // Glow Effect State (1 second duration)
    const [glowingIntersectionId, setGlowingIntersectionId] = useState<string | null>(null)
    const glowTimerRef = useRef<NodeJS.Timeout | null>(null)

    // Logged Counts State
    const [counts, setCounts] = useState<any[]>([])
    const [redoCounts, setRedoCounts] = useState<any[]>([])

    // Refs to prevent stale closures and StrictMode duplication bugs on undo/redo
    const countsRef = useRef(counts)
    useEffect(() => {
        countsRef.current = counts
    }, [counts])

    const redoCountsRef = useRef(redoCounts)
    useEffect(() => {
        redoCountsRef.current = redoCounts
    }, [redoCounts])

    // Load stored counts from localStorage on initial render
    useEffect(() => {
        try {
            const savedCounts = localStorage.getItem("pedestrian_logged_counts")
            if (savedCounts) {
                setCounts(JSON.parse(savedCounts))
            }
        } catch (error) {
            console.error("Failed to load stored counts:", error)
        }
    }, [])

    // Sync counts with localStorage whenever updated
    useEffect(() => {
        try {
            localStorage.setItem("pedestrian_logged_counts", JSON.stringify(counts))
        } catch (error) {
            console.error("Failed to save counts to storage:", error)
        }
    }, [counts])

    const triggerGlow = useCallback((intersectionId: string) => {
        if (glowTimerRef.current) {
            clearTimeout(glowTimerRef.current)
        }
        // Append Date.now() so back-to-back inputs force the animation to restart
        setGlowingIntersectionId(`${intersectionId}-${Date.now()}`)
        glowTimerRef.current = setTimeout(() => {
            setGlowingIntersectionId(null)
        }, 1500)
    }, [])

    // File Handlers
    const handleFilesSelect = useCallback((files: File[]) => {
        setVideoFiles(files)
        setCurrentFileIndex(0)
        setVideoSrc(URL.createObjectURL(files[0]))
        setShowTimePrompt(true)
        setIsLabeling(true)
        setLabelingStep(0)
    }, [])

    const handlePlayToggle = useCallback(() => {
        if (!videoRef.current) return
        if (isPlaying) {
            videoRef.current.pause()
        } else {
            videoRef.current.play()
        }
        setIsPlaying(!isPlaying)
    }, [isPlaying])

    const handleRateChange = useCallback((rate: number) => {
        if (videoRef.current) {
            videoRef.current.playbackRate = rate
            setPlaybackRate(rate)
        }
    }, [])

    // Coordinate Marker Click Handler
    const handleVideoClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current) return
        const rect = containerRef.current.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 100
        const y = ((e.clientY - rect.top) / rect.height) * 100

        const targetIndex = redoingIndex !== null ? redoingIndex : labelingStep

        setIntersections((prev) =>
            prev.map((item, idx) => (idx === targetIndex ? { ...item, x, y } : item))
        )

        if (redoingIndex !== null) {
            setRedoingIndex(null)
            setShowFinalConfirmation(true)
        } else if (labelingStep < 3) {
            setLabelingStep((prev) => prev + 1)
        } else {
            setShowFinalConfirmation(true)
        }
    }

    const handleRedo = (index: number) => {
        setRedoingIndex(index)
        setShowFinalConfirmation(false)
    }

    const handleConfirmAll = () => {
        setShowFinalConfirmation(false)
        setIsLabeling(false)
    }

    // Count Recording Handler
    const handleCount = useCallback(
        (key: string) => {
            if (!videoRef.current || !isPlaying) return

            const timestamp = videoRef.current.currentTime
            const mappingInfo = KEY_ACTION_MAPPINGS[key]
            const targetIntersectionId = mappingInfo?.intersectionId || intersections[0]?.id

            if (targetIntersectionId) {
                triggerGlow(targetIntersectionId)
            }

            const currentFileName = videoFiles[currentFileIndex]?.name || "Unsaved_Video.mp4"
            const realTimeFormatted = videoStartTime
                ? new Date(videoStartTime.getTime() + timestamp * 1000).toISOString()
                : new Date().toISOString()

            const currentCounts = countsRef.current

            const newCount = {
                id: Date.now().toString(),
                countNumber: currentCounts.length + 1,
                key,
                actionLabel: mappingInfo?.label || `Action Key ${key}`,
                intersection: targetIntersectionId ? targetIntersectionId.toUpperCase() : "GENERAL",
                videoTimestampSeconds: Number(timestamp.toFixed(2)),
                videoTimeFormatted: new Date(timestamp * 1000).toISOString().substring(11, 19),
                recordedAtRealTime: realTimeFormatted,
                videoFile: currentFileName,
            }

            setCounts([...currentCounts, newCount])
            setRedoCounts([]) // Clear redo array on new action
        },
        [isPlaying, videoFiles, currentFileIndex, videoStartTime, intersections, triggerGlow]
    )

    // Undo / Redo Handlers
    const handleUndo = useCallback(() => {
        const current = countsRef.current
        if (current.length === 0) return

        const last = current[current.length - 1]
        setCounts(current.slice(0, -1))
        setRedoCounts((prev) => [...prev, last])
    }, [])

    const handleRedoCount = useCallback(() => {
        const currentRedo = redoCountsRef.current
        if (currentRedo.length === 0) return

        const next = currentRedo[currentRedo.length - 1]
        setRedoCounts(currentRedo.slice(0, -1))
        setCounts((prev) => [...prev, next])

        // Trigger the correct intersection glow
        if (next.intersection && next.intersection !== "GENERAL") {
            triggerGlow(next.intersection.toLowerCase())
        }
    }, [triggerGlow])

    // Excel Export Functionality
    const handleExportExcel = useCallback(() => {
        if (counts.length === 0) {
            alert("No count data recorded yet to export.")
            return
        }

        const formattedData = counts.map((item, idx) => ({
            "Record #": idx + 1,
            "Action Description": item.actionLabel,
            "Key Pressed": item.key,
            "Intersection Zone": item.intersection,
            "Video Time (hh:mm:ss)": item.videoTimeFormatted,
            "Video Position (sec)": item.videoTimestampSeconds,
            "Real-World Timestamp": item.recordedAtRealTime,
            "Source Video File": item.videoFile,
        }))

        const worksheet = XLSX.utils.json_to_sheet(formattedData)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, "Pedestrian Counts")

        // Auto-fit columns
        const maxCols = Object.keys(formattedData[0] || {}).map((key) => ({
            wch: Math.max(key.length, 22),
        }))
        worksheet["!cols"] = maxCols

        const fileName = `Pedestrian_Counts_Export_${new Date().toISOString().slice(0, 10)}.xlsx`
        XLSX.writeFile(workbook, fileName)
    }, [counts])

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Prevent hotkeys from firing if user is typing in an input field
            if (
                e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement ||
                (e.target as Element)?.closest("[contenteditable]")
            ) {
                return
            }

            const key = e.key.toLowerCase()

            if (["1", "2", "3", "4", "5", "6", "7", "8"].includes(key)) {
                e.preventDefault()
                handleCount(key)
            } else if (key === " " && videoSrc) {
                e.preventDefault()
                handlePlayToggle()
            } else if (key === "z") {
                e.preventDefault()
                handleUndo()
            } else if (key === "r") {
                e.preventDefault()
                handleRedoCount()
            } else if (key === "?") {
                e.preventDefault()
                setShowHelp((prev) => !prev)
            } else if (key === "arrowup" && videoSrc) {
                e.preventDefault()
                handleRateChange(Math.min(16, playbackRate + 0.25))
            } else if (key === "arrowdown" && videoSrc) {
                e.preventDefault()
                handleRateChange(Math.max(0.25, playbackRate - 0.25))
            } else if (key === "arrowleft" && videoSrc && videoRef.current) {
                e.preventDefault()
                videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 5)
            } else if (key === "arrowright" && videoSrc && videoRef.current) {
                e.preventDefault()
                videoRef.current.currentTime = Math.min(videoRef.current.duration || 0, videoRef.current.currentTime + 5)
            }
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [handleCount, handlePlayToggle, handleUndo, handleRedoCount, handleRateChange, playbackRate, videoSrc])

    return (
        <div className="flex pt-16 px-4 pb-4 h-screen w-full overflow-hidden bg-slate-50 dark:bg-slate-900">
            <div className="flex-1 flex flex-col gap-2 h-full overflow-hidden transition-all duration-300">
                <div
                    ref={containerRef}
                    className="relative flex-1 bg-black rounded-lg overflow-hidden flex items-center justify-center shadow-xl border border-slate-200 dark:border-slate-800"
                >
                    <VideoPlayer
                        ref={videoRef}
                        videoSrc={videoSrc}
                        onFilesSelect={handleFilesSelect}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        onTimeUpdate={() => {}}
                        onLoadedMetadata={() => {}}
                    />

                    {videoSrc && (
                        <IntersectionOverlay
                            intersections={intersections}
                            isLabeling={isLabeling}
                            labelingStep={labelingStep}
                            showFinalConfirmation={showFinalConfirmation}
                            redoingIndex={redoingIndex}
                            glowingIntersectionId={glowingIntersectionId}
                            onVideoClick={handleVideoClick}
                            onRedo={handleRedo}
                            onConfirmAll={handleConfirmAll}
                        />
                    )}
                </div>

                <div className="z-20 shrink-0">
                    <VideoControls
                        videoRef={videoRef}
                        isPlaying={isPlaying}
                        playbackRate={playbackRate}
                        onTogglePlay={handlePlayToggle}
                        onChangePlaybackRate={handleRateChange}
                        isVideoLoaded={!!videoSrc}
                        config={config}
                        onUndo={handleUndo}
                        canUndo={counts.length > 0}
                        onShowHelp={() => setShowHelp(true)}
                        controlsAlignment="left"
                    >
                        <PedestrianControls
                            counts={counts}
                            onExport={handleExportExcel}
                        />
                    </VideoControls>
                </div>
            </div>

            {showHelp && (
                <div className="w-80 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-y-auto">
                    <HelpSidebar
                        isOpen={showHelp}
                        onClose={() => setShowHelp(false)}
                        config={sidebarConfig}
                        onUndo={handleUndo}
                        canUndo={counts.length > 0}
                        onAction={handleCount}
                        context={{ canUndo: counts.length > 0, intersectionsSet: !isLabeling }}
                    />
                </div>
            )}

            <VideoEndPrompt
                isOpen={showEndPrompt}
                onAddMoreVideos={handleFilesSelect}
                onStartNewSection={() => {
                    setVideoSrc(null)
                    setCounts([])
                    setRedoCounts([])
                    localStorage.removeItem("pedestrian_logged_counts")
                    setShowEndPrompt(false)
                }}
                onExport={handleExportExcel}
                onReview={() => setShowEndPrompt(false)}
                totalCounts={counts.length}
                videoCount={videoFiles.length}
            />

            <VideoTimeInputDialog
                isOpen={showTimePrompt}
                onConfirm={(date) => {
                    setVideoStartTime(date)
                    setShowTimePrompt(false)
                }}
                onSkip={() => setShowTimePrompt(false)}
            />

            {showRestorePrompt && (
                <VideoRestorePrompt
                    isOpen={showRestorePrompt}
                    onDismiss={() => setShowRestorePrompt(false)}
                    onVideoRestore={(file) => handleFilesSelect([file])}
                    savedData={{
                        currentTime: 0,
                        duration: 100,
                        totalCounts: counts.length,
                        intersectionCount: 1,
                        lastSaved: Date.now(),
                    }}
                />
            )}
        </div>
    )
}
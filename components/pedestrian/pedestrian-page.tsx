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
import { useVideoQueue } from "@/hooks/use-video-queue"
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
    const containerRef = useRef<HTMLDivElement>(null)
    const config = videoToolConfigs.pedestrian
    const sidebarConfig = HelpSidebarConfig.pedestrian

    // Use the comprehensive Video Queue hook
    const {
        videoRef,
        sessionFiles,
        videoSrc,
        currentVideoIndex,
        videoCount,
        isPlaying,
        playbackRate,
        recordingStartTime,
        setRecordingStartTime,
        togglePlay,
        updatePlaybackRate,
        seekBy,
        handleClearVideo,
        handleAddMoreVideos,
        handleFilesSelect: baseHandleFilesSelect,
        videoPlayerProps
    } = useVideoQueue({
        onQueueEnd: () => setShowEndPrompt(true)
    })

    // UI Dialog States
    const [showHelp, setShowHelp] = useState(false)
    const [showEndPrompt, setShowEndPrompt] = useState(false)
    const [showTimePrompt, setShowTimePrompt] = useState(false)
    const [showRestorePrompt, setShowRestorePrompt] = useState(false)

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

    // Glow Effect State
    const [glowingIntersectionId, setGlowingIntersectionId] = useState<string | null>(null)
    const glowTimerRef = useRef<NodeJS.Timeout | null>(null)

    // Logged Counts State
    const [counts, setCounts] = useState<any[]>([])
    const [redoCounts, setRedoCounts] = useState<any[]>([])

    const countsRef = useRef(counts)
    useEffect(() => { countsRef.current = counts }, [counts])

    const redoCountsRef = useRef(redoCounts)
    useEffect(() => { redoCountsRef.current = redoCounts }, [redoCounts])

    useEffect(() => {
        try {
            const savedCounts = localStorage.getItem("pedestrian_logged_counts")
            if (savedCounts) setCounts(JSON.parse(savedCounts))
        } catch (error) {
            console.error("Failed to load stored counts:", error)
        }
    }, [])

    useEffect(() => {
        try {
            localStorage.setItem("pedestrian_logged_counts", JSON.stringify(counts))
        } catch (error) {
            console.error("Failed to save counts to storage:", error)
        }
    }, [counts])

    const triggerGlow = useCallback((intersectionId: string) => {
        if (glowTimerRef.current) clearTimeout(glowTimerRef.current)
        setGlowingIntersectionId(`${intersectionId}-${Date.now()}`)
        glowTimerRef.current = setTimeout(() => setGlowingIntersectionId(null), 1500)
    }, [])

    // Wraps the base handle files to also trigger UI popups specific to this page
    const handleFilesSelect = useCallback((files: File[]) => {
        baseHandleFilesSelect(files)
        setShowTimePrompt(true)
        setIsLabeling(true)
        setLabelingStep(0)
    }, [baseHandleFilesSelect])

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

    const handleCount = useCallback(
        (key: string) => {
            if (!videoRef.current || !isPlaying) return

            const timestamp = videoRef.current.currentTime
            const mappingInfo = KEY_ACTION_MAPPINGS[key]
            const targetIntersectionId = mappingInfo?.intersectionId || intersections[0]?.id

            if (targetIntersectionId) triggerGlow(targetIntersectionId)

            const currentFileName = sessionFiles[currentVideoIndex]?.name || "Unsaved_Video.mp4"
            const realTimeFormatted = recordingStartTime
                ? new Date(recordingStartTime.getTime() + timestamp * 1000).toISOString()
                : new Date().toISOString()

            const newCount = {
                id: Date.now().toString(),
                countNumber: countsRef.current.length + 1,
                key,
                actionLabel: mappingInfo?.label || `Action Key ${key}`,
                intersection: targetIntersectionId ? targetIntersectionId.toUpperCase() : "GENERAL",
                videoTimestampSeconds: Number(timestamp.toFixed(2)),
                videoTimeFormatted: new Date(timestamp * 1000).toISOString().substring(11, 19),
                recordedAtRealTime: realTimeFormatted,
                videoFile: currentFileName,
            }

            setCounts([...countsRef.current, newCount])
            setRedoCounts([])
        },
        [isPlaying, sessionFiles, currentVideoIndex, recordingStartTime, intersections, triggerGlow, videoRef]
    )

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

        if (next.intersection && next.intersection !== "GENERAL") {
            triggerGlow(next.intersection.toLowerCase())
        }
    }, [triggerGlow])

    const handleExportExcel = useCallback(() => {
        if (counts.length === 0) return alert("No count data recorded yet to export.")

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
        worksheet["!cols"] = Object.keys(formattedData[0] || {}).map((key) => ({ wch: Math.max(key.length, 22) }))
        XLSX.writeFile(workbook, `Pedestrian_Counts_Export_${new Date().toISOString().slice(0, 10)}.xlsx`)
    }, [counts])

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || (e.target as Element)?.closest("[contenteditable]")) return

            const key = e.key.toLowerCase()

            if (["1", "2", "3", "4", "5", "6", "7", "8"].includes(key)) {
                e.preventDefault()
                handleCount(key)
            } else if (key === " " && videoSrc) {
                e.preventDefault()
                togglePlay()
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
                updatePlaybackRate(playbackRate + 0.25)
            } else if (key === "arrowdown" && videoSrc) {
                e.preventDefault()
                updatePlaybackRate(playbackRate - 0.25)
            } else if (key === "arrowleft" && videoSrc) {
                e.preventDefault()
                seekBy(-5)
            } else if (key === "arrowright" && videoSrc) {
                e.preventDefault()
                seekBy(5)
            }
        }
        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [handleCount, togglePlay, handleUndo, handleRedoCount, updatePlaybackRate, seekBy, playbackRate, videoSrc])

    return (
        <div className="flex pt-16 px-4 pb-4 h-screen w-full overflow-hidden bg-slate-50 dark:bg-slate-900">
            <div className="flex-1 flex flex-col gap-2 h-full overflow-hidden transition-all duration-300">
                <div ref={containerRef} className="relative flex-1 bg-black rounded-lg overflow-hidden flex items-center justify-center shadow-xl border border-slate-200 dark:border-slate-800">
                    <VideoPlayer
                        {...videoPlayerProps}
                        onFilesSelect={handleFilesSelect}
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
                        onTogglePlay={togglePlay}
                        onChangePlaybackRate={updatePlaybackRate}
                        isVideoLoaded={!!videoSrc}
                        config={config}
                        onUndo={handleUndo}
                        canUndo={counts.length > 0}
                        onShowHelp={() => setShowHelp(true)}
                        controlsAlignment="left"
                    >
                        <PedestrianControls counts={counts} onExport={handleExportExcel} />
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
                onAddMoreVideos={(files) => {
                    handleAddMoreVideos(files, true)
                    setShowEndPrompt(false) // Added this mapping
                }}
                onStartNewSection={() => {
                    handleClearVideo()
                    setCounts([])
                    setRedoCounts([])
                    localStorage.removeItem("pedestrian_logged_counts")
                    setShowEndPrompt(false)
                }}
                onCancel={() => setShowEndPrompt(false)} // Added this mapping
                onExport={handleExportExcel}
                onReview={() => setShowEndPrompt(false)}
                totalCounts={counts.length}
                videoCount={videoCount}
            />

            <VideoTimeInputDialog
                isOpen={showTimePrompt}
                onConfirm={(date) => {
                    setRecordingStartTime(date)
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
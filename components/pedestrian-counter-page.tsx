"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import VideoPlayer from "@/components/video-player"
import VideoControls from "@/components/video-controls"
import ExportProgressModal from "@/components/export-progress-modal"
import HelpSidebar from "@/components/help-sidebar"
import VideoRestorePrompt from "@/components/video-restore-prompt"
import VideoTimeInputDialog from "@/components/video-time-input-dialog"
import VideoEndPrompt from "@/components/video-end-prompt"
import { VideoOverlay } from "@/components/video-overlay" // New Canvas Component
import { useVehicleInput } from "@/hooks/use-vehicle-input" // New Input Hook

// --- Data Models ---
export type VehicleCategory = 'cut_through' | 'parking' | 'driving'
export type VehicleType = 'Car' | 'Moto' | 'Ebike' | 'Truck'

export interface CountEntry {
  id: string
  timestamp: string // Formatted time
  category: VehicleCategory
  type: VehicleType
  videoIndex: number
}

export interface Stroke {
  id: string
  points: { x: number; y: number }[]
}

interface VideoMetadata {
  recordingStartTime: Date | null
  strokes: Stroke[] // Saving drawn lines per video instead of intersections
}

interface SavedState {
  entries: CountEntry[]
  strokes: Stroke[]
  videoSrc: string | null
  playbackRate: number
  currentTime: number
  duration: number
  lastSaved: number
  videoFileName?: string
  recordingStartTime?: string
  videoCount: number
  currentVideoIndex: number
  videoMetadata: Record<number, VideoMetadata>
}

const STORAGE_KEY = "vehicle-counter-data"
const AUTO_SAVE_INTERVAL = 5000

export default function PedestrianCounterPage() {
  // Core Tracking State
  const [entries, setEntries] = useState<CountEntry[]>([])
  const [strokes, setStrokes] = useState<Stroke[]>([])
  const [isDrawingMode, setIsDrawingMode] = useState(false)

  const [isShiftHeld, setIsShiftHeld] = useState(false)

  // Tracks if the Shift key is physically held down
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setIsShiftHeld(true)
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setIsShiftHeld(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // The true drawing mode is active if the button is toggled ON, OR if Shift is held down
  const activeDrawingMode = isDrawingMode || isShiftHeld



  // Video & Playback State
  const [videoSrc, setVideoSrc] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  // UI & Metadata State
  const [showExportModal, setShowExportModal] = useState(false)
  const [showHelpSidebar, setShowHelpSidebar] = useState(false)
  const [isDataLoaded, setIsDataLoaded] = useState(false)
  const [showVideoRestorePrompt, setShowVideoRestorePrompt] = useState(false)
  const [savedStateForRestore, setSavedStateForRestore] = useState<SavedState | null>(null)
  const [pendingVideoRestore, setPendingVideoRestore] = useState(false)
  const [showTimeInputDialog, setShowTimeInputDialog] = useState(false)
  const [recordingStartTime, setRecordingStartTime] = useState<Date | null>(null)
  const [showVideoEndPrompt, setShowVideoEndPrompt] = useState(false)
  const [videoCount, setVideoCount] = useState(1)
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const [videoMetadata, setVideoMetadata] = useState<Record<number, VideoMetadata>>({})
  const [isExporting, setIsExporting] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // --- Handlers for Vehicle Hook ---
  const formatCurrentTimestamp = () => {
    // Falls back to local clock if no video start time is present
    if (recordingStartTime && videoRef.current) {
      const actualTime = new Date(recordingStartTime.getTime() + videoRef.current.currentTime * 1000)
      return actualTime.toTimeString().split(' ')[0]
    }
    return new Date().toTimeString().split(' ')[0]
  }

  const handleLog = useCallback((category: VehicleCategory, type: VehicleType) => {
    if (!videoSrc) return
    setEntries((prev) => [...prev, {
      id: Date.now().toString(),
      timestamp: formatCurrentTimestamp(),
      category,
      type,
      videoIndex: currentVideoIndex
    }])
  }, [videoSrc, currentVideoIndex, recordingStartTime])

  const handleUndoVehicle = useCallback(() => {
    setEntries((prev) => prev.slice(0, -1))
  }, [])

  const handleUndoStroke = useCallback(() => {
    setStrokes((prev) => prev.slice(0, -1))
  }, [])

  const handleAddStroke = useCallback((stroke: Stroke) => {
    setStrokes((prev) => [...prev, stroke])
  }, [])

  // Initialize Keybind Interceptor Hook
  useVehicleInput(handleLog, handleUndoVehicle, handleUndoStroke, activeDrawingMode)

  // --- Storage Functions ---
  const saveToStorage = useCallback(() => {
    try {
      const dataToSave: SavedState = {
        entries,
        strokes,
        videoSrc,
        playbackRate,
        currentTime: videoRef.current?.currentTime || currentTime,
        duration,
        lastSaved: Date.now(),
        recordingStartTime: recordingStartTime?.toISOString(),
        videoCount,
        currentVideoIndex,
        videoMetadata,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave))
    } catch (error) {
      console.error("Failed to save data:", error)
    }
  }, [entries, strokes, videoSrc, playbackRate, currentTime, duration, recordingStartTime, videoCount, currentVideoIndex, videoMetadata])

  const loadFromStorage = useCallback(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY)
      if (savedData) {
        const parsedData: SavedState = JSON.parse(savedData)
        const maxAge = 7 * 24 * 60 * 60 * 1000

        if (Date.now() - parsedData.lastSaved > maxAge) {
          localStorage.removeItem(STORAGE_KEY)
          return false
        }

        if (parsedData.videoSrc && (parsedData.entries?.length > 0 || parsedData.strokes?.length > 0)) {
          setSavedStateForRestore(parsedData)
          setShowVideoRestorePrompt(true)
        }

        setEntries(parsedData.entries || [])
        setStrokes(parsedData.strokes || [])
        setVideoSrc(parsedData.videoSrc || null)
        setPlaybackRate(parsedData.playbackRate || 1)
        setCurrentTime(parsedData.currentTime || 0)
        setDuration(parsedData.duration || 0)
        setRecordingStartTime(parsedData.recordingStartTime ? new Date(parsedData.recordingStartTime) : null)
        setVideoCount(parsedData.videoCount || 1)
        setCurrentVideoIndex(parsedData.currentVideoIndex || 0)
        setVideoMetadata(parsedData.videoMetadata || {})

        return true
      }
    } catch (error) {
      console.error("Failed to load data:", error)
      localStorage.removeItem(STORAGE_KEY)
    }
    return false
  }, [])

  const clearStorage = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error("Failed to clear data:", error)
    }
  }, [])

  // --- Lifecycles & Video Handlers ---
  useEffect(() => {
    loadFromStorage()
    setIsDataLoaded(true)
  }, [loadFromStorage])

  useEffect(() => {
    if (!isDataLoaded) return
    if (autoSaveIntervalRef.current) clearInterval(autoSaveIntervalRef.current)
    autoSaveIntervalRef.current = setInterval(saveToStorage, AUTO_SAVE_INTERVAL)
    return () => {
      if (autoSaveIntervalRef.current) clearInterval(autoSaveIntervalRef.current)
    }
  }, [saveToStorage, isDataLoaded])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const handleVideoEnd = () => {
      setIsPlaying(false)
      setShowVideoEndPrompt(true)
    }
    video.addEventListener("ended", handleVideoEnd)
    return () => video.removeEventListener("ended", handleVideoEnd)
  }, [videoSrc])

  // Native video playback keyboard controls (Space, Arrows)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if typing in an input
      if (
          event.target instanceof HTMLInputElement ||
          event.target instanceof HTMLTextAreaElement ||
          (event.target as Element)?.closest("[contenteditable]")
      ) return

      const key = event.key.toLowerCase()

      // Explicitly catch ? (often Shift + /) to open sidebar
      if (key === "?" || (event.shiftKey && event.key === "/")) {
        event.preventDefault()
        setShowHelpSidebar((prev) => !prev)
        return
      }

      // Ignore playback controls if drawing mode is active
      if (isDrawingMode) return

      if (key === " " && videoSrc) {
        event.preventDefault()
        togglePlay()
      } else if (key === "arrowleft" && videoSrc) {
        event.preventDefault()
        changePlaybackRate(Math.max(0.25, playbackRate - 0.25))
      } else if (key === "arrowright" && videoSrc) {
        event.preventDefault()
        changePlaybackRate(Math.min(4, playbackRate + 0.25))
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [videoSrc, playbackRate, isDrawingMode])


  const togglePlay = useCallback(() => {
    if (!videoRef.current) return
    if (videoRef.current.paused) videoRef.current.play()
    else videoRef.current.pause()
  }, [])

  const changePlaybackRate = useCallback((rate: number) => {
    if (!videoRef.current) return
    const newRate = Math.max(0.25, Math.min(4, rate))
    videoRef.current.playbackRate = newRate
    setPlaybackRate(newRate)
  }, [])

  const handleClearVideo = useCallback(() => {
    setVideoSrc(null)
    setEntries([])
    setStrokes([])
    setIsPlaying(false)
    setPlaybackRate(1)
    setCurrentTime(0)
    setDuration(0)
    setRecordingStartTime(null)
    setVideoCount(1)
    setCurrentVideoIndex(0)
    setVideoMetadata({})
    clearStorage()
  }, [clearStorage])

  const handleVideoSelect = useCallback((src: string | null) => {
    if (currentVideoIndex >= 0 && (strokes.length > 0 || recordingStartTime)) {
      setVideoMetadata((prev) => ({
        ...prev,
        [currentVideoIndex]: { recordingStartTime, strokes: [...strokes] },
      }))
    }

    setVideoSrc(src)

    if (src) {
      const existingMetadata = videoMetadata[currentVideoIndex]
      if (existingMetadata) {
        setStrokes(existingMetadata.strokes)
        setRecordingStartTime(existingMetadata.recordingStartTime)
      } else {
        setStrokes([])
        setRecordingStartTime(null)
        setShowTimeInputDialog(true)
      }
      setIsPlaying(false)
      setPlaybackRate(1)
      setCurrentTime(0)
      setDuration(0)
    }
  }, [currentVideoIndex, strokes, recordingStartTime, videoMetadata])

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) setCurrentTime(videoRef.current.currentTime)
  }, [])

  const handleSeek = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time
      setCurrentTime(time)
    }
  }, [])

  // --- Custom Export Formatting ---
  const handleExportComplete = useCallback(() => {
    if (entries.length === 0) {
      setIsExporting(false)
      setShowExportModal(false)
      return
    }

    try {
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-")

      let csvContent = "Timestamp,Cut Through,Parking,Driving\n"

      entries.forEach((entry) => {
        // Removed the parenthesis formatting here for the CSV
        const typeModifier = entry.type === 'Car' ? 'Car' : entry.type

        if (entry.category === 'cut_through') {
          csvContent += `${entry.timestamp},${typeModifier},,\n`
        } else if (entry.category === 'parking') {
          csvContent += `${entry.timestamp},,${typeModifier},\n`
        } else if (entry.category === 'driving') {
          csvContent += `${entry.timestamp},,,${typeModifier}\n`
        }
      })

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)

      link.setAttribute("href", url)
      link.setAttribute("download", `vehicle_counts_${timestamp}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      handleClearVideo()
    } catch (error) {
      console.error("Failed to export CSV:", error)
    }

    setIsExporting(false)
    setShowExportModal(false)
  }, [entries, handleClearVideo])


  if (!isDataLoaded) {
    return (
        <div className="h-screen w-screen bg-gradient-to-br flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    )
  }

  const lastEntry = entries.length > 0 ? entries[entries.length - 1] : undefined

  return (
      <>
        <main
            className={`h-screen w-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex flex-col p-4 gap-0 overflow-hidden transition-all duration-300 ${showHelpSidebar ? "pr-84" : ""}`}>

          <div className="relative flex-grow h-full min-h-0 overflow-hidden rounded-md bg-black">
            <VideoPlayer
                ref={videoRef}
                videoSrc={videoSrc}
                onVideoSelect={handleVideoSelect}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={() => {
                  if (videoRef.current) setDuration(videoRef.current.duration)
                }}
            />

            {videoSrc && (
                <VideoOverlay
                    isDrawingMode={isDrawingMode}
                    strokes={strokes}
                    onAddStroke={handleAddStroke}
                />
            )}
          </div>

          <div className="flex-shrink-0 mt-2">
            {/* Note: Update the internal props of VideoControls to match this new structure */}
            <VideoControls
                isPlaying={isPlaying}
                playbackRate={playbackRate}
                onTogglePlay={togglePlay}
                onChangePlaybackRate={changePlaybackRate}
                isVideoLoaded={!!videoSrc}
                onUndo={handleUndoVehicle}
                canUndo={entries.length > 0}
                canFinish={entries.length > 0}
                currentTime={currentTime}
                duration={duration}
                onSeek={handleSeek}
                onShowHelp={() => setShowHelpSidebar(true)}
                onFinish={() => {
                  setIsExporting(true)
                  setShowExportModal(true)
                }}
                onClearVideo={handleClearVideo}

                // New Video Control Props passed down to replace the old ones
                totalCount={entries.length}
                lastEntry={lastEntry}
                isDrawingMode={isDrawingMode}
                onToggleDrawingMode={() => setIsDrawingMode(!isDrawingMode)}
            />
          </div>
        </main>

        <VideoTimeInputDialog
            isOpen={showTimeInputDialog}
            onConfirm={(startTime) => {
              setRecordingStartTime(startTime)
              setShowTimeInputDialog(false)
            }}
            onSkip={() => {
              setRecordingStartTime(null)
              setShowTimeInputDialog(false)
            }}
        />

        <VideoEndPrompt
            isOpen={showVideoEndPrompt}
            onUploadNew={() => {
              setShowVideoEndPrompt(false)
              setCurrentVideoIndex(videoCount)
              setVideoCount(v => v + 1)
              document.getElementById("video-upload-hidden")?.click()
            }}
            onExport={() => {
              setShowVideoEndPrompt(false)
              setIsExporting(true)
              setShowExportModal(true)
            }}
            onReplay={() => {
              setShowVideoEndPrompt(false)
              handleSeek(0)
              togglePlay()
            }}
            totalCounts={entries.length}
            videoCount={videoCount}
        />

        <ExportProgressModal
            isOpen={showExportModal}
            onComplete={handleExportComplete}
            totalEntries={entries.length}
            groupedEntries={3} // Repurposed for 3 distinct CSVs
        />

        <HelpSidebar
            isOpen={showHelpSidebar}
            onClose={() => setShowHelpSidebar(false)}
            onUndo={handleUndoVehicle}
            canUndo={entries.length > 0}
            onLog={handleLog}
        />
        {showVideoRestorePrompt && savedStateForRestore && (
            <VideoRestorePrompt
                isOpen={showVideoRestorePrompt}
                onVideoRestore={(file) => {
                  setVideoSrc(URL.createObjectURL(file))
                  setPendingVideoRestore(true)
                  setShowVideoRestorePrompt(false)
                }}
                onDismiss={() => {
                  setShowVideoRestorePrompt(false)
                  setSavedStateForRestore(null)
                  clearStorage()
                }}
                savedData={{
                  currentTime: savedStateForRestore.currentTime,
                  duration: savedStateForRestore.duration,
                  totalCounts: savedStateForRestore.entries.length,
                  intersectionCount: 0, // Obsolete
                  lastSaved: savedStateForRestore.lastSaved,
                }}
            />
        )}

        <input
            type="file"
            id="video-upload-hidden"
            accept="video/mp4, video/webm, video/ogg"
            style={{display: "none"}}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleVideoSelect(URL.createObjectURL(file))
              e.target.value = ""
            }}
        />
      </>
  )
}
"use client"

import type React from "react"
import { useState, useCallback, useRef, useEffect } from "react"
import dynamic from "next/dynamic"
import VideoPlayer from "@/components/video-player"
import VideoControls from "@/components/video-controls"
import { useVehicleInput } from "@/hooks/use-vehicle-input"
import { useVideoQueue } from "@/hooks/use-video-queue"
import { CountEntry, Stroke, SavedState, VideoMetadata, VehicleCategory, VehicleType } from "@/lib/types/types"
import * as XLSX from "xlsx-js-style"
import { HelpSidebarConfig } from "@/lib/config/sidebar.config"
import { videoToolConfigs } from "@/lib/config/video-tool.config"
import { VisualIndicator } from "@/components/visual-indicator"
import { DrawingCanvas } from "@/components/curbCuts/drawing"
import {Button} from "@/components/ui/button";
import { Download } from "lucide-react"

const HelpSidebar = dynamic(() => import("@/components/help-sidebar").then((mod) => mod.default), { ssr: false })
const ReviewSidebar = dynamic(() => import("@/components/curbCuts/review-sidebar").then((mod) => mod.default), { ssr: false })
const VideoRestorePrompt = dynamic(() => import("@/components/video-restore-prompt").then((mod) => mod.default), { ssr: false })
const VideoTimeInputDialog = dynamic(() => import("@/components/video-time-input-dialog").then((mod) => mod.default), { ssr: false })
const VideoEndPrompt = dynamic(() => import("@/components/video-end-prompt").then((mod) => mod.default), { ssr: false })
const NotesModal = dynamic(() => import("@/components/curbCuts/notes-modal").then((mod) => mod.default), { ssr: false })

const STORAGE_KEY = "vehicle-curbCuts-data"
const AUTO_SAVE_INTERVAL = 5000

export default function CurbCutPage() {
  const [entries, setEntries] = useState<CountEntry[]>([])
  const [strokes, setStrokes] = useState<Stroke[]>([])
  const [redoEntries, setRedoEntries] = useState<CountEntry[]>([])
  const [redoStrokes, setRedoStrokes] = useState<Stroke[]>([])

  // Refs to prevent stale closures and StrictMode duplication bugs on undo/redo
  const entriesRef = useRef(entries)
  useEffect(() => {
    entriesRef.current = entries
  }, [entries])

  const redoEntriesRef = useRef(redoEntries)
  useEffect(() => {
    redoEntriesRef.current = redoEntries
  }, [redoEntries])

  const strokesRef = useRef(strokes)
  useEffect(() => {
    strokesRef.current = strokes
  }, [strokes])

  const redoStrokesRef = useRef(redoStrokes)
  useEffect(() => {
    redoStrokesRef.current = redoStrokes
  }, [redoStrokes])

  const [isDrawingMode, setIsDrawingMode] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)

  const [showNotesModal, setShowNotesModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [showHelpSidebar, setShowHelpSidebar] = useState(false)
  const [showReviewSidebar, setShowReviewSidebar] = useState(false)
  const [isDataLoaded, setIsDataLoaded] = useState(false)

  const [showVideoRestorePrompt, setShowVideoRestorePrompt] = useState(false)
  const [savedStateForRestore, setSavedStateForRestore] = useState<SavedState | null>(null)
  const [pendingVideoRestore, setPendingVideoRestore] = useState(false)

  const [showTimeInputDialog, setShowTimeInputDialog] = useState(false)
  const [recordingStartTime, setRecordingStartTime] = useState<Date | null>(null)
  const [showVideoEndPrompt, setShowVideoEndPrompt] = useState(false)
  const [videoMetadata, setVideoMetadata] = useState<Record<number, VideoMetadata>>({})

  const videoRef = useRef<HTMLVideoElement>(null)
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const wasPlayingRef = useRef(false)
  const pendingSeekRef = useRef<number | null>(null)

  const {
    sessionFiles,
    videoSrc,
    currentVideoIndex,
    videoCount,
    extractedStartTime,
    setVideoSrc,
    setCurrentVideoIndex,
    handleFilesSelect: handleQueueFilesSelect,
    handleAddMoreVideos: handleQueueAddMore,
    handleNextVideo,
    handleClearVideo: handleQueueClear,
  } = useVideoQueue(() => {
    setRecordingStartTime(null)
    setShowTimeInputDialog(true)
    setIsPlaying(false)
    setPlaybackRate(1)
    setEntries([])
    setRedoEntries([])
  })

  const formatCurrentTimestamp = useCallback(() => {
    if (recordingStartTime && videoRef.current) {
      const actualTime = new Date(recordingStartTime.getTime() + videoRef.current.currentTime * 1000)
      return actualTime.toTimeString().split(" ")[0]
    }
    return new Date().toTimeString().split(" ")[0]
  }, [recordingStartTime])

  const handleRetroactiveN = useCallback(() => {
    if (entries.length === 0) return
    if (videoRef.current) {
      wasPlayingRef.current = !videoRef.current.paused
      videoRef.current.pause()
    }
    setIsPlaying(false)
    setShowNotesModal(true)
  }, [entries.length])

  const closeNotesModal = useCallback(() => {
    setShowNotesModal(false)
    if (wasPlayingRef.current && videoRef.current) {
      videoRef.current.play().catch((e) => console.error("Playback prevented", e))
      setIsPlaying(true)
    }
  }, [])

  const handleLog = useCallback(
      (category: VehicleCategory, type: VehicleType, hasQ = false, hasN = false) => {
        if (!videoSrc) return
        setEntries((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            timestamp: formatCurrentTimestamp(),
            videoTime: videoRef.current?.currentTime || 0,
            category,
            type,
            videoIndex: currentVideoIndex,
            note: hasQ ? "?" : undefined,
          },
        ])
        setRedoEntries([])
        if (hasN) handleRetroactiveN()
      },
      [videoSrc, currentVideoIndex, formatCurrentTimestamp, handleRetroactiveN]
  )

  const handleUndoVehicle = useCallback(() => {
    const current = entriesRef.current
    if (current.length === 0) return
    const last = current[current.length - 1]
    setEntries(current.slice(0, -1))
    setRedoEntries((prev) => [...prev, last])
  }, [])

  const handleRedoVehicle = useCallback(() => {
    const currentRedo = redoEntriesRef.current
    if (currentRedo.length === 0) return
    const next = currentRedo[currentRedo.length - 1]
    setRedoEntries(currentRedo.slice(0, -1))
    setEntries((prev) => [...prev, next])
  }, [])

  const handleUndoStroke = useCallback(() => {
    const current = strokesRef.current
    if (current.length === 0) return
    const last = current[current.length - 1]
    setStrokes(current.slice(0, -1))
    setRedoStrokes((prev) => [...prev, last])
  }, [])

  const handleRedoStroke = useCallback(() => {
    const currentRedo = redoStrokesRef.current
    if (currentRedo.length === 0) return
    const next = currentRedo[currentRedo.length - 1]
    setRedoStrokes(currentRedo.slice(0, -1))
    setStrokes((prev) => [...prev, next])
  }, [])

  const handleAddStroke = useCallback((stroke: Stroke) => {
    setStrokes((prev) => [...prev, stroke])
    setRedoStrokes([])
  }, [])

  const handleClearStrokes = useCallback(() => {
    setStrokes([])
    setRedoStrokes([])
  }, [])

  const handleRetroactiveQ = useCallback(() => {
    setEntries((prev) => {
      if (prev.length === 0) return prev
      const newEntries = [...prev]
      const last = { ...newEntries[newEntries.length - 1] }
      if (!last.note?.includes("?")) last.note = last.note ? `${last.note} ?` : `?`
      newEntries[newEntries.length - 1] = last
      return newEntries
    })
  }, [])

  const handleSaveNote = useCallback(
      (noteText: string) => {
        setEntries((prev) => {
          if (prev.length === 0) return prev
          const newEntries = [...prev]
          const last = { ...newEntries[newEntries.length - 1] }
          last.note = last.note ? `${last.note} | ${noteText}` : noteText || "?"
          newEntries[newEntries.length - 1] = last
          return newEntries
        })
        closeNotesModal()
      },
      [closeNotesModal]
  )

  const handleUpdateEntry = useCallback((id: string, updatedEntry: CountEntry) => {
    setEntries((prev) => prev.map((entry) => (entry.id === id ? updatedEntry : entry)))
  }, [])

  const { activeModifierType } = useVehicleInput(
      handleLog,
      handleUndoVehicle,
      handleRedoVehicle,
      handleUndoStroke,
      handleRedoStroke,
      handleRetroactiveQ,
      handleRetroactiveN,
      isDrawingMode
  )

  const saveToStorage = useCallback(() => {
    try {
      localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            entries,
            strokes,
            videoSrc,
            playbackRate,
            currentTime: videoRef.current?.currentTime || 0,
            duration: videoRef.current?.duration || 0,
            lastSaved: Date.now(),
            recordingStartTime: recordingStartTime?.toISOString(),
            videoCount,
            currentVideoIndex,
            videoMetadata,
          })
      )
    } catch (e) {
      console.error("Failed to save:", e)
    }
  }, [entries, strokes, videoSrc, playbackRate, recordingStartTime, videoCount, currentVideoIndex, videoMetadata])

  const loadFromStorage = useCallback(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY)
      if (savedData) {
        const parsedData: SavedState = JSON.parse(savedData)
        if (Date.now() - parsedData.lastSaved > 7 * 24 * 60 * 60 * 1000) return localStorage.removeItem(STORAGE_KEY)
        if (parsedData.entries?.length > 0 || parsedData.strokes?.length > 0) {
          setSavedStateForRestore(parsedData)
          setShowVideoRestorePrompt(true)
        }
        setEntries(parsedData.entries || [])
        setStrokes(parsedData.strokes || [])
        setPlaybackRate(parsedData.playbackRate || 1)
        setRecordingStartTime(parsedData.recordingStartTime ? new Date(parsedData.recordingStartTime) : null)
        setCurrentVideoIndex(parsedData.currentVideoIndex || 0)
      }
    } catch (e) {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [setCurrentVideoIndex])

  useEffect(() => {
    loadFromStorage()
    setIsDataLoaded(true)
  }, [loadFromStorage])

  useEffect(() => {
    if (!isDataLoaded) return
    autoSaveIntervalRef.current = setInterval(saveToStorage, AUTO_SAVE_INTERVAL)
    return () => {
      if (autoSaveIntervalRef.current) clearInterval(autoSaveIntervalRef.current)
    }
  }, [saveToStorage, isDataLoaded])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const handleVideoEnd = () => {
      if (recordingStartTime && videoRef.current) {
        setRecordingStartTime(new Date(recordingStartTime.getTime() + videoRef.current.duration * 1000))
      }
      const hasNext = handleNextVideo()
      if (hasNext) {
        setTimeout(() => setIsPlaying(true), 200)
      } else {
        setIsPlaying(false)
        setShowVideoEndPrompt(true)
      }
    }
    video.addEventListener("ended", handleVideoEnd)
    return () => video.removeEventListener("ended", handleVideoEnd)
  }, [videoRef, recordingStartTime, handleNextVideo])

  useEffect(() => {
    if (isPlaying && videoRef.current && videoSrc) videoRef.current.play().catch((e) => console.error(e))
  }, [videoSrc, isPlaying])

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return
    if (videoRef.current.paused) videoRef.current.play()
    else videoRef.current.pause()
  }, [])

  const changePlaybackRate = useCallback((delta: number) => {
    if (!videoRef.current) return
    const newRate = Math.max(0.25, Math.min(16, videoRef.current.playbackRate + delta))
    videoRef.current.playbackRate = newRate
    setPlaybackRate(newRate)
  }, [])

  // Keyboard controls listener
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
          event.target instanceof HTMLInputElement ||
          event.target instanceof HTMLTextAreaElement ||
          (event.target as Element)?.closest("[contenteditable]") ||
          showNotesModal
      )
        return

      const key = event.key.toLowerCase()
      if (key === "?" || key === "/") {
        event.preventDefault()
        setShowHelpSidebar((prev) => !prev)
        return
      }
      if (key === "shift" && !event.repeat) {
        event.preventDefault()
        setIsDrawingMode((prev) => !prev)
        return
      }
      if (isDrawingMode) return

      if (key === " " && videoSrc) {
        event.preventDefault()
        togglePlay()
      } else if (key === "arrowleft" && videoSrc && videoRef.current) {
        event.preventDefault()
        videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 5)
      } else if (key === "arrowright" && videoSrc && videoRef.current) {
        event.preventDefault()
        videoRef.current.currentTime = Math.min(videoRef.current.duration, videoRef.current.currentTime + 5)
      } else if (key === "arrowdown" && videoSrc) {
        event.preventDefault()
        changePlaybackRate(-0.25)
      } else if (key === "arrowup" && videoSrc) {
        event.preventDefault()
        changePlaybackRate(0.25)
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [videoSrc, isDrawingMode, changePlaybackRate, togglePlay, showNotesModal])

  const handleSeekToEntry = useCallback(
      (entry: CountEntry) => {
        if (entry.videoIndex !== currentVideoIndex && sessionFiles[entry.videoIndex]) {
          setCurrentVideoIndex(entry.videoIndex)
          setVideoSrc(URL.createObjectURL(sessionFiles[entry.videoIndex]))
          pendingSeekRef.current = entry.videoTime
        } else {
          if (videoRef.current) {
            videoRef.current.currentTime = entry.videoTime
            videoRef.current.pause()
            setIsPlaying(false)
          }
        }
      },
      [currentVideoIndex, sessionFiles, setVideoSrc, setCurrentVideoIndex]
  )

  const handleClearVideo = useCallback(() => {
    handleQueueClear()
    setEntries([])
    setRedoEntries([])
    setStrokes([])
    setRedoStrokes([])
    setIsPlaying(false)
    setPlaybackRate(1)
    setRecordingStartTime(null)
    setVideoMetadata({})
    localStorage.removeItem(STORAGE_KEY)
  }, [handleQueueClear])

  const handleExportComplete = useCallback(() => {
    if (entries.length === 0) {
      setShowExportModal(false)
      return
    }

    try {
      const dateToUse = recordingStartTime || new Date()
      const timestamp = dateToUse.toISOString().split("T")[0]

      const cutThroughCol: string[] = []
      const parkingCol: string[] = []
      const sidewalkCol: string[] = []
      const notesCol: string[] = []

      const sortedEntries = [...entries].sort((a, b) => a.timestamp.localeCompare(b.timestamp))

      sortedEntries.forEach((entry) => {
        let rowIndex = 0

        if (entry.category === "cut_through") {
          cutThroughCol.push(entry.timestamp)
          rowIndex = cutThroughCol.length - 1
          let baseNote = entry.type !== "Car" ? entry.type : ""
          if (entry.note) baseNote = baseNote ? `${baseNote} | ${entry.note}` : entry.note
          if (baseNote) {
            const noteStr = `A${rowIndex + 2}: ${baseNote}`
            notesCol[rowIndex] = notesCol[rowIndex] ? `${notesCol[rowIndex]}, ${noteStr}` : noteStr
          }
        } else if (entry.category === "parking") {
          parkingCol.push(entry.timestamp)
          rowIndex = parkingCol.length - 1
          let baseNote = entry.type !== "Car" ? entry.type : ""
          if (entry.note) baseNote = baseNote ? `${baseNote} | ${entry.note}` : entry.note
          if (baseNote) {
            const noteStr = `B${rowIndex + 2}: ${baseNote}`
            notesCol[rowIndex] = notesCol[rowIndex] ? `${notesCol[rowIndex]}, ${noteStr}` : noteStr
          }
        } else if (entry.category === "driving") {
          sidewalkCol.push(entry.timestamp)
          rowIndex = sidewalkCol.length - 1
          let baseNote = entry.type !== "Car" ? entry.type : ""
          if (entry.note) baseNote = baseNote ? `${baseNote} | ${entry.note}` : entry.note
          if (baseNote) {
            const noteStr = `C${rowIndex + 2}: ${baseNote}`
            notesCol[rowIndex] = notesCol[rowIndex] ? `${notesCol[rowIndex]}, ${noteStr}` : noteStr
          }
        }
      })

      const maxRows = Math.max(cutThroughCol.length, parkingCol.length, sidewalkCol.length, notesCol.length)
      const excelData = []
      for (let i = 0; i < maxRows; i++) {
        excelData.push({
          "Cut Through": cutThroughCol[i] || "",
          "Sidewalk Parking": parkingCol[i] || "",
          "Sidewalk Driving": sidewalkCol[i] || "",
          Notes: notesCol[i] || "",
        })
      }

      const worksheet = XLSX.utils.json_to_sheet(excelData)
      worksheet["!cols"] = [{ wch: 15 }, { wch: 18 }, { wch: 18 }, { wch: 30 }]

      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Vehicle Counts")
      XLSX.writeFile(workbook, `vehicle_counts_${timestamp}.xlsx`)

      handleClearVideo()
    } catch (error) {
      console.error("Failed to export Excel file:", error)
    }
    setShowExportModal(false)
  }, [entries, handleClearVideo, recordingStartTime])

  if (!isDataLoaded)
    return (
        <div className="h-screen w-screen bg-gradient-to-br flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    )

  return (
      <>
        <main
            className={`h-screen w-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex flex-col p-4 pt-16 gap-0 overflow-hidden transition-all duration-300 ${
                showHelpSidebar || showReviewSidebar ? "pr-[400px]" : ""
            }`}
        >
          <div
              className="relative flex-grow h-full min-h-0 overflow-hidden rounded-md bg-black cursor-pointer"
              onClick={() => !isDrawingMode && togglePlay()}
          >
            <VideoPlayer
                ref={videoRef}
                videoSrc={videoSrc}
                onFilesSelect={handleQueueFilesSelect}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onTimeUpdate={() => {}}
                onLoadedMetadata={() => {
                  if (videoRef.current) {
                    if (pendingSeekRef.current !== null) {
                      videoRef.current.currentTime = pendingSeekRef.current
                      videoRef.current.pause()
                      setIsPlaying(false)
                      pendingSeekRef.current = null
                    } else if (pendingVideoRestore && savedStateForRestore) {
                      videoRef.current.currentTime = savedStateForRestore.currentTime
                      videoRef.current.playbackRate = savedStateForRestore.playbackRate
                      setPlaybackRate(savedStateForRestore.playbackRate)
                      setPendingVideoRestore(false)
                    } else {
                      videoRef.current.playbackRate = playbackRate
                    }
                  }
                }}
            />
            {videoSrc && (
                <VisualIndicator>
                  <DrawingCanvas
                    isDrawingMode={isDrawingMode}
                    strokes={strokes}
                    onAddStroke={handleAddStroke}
                />
                </VisualIndicator>
            )}
          </div>

          <div className="flex-shrink-0 mt-2">
            <VideoControls
                videoRef={videoRef}
                isPlaying={isPlaying}
                playbackRate={playbackRate}
                onTogglePlay={togglePlay}
                onChangePlaybackRate={(rate) => {
                  if (!videoRef.current) return
                  videoRef.current.playbackRate = rate
                  setPlaybackRate(rate)
                }}
                isVideoLoaded={!!videoSrc}
                config={videoToolConfigs.curbCuts}
                onUndo={handleUndoVehicle}
                canUndo={entries.length > 0}
                onShowHelp={() => setShowHelpSidebar((prev) => !prev)}
            >
              {(() => {
                const resolvedLastEntryLabel = entries.length > 0 ? (() => {
                  const last = entries[entries.length - 1];
                  const categoryName =
                      last.category === 'cut_through' ? 'Cut Through' :
                          last.category === 'parking' ? 'Sidewalk Parking' : 'Sidewalk Driving';
                  return (
                      <span className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                        {categoryName}
                        {last.type && last.type !== 'Car' && <span className="ml-1 text-amber-500 text-[16/px]">({last.type})</span>}
                        {last.note && <span className="ml-1 text-red-500 font-bold text-[14px]">(?)</span>}
                    </span>
                  );
                })() : null;

                const totalCount = entries.length > 0 ? entries.length : undefined;
                const showExport = videoToolConfigs.curbCuts.features.export;
                const showDrawing = videoToolConfigs.curbCuts.features.drawingMode;

                return (
                    <div className="flex items-center justify-end gap-2 xl:gap-3 w-full">
                      {(totalCount !== undefined || resolvedLastEntryLabel) && (
                          <div className="flex items-center gap-3 px-1 py-1 shrink-0">
                            {totalCount !== undefined && (
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[14px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
                                        Total:
                                    </span>
                                  <span className="text-base font-bold text-slate-700 dark:text-slate-200">
                                        {totalCount}
                                    </span>
                                </div>
                            )}

                            {resolvedLastEntryLabel && (
                                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                    <span className="text-[14px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider shrink-0">
                                        Last:
                                    </span>
                                  <div className="text-lg xl:text-xl flex items-center truncate">
                                    {resolvedLastEntryLabel}
                                  </div>
                                </div>
                            )}
                          </div>
                      )}

                      <div className="flex items-center gap-1.5 shrink-0">
                        {showExport && (
                            <Button onClick={() => setShowExportModal(true)} variant="outline" size="icon" className="w-11 h-11 flex items-center justify-center bg-green-600 hover:bg-green-700 text-white border-none shadow-sm transition-all duration-200 hover:scale-105">
                              <Download className="h-5 w-5" />
                            </Button>
                        )}
                        {showDrawing && isDrawingMode && (
                            <Button onClick={handleClearStrokes} variant="destructive" className="h-11 px-3 text-xs font-semibold shadow-sm animate-in fade-in">
                              Clear
                            </Button>
                        )}
                        {showDrawing && (
                            <Button onClick={() => setIsDrawingMode(!isDrawingMode)} variant={isDrawingMode ? "default" : "outline"} className={`h-11 px-3 text-xs font-semibold transition-all duration-200 ${isDrawingMode ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm' : 'bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border-slate-300 dark:border-slate-600'}`}>
                              {isDrawingMode ? 'Drawing: ON' : 'Drawing: OFF'}
                            </Button>
                        )}
                      </div>
                    </div>
                );
              })()}
            </VideoControls>
          </div>
        </main>

        <NotesModal isOpen={showNotesModal} onClose={closeNotesModal} onSave={handleSaveNote} />

        <VideoTimeInputDialog
            isOpen={showTimeInputDialog}
            suggestedTime={extractedStartTime}
            onConfirm={(st) => {
              setRecordingStartTime(st)
              setShowTimeInputDialog(false)
            }}
            onSkip={() => {
              setRecordingStartTime(null)
              setShowTimeInputDialog(false)
            }}
        />

        <VideoEndPrompt
            isOpen={showVideoEndPrompt}
            mode="end"
            onAddMoreVideos={(files) => handleQueueAddMore(files, () => setIsPlaying(true))}
            onStartNewSection={() => {
              setShowVideoEndPrompt(false)
              handleClearVideo()
              document.getElementById("video-upload-hidden")?.click()
            }}
            onExport={handleExportComplete}
            onReview={() => {
              setShowVideoEndPrompt(false)
              setShowReviewSidebar(true)
            }}
            totalCounts={entries.length}
            videoCount={videoCount}
        />

        <VideoEndPrompt
            isOpen={showExportModal}
            mode="export"
            onAddMoreVideos={(files) => handleQueueAddMore(files, () => setIsPlaying(true))}
            onStartNewSection={() => {
              setShowExportModal(false)
              handleClearVideo()
              document.getElementById("video-upload-hidden")?.click()
            }}
            onExport={handleExportComplete}
            onReview={() => {
              setShowExportModal(false)
              setShowReviewSidebar(true)
            }}
            onCancel={() => setShowExportModal(false)}
            totalCounts={entries.length}
            videoCount={videoCount}
        />

        <HelpSidebar
            isOpen={showHelpSidebar}
            onClose={() => setShowHelpSidebar(false)}
            config={HelpSidebarConfig.vehicle}
            context={{ canUndo: entries.length > 0 }}
            onUndo={handleUndoVehicle}
            canUndo={entries.length > 0}
            onAction={(actionKey) => {
              switch (actionKey) {
                case "1":
                  handleLog("cut_through", activeModifierType)
                  break
                case "2":
                  handleLog("parking", activeModifierType)
                  break
                case "3":
                  handleLog("driving", activeModifierType)
                  break
                default:
                  break
              }
            }}
        />

        <ReviewSidebar
            isOpen={showReviewSidebar}
            onClose={() => setShowReviewSidebar(false)}
            entries={entries}
            onSeekToEntry={handleSeekToEntry}
            onUpdateEntry={handleUpdateEntry}
        />

        {showVideoRestorePrompt && savedStateForRestore && (
            <VideoRestorePrompt
                isOpen={showVideoRestorePrompt}
                onVideoRestore={(f) => {
                  setVideoSrc(URL.createObjectURL(f))
                  setPendingVideoRestore(true)
                  setShowVideoRestorePrompt(false)
                }}
                onDismiss={() => {
                  setShowVideoRestorePrompt(false)
                  setSavedStateForRestore(null)
                  handleClearVideo()
                }}
                savedData={{
                  currentTime: savedStateForRestore.currentTime,
                  duration: savedStateForRestore.duration,
                  totalCounts: savedStateForRestore.entries.length,
                  intersectionCount: 0,
                  lastSaved: savedStateForRestore.lastSaved,
                }}
            />
        )}

        <input
            type="file"
            id="video-upload-hidden"
            multiple
            accept="video/mp4,video/mov,video/quicktime,video/webm,video/ogg,.mov"
            style={{ display: "none" }}
            onChange={(e) => {
              const files = Array.from(e.target.files || [])
              if (files.length > 0) handleQueueFilesSelect(files)
              e.target.value = ""
            }}
        />
      </>
  )
}
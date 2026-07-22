"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import VideoPlayer from "@/components/video-player"
import VideoControls from "@/components/video-controls"
import ExportProgressModal from "@/components/export-progress-modal"
import HelpSidebar from "@/components/help-sidebar"
import VideoRestorePrompt from "@/components/video-restore-prompt"
import VideoTimeInputDialog from "@/components/video-time-input-dialog"
import VideoEndPrompt from "@/components/video-end-prompt"
import { VideoOverlay } from "@/components/video-overlay"
import { useVehicleInput } from "@/hooks/use-vehicle-input"
import { Button } from "@/components/ui/button"
import * as XLSX from "xlsx-js-style"

// --- Data Models ---
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

export interface Stroke {
  id: string
  points: { x: number; y: number }[]
}

interface VideoMetadata {
  recordingStartTime: Date | null
  strokes: Stroke[]
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
  const [entries, setEntries] = useState<CountEntry[]>([])
  const [strokes, setStrokes] = useState<Stroke[]>([])

  // Redo States
  const [redoEntries, setRedoEntries] = useState<CountEntry[]>([])
  const [redoStrokes, setRedoStrokes] = useState<Stroke[]>([])

  const [isDrawingMode, setIsDrawingMode] = useState(false)
  const [videoQueue, setVideoQueue] = useState<File[]>([])
  const [videoSrc, setVideoSrc] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  // Note Modal States
  const [showNotesModal, setShowNotesModal] = useState(false)
  const [pendingNote, setPendingNote] = useState("")

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
  const wasPlayingRef = useRef(false)

  const formatCurrentTimestamp = useCallback(() => {
    if (recordingStartTime && videoRef.current) {
      const actualTime = new Date(recordingStartTime.getTime() + videoRef.current.currentTime * 1000)
      return actualTime.toTimeString().split(' ')[0]
    }
    return new Date().toTimeString().split(' ')[0]
  }, [recordingStartTime])

  const handleRetroactiveN = useCallback(() => {
    if (entries.length === 0) return;
    if (videoRef.current) {
      wasPlayingRef.current = !videoRef.current.paused;
      videoRef.current.pause();
    }
    setIsPlaying(false);
    setShowNotesModal(true);
  }, [entries.length])

  const closeNotesModal = useCallback(() => {
    setShowNotesModal(false);
    setPendingNote("");
    if (wasPlayingRef.current && videoRef.current) {
      videoRef.current.play().catch(e => console.error("Playback prevented", e));
      setIsPlaying(true);
    }
  }, []);

  const handleLog = useCallback((category: VehicleCategory, type: VehicleType, hasQ: boolean = false, hasN: boolean = false) => {
    if (!videoSrc) return
    setEntries((prev) => [...prev, {
      id: Date.now().toString(),
      timestamp: formatCurrentTimestamp(),
      category,
      type,
      videoIndex: currentVideoIndex,
      note: hasQ ? '?' : undefined
    }])

    setRedoEntries([]) // Clear redo stack on new action

    if (hasN) {
      handleRetroactiveN()
    }
  }, [videoSrc, currentVideoIndex, formatCurrentTimestamp, handleRetroactiveN])

  const handleUndoVehicle = useCallback(() => {
    setEntries((prev) => {
      if (prev.length === 0) return prev
      const last = prev[prev.length - 1]
      setRedoEntries(r => [...r, last])
      return prev.slice(0, -1)
    })
  }, [])

  const handleRedoVehicle = useCallback(() => {
    setRedoEntries((prev) => {
      if (prev.length === 0) return prev
      const last = prev[prev.length - 1]
      setEntries(e => [...e, last])
      return prev.slice(0, -1)
    })
  }, [])

  const handleUndoStroke = useCallback(() => {
    setStrokes((prev) => {
      if (prev.length === 0) return prev
      const last = prev[prev.length - 1]
      setRedoStrokes(r => [...r, last])
      return prev.slice(0, -1)
    })
  }, [])

  const handleRedoStroke = useCallback(() => {
    setRedoStrokes((prev) => {
      if (prev.length === 0) return prev
      const last = prev[prev.length - 1]
      setStrokes(s => [...s, last])
      return prev.slice(0, -1)
    })
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
    setEntries(prev => {
      if (prev.length === 0) return prev;
      const newEntries = [...prev];
      const last = { ...newEntries[newEntries.length - 1] };

      // FIX: Only append the question mark if it doesn't already exist
      if (!last.note?.includes('?')) {
        last.note = last.note ? `${last.note} ?` : `?`;
      }

      newEntries[newEntries.length - 1] = last;
      return newEntries;
    });
  }, [])

  const handleSaveNote = useCallback((noteText: string) => {
    setEntries(prev => {
      if (prev.length === 0) return prev;
      const newEntries = [...prev];
      const last = { ...newEntries[newEntries.length - 1] };
      if (last.note) {
        last.note = noteText ? `${last.note} | ${noteText}` : last.note;
      } else {
        last.note = noteText || '?';
      }
      newEntries[newEntries.length - 1] = last;
      return newEntries;
    });
    closeNotesModal();
  }, [closeNotesModal])

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
      const dataToSave: SavedState = {
        entries, strokes, videoSrc, playbackRate,
        currentTime: videoRef.current?.currentTime || currentTime,
        duration, lastSaved: Date.now(),
        recordingStartTime: recordingStartTime?.toISOString(),
        videoCount, currentVideoIndex, videoMetadata,
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

        if (parsedData.entries?.length > 0 || parsedData.strokes?.length > 0) {
          setSavedStateForRestore(parsedData)
          setShowVideoRestorePrompt(true)
        }

        setEntries(parsedData.entries || [])
        setStrokes(parsedData.strokes || [])
        setVideoSrc(null)

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
      if (videoQueue.length > 0) {
        const nextFile = videoQueue[0]
        const remainingFiles = videoQueue.slice(1)

        if (recordingStartTime && videoRef.current) {
          const nextStart = new Date(recordingStartTime.getTime() + videoRef.current.duration * 1000)
          setRecordingStartTime(nextStart)
        }

        setVideoSrc(URL.createObjectURL(nextFile))
        setVideoQueue(remainingFiles)
        setCurrentVideoIndex(prev => prev + 1)
        setVideoCount(prev => prev + 1)
        setTimeout(() => setIsPlaying(true), 200)
      } else {
        setIsPlaying(false)
        setShowVideoEndPrompt(true)
      }
    }

    video.addEventListener("ended", handleVideoEnd)
    return () => video.removeEventListener("ended", handleVideoEnd)
  }, [videoSrc, videoQueue, recordingStartTime])

  useEffect(() => {
    if (isPlaying && videoRef.current && videoSrc) {
      videoRef.current.play().catch(e => console.error("Auto-play prevented", e))
    }
  }, [videoSrc, isPlaying])

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return
    if (videoRef.current.paused) videoRef.current.play()
    else videoRef.current.pause()
  }, [])

  const changePlaybackRate = useCallback((rate: number) => {
    if (!videoRef.current) return
    const newRate = Math.max(0.25, Math.min(16, rate))
    videoRef.current.playbackRate = newRate
    setPlaybackRate(newRate)
  }, [])

  const handleSeek = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time
      setCurrentTime(time)
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
          event.target instanceof HTMLInputElement ||
          event.target instanceof HTMLTextAreaElement ||
          (event.target as Element)?.closest("[contenteditable]") ||
          showNotesModal
      ) return

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
      } else if (key === "arrowleft" && videoSrc) {
        event.preventDefault()
        if (videoRef.current) handleSeek(Math.max(0, videoRef.current.currentTime - 5))
      } else if (key === "arrowright" && videoSrc) {
        event.preventDefault()
        if (videoRef.current) handleSeek(Math.min(duration, videoRef.current.currentTime + 5))
      } else if (key === "arrowdown" && videoSrc) {
        event.preventDefault()
        changePlaybackRate(Math.max(0.25, playbackRate - 0.25))
      } else if (key === "arrowup" && videoSrc) {
        event.preventDefault()
        changePlaybackRate(playbackRate + 0.25)
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [videoSrc, playbackRate, isDrawingMode, duration, handleSeek, changePlaybackRate, togglePlay, showNotesModal])

  const handleClearVideo = useCallback(() => {
    setVideoSrc(null)
    setVideoQueue([])
    setEntries([])
    setRedoEntries([])
    setStrokes([])
    setRedoStrokes([])
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

  const handleFilesSelect = useCallback((files: File[]) => {
    if (files.length === 0) return
    const firstFile = files[0]
    const restOfQueue = files.slice(1)

    setVideoSrc(URL.createObjectURL(firstFile))
    setVideoQueue(restOfQueue)
    setStrokes([])
    setRecordingStartTime(null)
    setShowTimeInputDialog(true)
    setIsPlaying(false)
    setPlaybackRate(1)
    setCurrentTime(0)
    setDuration(0)
    setCurrentVideoIndex(0)
  }, [])

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) setCurrentTime(videoRef.current.currentTime)
  }, [])

  const handleExportComplete = useCallback(() => {
    if (entries.length === 0) {
      setIsExporting(false)
      setShowExportModal(false)
      return
    }

    try {
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-")

      const cutThroughCol: string[] = []
      const parkingCol: string[] = []
      const sidewalkCol: string[] = []
      const notesCol: string[] = []

      const sortedEntries = [...entries].sort((a, b) => a.timestamp.localeCompare(b.timestamp))

      sortedEntries.forEach((entry) => {
        let rowIndex = 0

        if (entry.category === 'cut_through') {
          cutThroughCol.push(entry.timestamp)
          rowIndex = cutThroughCol.length - 1

          let baseNote = entry.type !== 'Car' ? entry.type : ""
          if (entry.note) baseNote = baseNote ? `${baseNote} | ${entry.note}` : entry.note;
          if (baseNote) {
            const noteStr = `A${rowIndex + 2}: ${baseNote}`
            notesCol[rowIndex] = notesCol[rowIndex] ? `${notesCol[rowIndex]}, ${noteStr}` : noteStr
          }
        }
        else if (entry.category === 'parking') {
          parkingCol.push(entry.timestamp)
          rowIndex = parkingCol.length - 1

          let baseNote = entry.type !== 'Car' ? entry.type : ""
          if (entry.note) baseNote = baseNote ? `${baseNote} | ${entry.note}` : entry.note;
          if (baseNote) {
            const noteStr = `B${rowIndex + 2}: ${baseNote}`
            notesCol[rowIndex] = notesCol[rowIndex] ? `${notesCol[rowIndex]}, ${noteStr}` : noteStr
          }
        }
        else if (entry.category === 'driving') {
          sidewalkCol.push(entry.timestamp)
          rowIndex = sidewalkCol.length - 1

          let baseNote = entry.type !== 'Car' ? entry.type : ""
          if (entry.note) baseNote = baseNote ? `${baseNote} | ${entry.note}` : entry.note;
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
          "Notes": notesCol[i] || ""
        })
      }

      const worksheet = XLSX.utils.json_to_sheet(excelData)
      worksheet['!cols'] = [{ wch: 15 }, { wch: 18 }, { wch: 18 }, { wch: 30 }]

      const range = XLSX.utils.decode_range(worksheet['!ref'] || "A1:D1")
      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C })
          if (!worksheet[cellAddress]) continue
          worksheet[cellAddress].s = { font: { name: "Calibri", sz: 11 }, alignment: { vertical: "center", horizontal: "left" } }
          if (R === 0) {
            worksheet[cellAddress].s.font.bold = true
            worksheet[cellAddress].s.fill = { fgColor: { rgb: "E2EFDA" } }
            worksheet[cellAddress].s.border = { bottom: { style: "medium", color: { rgb: "000000" } } }
          } else {
            worksheet[cellAddress].s.fill = { fgColor: { rgb: (R % 2 === 0) ? "F2F2F2" : "FFFFFF" } }
          }
        }
      }

      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Vehicle Counts")
      XLSX.writeFile(workbook, `vehicle_counts_${timestamp}.xlsx`)

      handleClearVideo()
    } catch (error) {
      console.error("Failed to export Excel file:", error)
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

          <div
              className="relative flex-grow h-full min-h-0 overflow-hidden rounded-md bg-black cursor-pointer"
              onClick={(e) => {
                if (!isDrawingMode) togglePlay()
              }}
          >
            <VideoPlayer
                ref={videoRef}
                videoSrc={videoSrc}
                onFilesSelect={handleFilesSelect}
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
                onShowHelp={() => setShowHelpSidebar((prev) => !prev)}
                onFinish={() => {
                  setIsExporting(true)
                  setShowExportModal(true)
                }}
                onClearVideo={handleClearVideo}
                totalCount={entries.length}
                lastEntry={lastEntry}
                isDrawingMode={isDrawingMode}
                onToggleDrawingMode={() => setIsDrawingMode(!isDrawingMode)}
                onClearStrokes={handleClearStrokes}
                onExport={() => {
                  setIsExporting(true)
                  setShowExportModal(true)
                }}
            />
          </div>
        </main>

        {showNotesModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl w-96 border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Add Note to Last Entry</h3>
                <input
                    type="text"
                    autoFocus
                    placeholder="Type a note..."
                    className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded mb-4 text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                    value={pendingNote}
                    onChange={e => setPendingNote(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleSaveNote(pendingNote);
                      if (e.key === 'Escape') closeNotesModal();
                    }}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={closeNotesModal}>Cancel</Button>
                  <Button onClick={() => handleSaveNote(pendingNote)} className="bg-blue-600 text-white hover:bg-blue-700">Save Note</Button>
                </div>
              </div>
            </div>
        )}

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
              setEntries([])
              setStrokes([])
              setRedoEntries([])
              setRedoStrokes([])
              setRecordingStartTime(null)
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
            groupedEntries={3}
        />

        <HelpSidebar
            isOpen={showHelpSidebar}
            onClose={() => setShowHelpSidebar(false)}
            onUndo={handleUndoVehicle}
            canUndo={entries.length > 0}
            onLog={handleLog}
            activeModifierType={activeModifierType}
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
                  intersectionCount: 0,
                  lastSaved: savedStateForRestore.lastSaved,
                }}
            />
        )}

        <input
            type="file"
            id="video-upload-hidden"
            multiple
            accept="video/mp4, video/webm, video/ogg"
            style={{display: "none"}}
            onChange={(e) => {
              const files = Array.from(e.target.files || [])
              if (files.length > 0) handleFilesSelect(files)
              e.target.value = ""
            }}
        />
      </>
  )
}
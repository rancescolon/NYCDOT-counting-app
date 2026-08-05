"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import dynamic from "next/dynamic"
import VideoPlayer from "@/components/video-player"
import VideoControls from "@/components/video-controls"
import { VideoOverlay } from "@/components/video-overlay"
import { useVehicleInput } from "@/hooks/use-vehicle-input"
import { CountEntry, Stroke, SavedState, VideoMetadata, VehicleCategory, VehicleType } from "@/lib/types"
import * as XLSX from "xlsx-js-style"

// Lazy loaders (ExportProgressModal removed)
const HelpSidebar = dynamic(() => import("@/components/help-sidebar"), { ssr: false })
const ReviewSidebar = dynamic(() => import("@/components/review-sidebar"), { ssr: false })
const VideoRestorePrompt = dynamic(() => import("@/components/video-restore-prompt"), { ssr: false })
const VideoTimeInputDialog = dynamic(() => import("@/components/video-time-input-dialog"), { ssr: false })
const VideoEndPrompt = dynamic(() => import("@/components/video-end-prompt"), { ssr: false })
const NotesModal = dynamic(() => import("@/components/notes-modal"), { ssr: false })

const STORAGE_KEY = "vehicle-counter-data"
const AUTO_SAVE_INTERVAL = 5000

export function extractTimeFromFilename(filename: string): Date | null {
  const datePattern = /(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/
  const match = filename.match(datePattern)
  if (match) {
    const [, year, month, day, hour, minute, second] = match
    const date = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hour),
        parseInt(minute),
        parseInt(second)
    )
    if (!isNaN(date.getTime())) return date
  }
  return null
}

function CounterPage() {
  const [entries, setEntries] = useState<CountEntry[]>([])
  const [strokes, setStrokes] = useState<Stroke[]>([])
  const [redoEntries, setRedoEntries] = useState<CountEntry[]>([])
  const [redoStrokes, setRedoStrokes] = useState<Stroke[]>([])

  const [isDrawingMode, setIsDrawingMode] = useState(false)
  const [videoQueue, setVideoQueue] = useState<File[]>([])
  const [sessionFiles, setSessionFiles] = useState<File[]>([])
  const [videoSrc, setVideoSrc] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)

  const [showNotesModal, setShowNotesModal] = useState(false)
  const [pendingNote, setPendingNote] = useState("")

  const [showExportModal, setShowExportModal] = useState(false)
  const [showHelpSidebar, setShowHelpSidebar] = useState(false)
  const [showReviewSidebar, setShowReviewSidebar] = useState(false)
  const [isDataLoaded, setIsDataLoaded] = useState(false)

  const [showVideoRestorePrompt, setShowVideoRestorePrompt] = useState(false)
  const [savedStateForRestore, setSavedStateForRestore] = useState<SavedState | null>(null)
  const [pendingVideoRestore, setPendingVideoRestore] = useState(false)

  const [showTimeInputDialog, setShowTimeInputDialog] = useState(false)
  const [recordingStartTime, setRecordingStartTime] = useState<Date | null>(null)
  const [extractedStartTime, setExtractedStartTime] = useState<Date | null>(null)
  const [showVideoEndPrompt, setShowVideoEndPrompt] = useState(false)

  const [videoCount, setVideoCount] = useState(1)
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const [videoMetadata, setVideoMetadata] = useState<Record<number, VideoMetadata>>({})
  const [isExporting, setIsExporting] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const wasPlayingRef = useRef(false)
  const pendingSeekRef = useRef<number | null>(null)

  const formatCurrentTimestamp = useCallback(() => {
    if (recordingStartTime && videoRef.current) {
      const actualTime = new Date(recordingStartTime.getTime() + videoRef.current.currentTime * 1000)
      return actualTime.toTimeString().split(' ')[0]
    }
    return new Date().toTimeString().split(' ')[0]
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
    setPendingNote("")
    if (wasPlayingRef.current && videoRef.current) {
      videoRef.current.play().catch(e => console.error("Playback prevented", e))
      setIsPlaying(true)
    }
  }, [])

  const handleLog = useCallback((category: VehicleCategory, type: VehicleType, hasQ = false, hasN = false) => {
    if (!videoSrc) return
    setEntries((prev) => [...prev, {
      id: Date.now().toString(),
      timestamp: formatCurrentTimestamp(),
      videoTime: videoRef.current?.currentTime || 0,
      category, type, videoIndex: currentVideoIndex, note: hasQ ? '?' : undefined
    }])
    setRedoEntries([])
    if (hasN) handleRetroactiveN()
  }, [videoSrc, currentVideoIndex, formatCurrentTimestamp, handleRetroactiveN])

  const handleUndoVehicle = useCallback(() => setEntries(prev => {
    if (prev.length === 0) return prev
    setRedoEntries(r => [...r, prev[prev.length - 1]])
    return prev.slice(0, -1)
  }), [])

  const handleRedoVehicle = useCallback(() => setRedoEntries(prev => {
    if (prev.length === 0) return prev
    setEntries(e => [...e, prev[prev.length - 1]])
    return prev.slice(0, -1)
  }), [])

  const handleUndoStroke = useCallback(() => setStrokes(prev => {
    if (prev.length === 0) return prev
    setRedoStrokes(r => [...r, prev[prev.length - 1]])
    return prev.slice(0, -1)
  }), [])

  const handleRedoStroke = useCallback(() => setRedoStrokes(prev => {
    if (prev.length === 0) return prev
    setStrokes(s => [...s, prev[prev.length - 1]])
    return prev.slice(0, -1)
  }), [])

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
      if (prev.length === 0) return prev
      const newEntries = [...prev]
      const last = {...newEntries[newEntries.length - 1]}
      if (!last.note?.includes('?')) last.note = last.note ? `${last.note} ?` : `?`
      newEntries[newEntries.length - 1] = last
      return newEntries
    })
  }, [])

  const handleSaveNote = useCallback((noteText: string) => {
    setEntries(prev => {
      if (prev.length === 0) return prev
      const newEntries = [...prev]
      const last = {...newEntries[newEntries.length - 1]}
      last.note = last.note ? `${last.note} | ${noteText}` : noteText || '?'
      newEntries[newEntries.length - 1] = last
      return newEntries
    })
    closeNotesModal()
  }, [closeNotesModal])

  const handleUpdateEntry = useCallback((id: string, updatedEntry: CountEntry) => {
    setEntries(prev => prev.map(entry => entry.id === id ? updatedEntry : entry))
  }, [])

  const {activeModifierType} = useVehicleInput(
      handleLog, handleUndoVehicle, handleRedoVehicle, handleUndoStroke,
      handleRedoStroke, handleRetroactiveQ, handleRetroactiveN, isDrawingMode
  )

  const saveToStorage = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        entries, strokes, videoSrc, playbackRate,
        currentTime: videoRef.current?.currentTime || 0,
        duration: videoRef.current?.duration || 0,
        lastSaved: Date.now(), recordingStartTime: recordingStartTime?.toISOString(),
        videoCount, currentVideoIndex, videoMetadata,
      }))
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
        setVideoCount(parsedData.videoCount || 1)
        setCurrentVideoIndex(parsedData.currentVideoIndex || 0)
      }
    } catch (e) {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  useEffect(() => {
    loadFromStorage();
    setIsDataLoaded(true)
  }, [loadFromStorage])

  useEffect(() => {
    if (!isDataLoaded) return
    autoSaveIntervalRef.current = setInterval(saveToStorage, AUTO_SAVE_INTERVAL)
    return () => clearInterval(autoSaveIntervalRef.current!)
  }, [saveToStorage, isDataLoaded])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const handleVideoEnd = () => {
      if (currentVideoIndex + 1 < sessionFiles.length) {
        const nextIndex = currentVideoIndex + 1
        if (recordingStartTime && videoRef.current) {
          setRecordingStartTime(new Date(recordingStartTime.getTime() + videoRef.current.duration * 1000))
        }
        setCurrentVideoIndex(nextIndex)
        setVideoSrc(URL.createObjectURL(sessionFiles[nextIndex]))
        setTimeout(() => setIsPlaying(true), 200)
      } else {
        setIsPlaying(false)
        setShowVideoEndPrompt(true)
      }
    }
    video.addEventListener("ended", handleVideoEnd)
    return () => video.removeEventListener("ended", handleVideoEnd)
  }, [videoSrc, currentVideoIndex, sessionFiles, recordingStartTime])

  useEffect(() => {
    if (isPlaying && videoRef.current && videoSrc) videoRef.current.play().catch(e => console.error(e))
  }, [videoSrc, isPlaying])

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return
    if (videoRef.current.paused) videoRef.current.play()
    else videoRef.current.pause()
  }, [])

  const changePlaybackRate = useCallback((rate: number) => {
    if (!videoRef.current) return
    videoRef.current.playbackRate = Math.max(0.25, Math.min(16, rate))
    setPlaybackRate(videoRef.current.playbackRate)
  }, [])

  const handleSeek = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time
    }
  }, [])

  const handleSeekToEntry = useCallback((entry: CountEntry) => {
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
  }, [currentVideoIndex, sessionFiles])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || (event.target as Element)?.closest("[contenteditable]") || showNotesModal) return

      const key = event.key.toLowerCase()
      if (key === "?" || key === "/") {
        event.preventDefault();
        setShowHelpSidebar(prev => !prev);
        return
      }
      if (key === "shift" && !event.repeat) {
        event.preventDefault();
        setIsDrawingMode(prev => !prev);
        return
      }
      if (isDrawingMode) return

      if (key === " " && videoSrc) {
        event.preventDefault();
        togglePlay()
      } else if (key === "arrowleft" && videoSrc && videoRef.current) {
        event.preventDefault();
        videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 5)
      } else if (key === "arrowright" && videoSrc && videoRef.current) {
        event.preventDefault();
        videoRef.current.currentTime = Math.min(videoRef.current.duration, videoRef.current.currentTime + 5)
      } else if (key === "arrowdown" && videoSrc) {
        event.preventDefault();
        changePlaybackRate(playbackRate - 0.25)
      } else if (key === "arrowup" && videoSrc) {
        event.preventDefault();
        changePlaybackRate(playbackRate + 0.25)
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [videoSrc, playbackRate, isDrawingMode, changePlaybackRate, togglePlay, showNotesModal])

  const handleClearVideo = useCallback(() => {
    setVideoSrc(null);
    setSessionFiles([]);
    setEntries([]);
    setRedoEntries([]);
    setStrokes([]);
    setRedoStrokes([])
    setIsPlaying(false);
    setPlaybackRate(1);
    setRecordingStartTime(null);
    setExtractedStartTime(null);
    setVideoCount(1)
    setCurrentVideoIndex(0);
    setVideoMetadata({});
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const handleFilesSelect = useCallback((files: File[]) => {
    if (files.length === 0) return

    setEntries([])
    setRedoEntries([])

    const sortedFiles = [...files].sort((a, b) => {
      const timeA = extractTimeFromFilename(a.name)?.getTime() || 0
      const timeB = extractTimeFromFilename(b.name)?.getTime() || 0
      return timeA - timeB
    })

    const firstFile = sortedFiles[0]
    setSessionFiles(sortedFiles)

    setVideoSrc(URL.createObjectURL(firstFile))
    setStrokes([])

    setExtractedStartTime(extractTimeFromFilename(firstFile.name))
    setRecordingStartTime(null)
    setShowTimeInputDialog(true)
    setIsPlaying(false)
    setPlaybackRate(1)
    setCurrentVideoIndex(0)
    setVideoCount(1)
  }, [])

  const handleAddMoreVideos = useCallback((files: File[]) => {
    if (files.length === 0) return

    const sortedFiles = [...files].sort((a, b) => {
      const timeA = extractTimeFromFilename(a.name)?.getTime() || 0
      const timeB = extractTimeFromFilename(b.name)?.getTime() || 0
      return timeA - timeB
    })

    const newSessionFiles = [...sessionFiles, ...sortedFiles]
    setSessionFiles(newSessionFiles)
    setShowVideoEndPrompt(false)
    setShowExportModal(false) // Closes export modal if it was open

    if (!videoSrc) {
      setVideoSrc(URL.createObjectURL(sortedFiles[0]))
      setVideoQueue(sortedFiles.slice(1))
      setVideoCount(prev => prev + 1)
      setCurrentVideoIndex(prev => prev + 1)
      setTimeout(() => setIsPlaying(true), 200)
    } else {
      setVideoQueue(prev => [...prev, ...sortedFiles])
    }
  }, [sessionFiles, videoSrc])

  const handleExportComplete = useCallback(() => {
    if (entries.length === 0) {
      setShowExportModal(false)
      return
    }

    try {
      const dateToUse = recordingStartTime || new Date()
      const timestamp = dateToUse.toISOString().split('T')[0]

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
        } else if (entry.category === 'parking') {
          parkingCol.push(entry.timestamp)
          rowIndex = parkingCol.length - 1

          let baseNote = entry.type !== 'Car' ? entry.type : ""
          if (entry.note) baseNote = baseNote ? `${baseNote} | ${entry.note}` : entry.note;
          if (baseNote) {
            const noteStr = `B${rowIndex + 2}: ${baseNote}`
            notesCol[rowIndex] = notesCol[rowIndex] ? `${notesCol[rowIndex]}, ${noteStr}` : noteStr
          }
        } else if (entry.category === 'driving') {
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
      worksheet['!cols'] = [{wch: 15}, {wch: 18}, {wch: 18}, {wch: 30}]

      const range = XLSX.utils.decode_range(worksheet['!ref'] || "A1:D1")
      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellAddress = XLSX.utils.encode_cell({r: R, c: C})
          if (!worksheet[cellAddress]) continue
          worksheet[cellAddress].s = {
            font: {name: "Calibri", sz: 11},
            alignment: {vertical: "center", horizontal: "left"}
          }
          if (R === 0) {
            worksheet[cellAddress].s.font.bold = true
            worksheet[cellAddress].s.fill = {fgColor: {rgb: "E2EFDA"}}
            worksheet[cellAddress].s.border = {bottom: {style: "medium", color: {rgb: "000000"}}}
          } else {
            worksheet[cellAddress].s.fill = {fgColor: {rgb: (R % 2 === 0) ? "F2F2F2" : "FFFFFF"}}
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
  }, [entries, handleClearVideo, recordingStartTime])

  if (!isDataLoaded) return <div className="h-screen w-screen bg-gradient-to-br flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>

  return (
      <>
        <main
            className={`h-screen w-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex flex-col p-4 gap-0 overflow-hidden transition-all duration-300 ${(showHelpSidebar || showReviewSidebar) ? "pr-[400px]" : ""}`}>
          <div className="relative flex-grow h-full min-h-0 overflow-hidden rounded-md bg-black cursor-pointer"
               onClick={() => !isDrawingMode && togglePlay()}>
            <VideoPlayer
                ref={videoRef}
                videoSrc={videoSrc}
                onFilesSelect={handleFilesSelect}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onTimeUpdate={() => {
                }}
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
            {videoSrc && <VideoOverlay isDrawingMode={isDrawingMode} strokes={strokes} onAddStroke={handleAddStroke}/>}
          </div>

          <div className="flex-shrink-0 mt-2">
            <VideoControls
                videoRef={videoRef}
                isPlaying={isPlaying}
                playbackRate={playbackRate}
                onTogglePlay={togglePlay}
                onChangePlaybackRate={changePlaybackRate}
                isVideoLoaded={!!videoSrc}
                onUndo={handleUndoVehicle}
                canUndo={entries.length > 0}
                onShowHelp={() => setShowHelpSidebar((prev) => !prev)}
                onFinish={() => setShowExportModal(true)}
                onClearVideo={handleClearVideo}
                totalCount={entries.length}
                lastEntry={entries.length > 0 ? entries[entries.length - 1] : undefined}
                isDrawingMode={isDrawingMode}
                onToggleDrawingMode={() => setIsDrawingMode(!isDrawingMode)}
                onClearStrokes={handleClearStrokes}
                onExport={() => setShowExportModal(true)}
            />
          </div>
        </main>

        <NotesModal isOpen={showNotesModal} onClose={closeNotesModal} onSave={handleSaveNote}/>

        <VideoTimeInputDialog
            isOpen={showTimeInputDialog}
            suggestedTime={extractedStartTime}
            onConfirm={(st) => {
              setRecordingStartTime(st);
              setShowTimeInputDialog(false)
            }}
            onSkip={() => {
              setRecordingStartTime(null);
              setShowTimeInputDialog(false)
            }}
        />

        {/* The End Prompt Menu */}
        <VideoEndPrompt
            isOpen={showVideoEndPrompt}
            mode="end"
            onAddMoreVideos={handleAddMoreVideos}
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

        {/* The new unified Export Menu */}
        <VideoEndPrompt
            isOpen={showExportModal}
            mode="export"
            onAddMoreVideos={handleAddMoreVideos}
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

        <HelpSidebar isOpen={showHelpSidebar} onClose={() => setShowHelpSidebar(false)} onUndo={handleUndoVehicle}
                     canUndo={entries.length > 0} onLog={handleLog} activeModifierType={activeModifierType}/>

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
                  lastSaved: savedStateForRestore.lastSaved
                }}
            />
        )}

        <input type="file" id="video-upload-hidden" multiple accept="video/mp4, video/webm, video/ogg"
               style={{display: "none"}} onChange={(e) => {
          const files = Array.from(e.target.files || []);
          if (files.length > 0) handleFilesSelect(files);
          e.target.value = ""
        }}/>
      </>
  )
}

export default CounterPage
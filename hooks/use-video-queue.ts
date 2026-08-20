"use client"

import { useState, useCallback, useRef } from "react"
import { extractTimeFromFilename } from "@/lib/utils"

interface VideoQueueOptions {
    onQueueEnd?: () => void
    onClear?: () => void
    onSessionStart?: (firstFile: File, extractedTime: Date | null) => void
    onResumeQueue?: () => void // NEW: Alerts the parent to close the popup
}

export function useVideoQueue(options?: VideoQueueOptions) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const activeUrlRef = useRef<string | null>(null)

    const [sessionFiles, setSessionFiles] = useState<File[]>([])
    const [videoSrc, setVideoSrc] = useState<string | null>(null)
    const [currentVideoIndex, setCurrentVideoIndex] = useState(0)

    const [isPlaying, setIsPlaying] = useState(false)
    const [playbackRate, setPlaybackRate] = useState(1.0)

    const [recordingStartTime, setRecordingStartTime] = useState<Date | null>(null)
    const [extractedStartTime, setExtractedStartTime] = useState<Date | null>(null)

    const pendingSeekRef = useRef<number | null>(null)
    const pendingRestoreRef = useRef<{currentTime: number, playbackRate: number} | null>(null)

    // Revokes previous blob URLs to prevent browser memory bloat
    const createSafeObjectUrl = useCallback((file: File) => {
        if (activeUrlRef.current) {
            URL.revokeObjectURL(activeUrlRef.current)
        }
        const url = URL.createObjectURL(file)
        activeUrlRef.current = url
        return url
    }, [])

    const sortFiles = (files: File[]) => {
        return [...files].sort((a, b) => {
            const timeA = extractTimeFromFilename(a.name)?.getTime() || 0
            const timeB = extractTimeFromFilename(b.name)?.getTime() || 0
            return timeA - timeB
        })
    }

    const handleFilesSelect = useCallback((files: File[]) => {
        if (files.length === 0) return
        const sortedFiles = sortFiles(files)

        setSessionFiles(sortedFiles)
        setVideoSrc(createSafeObjectUrl(sortedFiles[0]))
        setCurrentVideoIndex(0)
        setIsPlaying(false)

        const extracted = extractTimeFromFilename(sortedFiles[0].name)
        setExtractedStartTime(extracted)

        if (options?.onSessionStart) {
            options.onSessionStart(sortedFiles[0], extracted)
        }
    }, [options, createSafeObjectUrl])

    const handleAddMoreVideos = useCallback((files: File[], autoPlay = false) => {
        if (files.length === 0) return
        const sortedFiles = sortFiles(files)

        setSessionFiles(prev => {
            const updated = [...prev, ...sortedFiles]

            // Check if we are at the end of the previous queue and the video has finished
            const isQueueFinished = prev.length > 0 && currentVideoIndex === prev.length - 1 && videoRef.current?.ended;

            if (!videoSrc || isQueueFinished) {
                // If the queue was finished, start playing the first newly added video
                const nextIndex = isQueueFinished ? prev.length : 0;
                setVideoSrc(createSafeObjectUrl(updated[nextIndex]))
                setCurrentVideoIndex(nextIndex)

                if (autoPlay) setIsPlaying(true)
            }
            return updated
        })
    }, [videoSrc, currentVideoIndex, createSafeObjectUrl])


    const handleClearVideo = useCallback(() => {
        if (activeUrlRef.current) {
            URL.revokeObjectURL(activeUrlRef.current)
            activeUrlRef.current = null
        }
        setVideoSrc(null)
        setSessionFiles([])
        setCurrentVideoIndex(0)
        setIsPlaying(false)
        setPlaybackRate(1.0)
        setRecordingStartTime(null)
        setExtractedStartTime(null)
        pendingSeekRef.current = null
        pendingRestoreRef.current = null
        if (options?.onClear) options.onClear()
    }, [options])

    const handleVideoEnd = useCallback(() => {
        setRecordingStartTime(prev => {
            if (prev && videoRef.current) {
                return new Date(prev.getTime() + videoRef.current.duration * 1000)
            }
            return prev
        })

        setCurrentVideoIndex((prevIndex) => {
            const nextIndex = prevIndex + 1
            if (nextIndex < sessionFiles.length) {
                setVideoSrc(createSafeObjectUrl(sessionFiles[nextIndex]))
                setIsPlaying(true)
                return nextIndex
            } else {
                setIsPlaying(false)
                if (options?.onQueueEnd) options.onQueueEnd()
                return prevIndex
            }
        })
    }, [sessionFiles, options, createSafeObjectUrl])

    const handleLoadedMetadata = useCallback(() => {
        if (!videoRef.current) return

        if (pendingSeekRef.current !== null) {
            videoRef.current.currentTime = pendingSeekRef.current
            videoRef.current.pause()
            setIsPlaying(false)
            pendingSeekRef.current = null
        } else if (pendingRestoreRef.current !== null) {
            videoRef.current.currentTime = pendingRestoreRef.current.currentTime
            videoRef.current.playbackRate = pendingRestoreRef.current.playbackRate
            setPlaybackRate(pendingRestoreRef.current.playbackRate)
            pendingRestoreRef.current = null
        } else {
            videoRef.current.playbackRate = playbackRate
            if (isPlaying) {
                videoRef.current.play().catch(e => console.error("Autoplay prevented:", e))
            }
        }
    }, [isPlaying, playbackRate])

    const togglePlay = useCallback(() => {
        if (!videoRef.current) return
        if (videoRef.current.paused) {
            videoRef.current.play().catch(e => console.error(e))
            setIsPlaying(true)
        } else {
            videoRef.current.pause()
            setIsPlaying(false)
        }
    }, [])

    const updatePlaybackRate = useCallback((newRate: number) => {
        if (!videoRef.current) return
        const clampedRate = Math.max(0.25, Math.min(16, newRate))
        videoRef.current.playbackRate = clampedRate
        setPlaybackRate(clampedRate)
    }, [])

    const seekBy = useCallback((delta: number) => {
        if (!videoRef.current || !videoSrc) return
        videoRef.current.currentTime = Math.max(0, Math.min(videoRef.current.duration || 0, videoRef.current.currentTime + delta))
    }, [videoSrc])

    const seekToEntry = useCallback((videoIndex: number, videoTime: number) => {
        if (videoIndex !== currentVideoIndex && sessionFiles[videoIndex]) {
            setCurrentVideoIndex(videoIndex)
            setVideoSrc(createSafeObjectUrl(sessionFiles[videoIndex]))
            pendingSeekRef.current = videoTime
        } else if (videoRef.current) {
            videoRef.current.currentTime = videoTime
            videoRef.current.pause()
            setIsPlaying(false)
        }
    }, [currentVideoIndex, sessionFiles, createSafeObjectUrl])

    const prepareRestore = useCallback((currentTime: number, rate: number, file?: File) => {
        pendingRestoreRef.current = { currentTime, playbackRate: rate }
        if (file) {
            setSessionFiles([file])
            setVideoSrc(createSafeObjectUrl(file))
            setCurrentVideoIndex(0)
        }
    }, [createSafeObjectUrl])

    const videoPlayerProps = {
        ref: videoRef,
        videoSrc,
        onFilesSelect: handleFilesSelect,
        onPlay: () => setIsPlaying(true),
        onPause: () => setIsPlaying(false),
        onEnded: handleVideoEnd,
        onTimeUpdate: () => {},
        onLoadedMetadata: handleLoadedMetadata
    }

    return {
        videoRef,
        sessionFiles,
        videoSrc,
        currentVideoIndex,
        videoCount: sessionFiles.length,

        isPlaying,
        setIsPlaying,
        playbackRate,

        recordingStartTime,
        setRecordingStartTime,
        extractedStartTime,

        handleFilesSelect,
        handleAddMoreVideos,
        handleClearVideo,
        togglePlay,
        updatePlaybackRate,
        seekBy,
        seekToEntry,
        prepareRestore,
        videoPlayerProps
    }
}
"use client"

import { useState, useCallback } from "react"
import { extractTimeFromFilename } from "@/lib/utils"

export function useVideoQueue(onSessionStart?: (firstFile: File, extractedTime: Date | null) => void) {
    const [sessionFiles, setSessionFiles] = useState<File[]>([])
    const [videoSrc, setVideoSrc] = useState<string | null>(null)
    const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
    const [videoCount, setVideoCount] = useState(1)
    const [extractedStartTime, setExtractedStartTime] = useState<Date | null>(null)

    const handleFilesSelect = useCallback((files: File[]) => {
        if (files.length === 0) return

        const sortedFiles = [...files].sort((a, b) => {
            const timeA = extractTimeFromFilename(a.name)?.getTime() || 0
            const timeB = extractTimeFromFilename(b.name)?.getTime() || 0
            return timeA - timeB
        })

        const firstFile = sortedFiles[0]
        setSessionFiles(sortedFiles)
        setVideoSrc(URL.createObjectURL(firstFile))

        const extracted = extractTimeFromFilename(firstFile.name)
        setExtractedStartTime(extracted)
        setCurrentVideoIndex(0)
        setVideoCount(1)

        if (onSessionStart) {
            onSessionStart(firstFile, extracted)
        }
    }, [onSessionStart])

    const handleAddMoreVideos = useCallback((files: File[], onQueuePlay?: () => void) => {
        if (files.length === 0) return

        const sortedFiles = [...files].sort((a, b) => {
            const timeA = extractTimeFromFilename(a.name)?.getTime() || 0
            const timeB = extractTimeFromFilename(b.name)?.getTime() || 0
            return timeA - timeB
        })

        setSessionFiles(prev => {
            const updated = [...prev, ...sortedFiles]
            if (!videoSrc && sortedFiles.length > 0) {
                setVideoSrc(URL.createObjectURL(sortedFiles[0]))
                setVideoCount(c => c + 1)
                setCurrentVideoIndex(updated.indexOf(sortedFiles[0]))
                if (onQueuePlay) onQueuePlay()
            }
            return updated
        })
    }, [videoSrc])

    const handleNextVideo = useCallback(() => {
        if (currentVideoIndex + 1 < sessionFiles.length) {
            const nextIndex = currentVideoIndex + 1
            setCurrentVideoIndex(nextIndex)
            setVideoSrc(URL.createObjectURL(sessionFiles[nextIndex]))
            return true
        }
        return false
    }, [currentVideoIndex, sessionFiles])

    const handleClearVideo = useCallback(() => {
        setVideoSrc(null)
        setSessionFiles([])
        setCurrentVideoIndex(0)
        setVideoCount(1)
        setExtractedStartTime(null)
    }, [])

    return {
        sessionFiles,
        videoSrc,
        currentVideoIndex,
        videoCount,
        extractedStartTime,
        setVideoSrc,
        setCurrentVideoIndex,
        handleFilesSelect,
        handleAddMoreVideos,
        handleNextVideo,
        handleClearVideo,
    }
}
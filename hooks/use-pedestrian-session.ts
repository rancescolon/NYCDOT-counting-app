// hooks/use-pedestrian-session.ts
import { useState } from "react"

export interface Intersection {
    id: string
    x: number
    y: number
    label: string
}

export interface LogEntry {
    id: string
    timestamp: number
    key: string
    direction: string
}

export function usePedestrianSession() {
    const [counts, setCounts] = useState<Record<string, number>>({})
    const [log, setLog] = useState<LogEntry[]>([])
    const [videoSrc, setVideoSrc] = useState<string | null>(null)
    const [videoFileName, setVideoFileName] = useState<string>("")
    const [recordingStartTime, setRecordingStartTime] = useState<Date | null>(null)
    const [currentTime, setCurrentTime] = useState<number>(0)
    const [duration, setDuration] = useState<number>(0)
    const [playbackRate, setPlaybackRate] = useState<number>(1)
    const [intersections, setIntersections] = useState<Intersection[]>([])
    const [savedStateForRestore, setSavedStateForRestore] = useState<any>(null)
    const [pendingVideoRestore, setPendingVideoRestore] = useState<boolean>(false)
    const [videoCount, setVideoCount] = useState<number>(1)

    const handleAddIntersection = (intersection: Intersection) => {
        setIntersections((prev) => [...prev, intersection])
    }

    const handleCount = (key: string) => {
        setCounts((prev) => ({ ...prev, [key]: (prev[key] || 0) + 1 }))
        setLog((prev) => [
            ...prev,
            { id: Math.random().toString(36).substring(2, 9), timestamp: currentTime, key, direction: key },
        ])
    }

    const handleUndo = () => {
        if (log.length === 0) return
        const lastEntry = log[log.length - 1]
        setLog((prev) => prev.slice(0, -1))
        setCounts((prev) => ({
            ...prev,
            [lastEntry.key]: Math.max(0, (prev[lastEntry.key] || 1) - 1),
        }))
    }

    const handleExport = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ counts, log, intersections }))
        const downloadAnchor = document.createElement("a")
        downloadAnchor.setAttribute("href", dataStr)
        downloadAnchor.setAttribute("download", `${videoFileName || "pedestrian_data"}.json`)
        document.body.appendChild(downloadAnchor)
        downloadAnchor.click()
        downloadAnchor.remove()
    }

    const clearStorage = () => {
        setCounts({})
        setLog([])
        setIntersections([])
        setVideoSrc(null)
    }

    return {
        state: {
            counts,
            log,
            videoSrc,
            videoFileName,
            recordingStartTime,
            currentTime,
            duration,
            playbackRate,
            intersections,
            savedStateForRestore,
            pendingVideoRestore,
            videoCount,
        },
        actions: {
            setCounts,
            setLog,
            setVideoSrc,
            setVideoFileName,
            setRecordingStartTime,
            setCurrentTime,
            setDuration,
            setPlaybackRate,
            setIntersections,
            handleAddIntersection,
            handleCount,
            handleUndo,
            handleExport,
            clearStorage,
            setSavedStateForRestore,
            setPendingVideoRestore,
        },
    }
}
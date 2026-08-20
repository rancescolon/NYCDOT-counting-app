"use client"

import React, { useState, useImperativeHandle, useCallback, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { UploadCloud, RotateCcw, AlertTriangle, Info, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FFmpeg } from "@ffmpeg/ffmpeg"
import { fetchFile } from "@ffmpeg/util"

interface VideoPlayerProps {
    videoSrc: string | null
    onFilesSelect: (files: File[]) => void
    onPlay: () => void
    onPause: () => void
    onTimeUpdate: () => void
    onLoadedMetadata: () => void
    onEnded?: () => void
}

const VideoPlayer = React.forwardRef<HTMLVideoElement, VideoPlayerProps>(
    (
        { videoSrc, onFilesSelect, onPlay, onPause, onTimeUpdate, onLoadedMetadata, onEnded },
        ref,
    ) => {
        const [isDragging, setIsDragging] = useState(false)
        const [dragCounter, setDragCounter] = useState(0)
        const [showRestoreNotification, setShowRestoreNotification] = useState(false)
        const internalRef = useRef<HTMLVideoElement>(null)
        const [videoError, setVideoError] = useState<string | null>(null)
        const [showFormatInfo, setShowFormatInfo] = useState(false)

        const [isConverting, setIsConverting] = useState(false)
        const [conversionProgress, setConversionProgress] = useState(0)

        useImperativeHandle(ref, () => internalRef.current as HTMLVideoElement)

        React.useEffect(() => {
            if (videoSrc) {
                try {
                    const savedData = localStorage.getItem("vehicle-curbCuts-data")
                    if (savedData) {
                        const parsedData = JSON.parse(savedData)
                        if (
                            parsedData.videoSrc === videoSrc &&
                            (parsedData.entries?.length > 0 || parsedData.strokes?.length > 0)
                        ) {
                            setShowRestoreNotification(true)
                            setTimeout(() => setShowRestoreNotification(false), 10000)
                        }
                    }
                } catch (error) {
                    console.error("Error checking saved data:", error)
                }
            }
        }, [videoSrc])

        const validateVideoFormat = useCallback((file: File): boolean => {
            const supportedTypes = ["video/mp4", "video/webm", "video/ogg"]
            if (supportedTypes.includes(file.type)) return true

            const extension = file.name.toLowerCase().split(".").pop()
            return ["mp4", "webm", "ogg"].includes(extension || "")
        }, [])

        const convertSingleVideo = async (
            file: File,
            onProgressUpdate: (progressRatio: number) => void
        ): Promise<File | null> => {
            const ffmpeg = new FFmpeg()
            try {
                await ffmpeg.load()

                ffmpeg.on("progress", ({ progress }) => {
                    onProgressUpdate(progress)
                })

                const extension = file.name.substring(file.name.lastIndexOf("."))
                const uniqueId = Math.random().toString(36).substring(7)
                const inputName = `input_${uniqueId}${extension}`
                const outputName = `output_${uniqueId}.mp4`

                await ffmpeg.writeFile(inputName, await fetchFile(file))

                let exitCode = await ffmpeg.exec([
                    "-y",
                    "-i", inputName,
                    "-c", "copy",
                    "-movflags", "faststart",
                    outputName
                ])

                if (exitCode !== 0) {
                    exitCode = await ffmpeg.exec([
                        "-y",
                        "-i", inputName,
                        "-c:v", "libx264",
                        "-preset", "ultrafast",
                        "-c:a", "aac",
                        "-movflags", "faststart",
                        outputName
                    ])
                }

                if (exitCode !== 0) {
                    return null
                }

                const data = await ffmpeg.readFile(outputName)
                const blob = new Blob([data as any], { type: "video/mp4" })

                return new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".mp4", { type: "video/mp4" })
            } catch (err) {
                console.error(`Conversion error for ${file.name}:`, err)
                return null
            } finally {
                try {
                    ffmpeg.terminate()
                } catch {}
            }
        }

        const handleFilesProcess = useCallback(
            async (files: File[]) => {
                setVideoError(null)
                setShowFormatInfo(false)

                const nativeFiles: File[] = []
                const filesToConvert: File[] = []

                for (const file of files) {
                    if (!file.type.startsWith("video/") && !file.name.match(/\.(avi|mov|mkv|wmv|flv|mp4|webm|ogg)$/i)) continue

                    const extension = file.name.toLowerCase().split(".").pop() || ""
                    const needsConversion = ["avi", "mov", "mkv", "wmv", "flv"].includes(extension) ||
                        file.type.includes("x-msvideo") ||
                        file.type.includes("quicktime") ||
                        file.type.includes("x-matroska")

                    if (needsConversion) {
                        filesToConvert.push(file)
                    } else if (validateVideoFormat(file)) {
                        nativeFiles.push(file)
                    }
                }

                let convertedFiles: File[] = []

                if (filesToConvert.length > 0) {
                    setIsConverting(true)
                    setConversionProgress(0)

                    const progressMap = new Array(filesToConvert.length).fill(0)

                    const conversionPromises = filesToConvert.map((file, index) =>
                        convertSingleVideo(file, (progress) => {
                            progressMap[index] = progress
                            const totalAvg = progressMap.reduce((acc, curr) => acc + curr, 0) / filesToConvert.length
                            setConversionProgress(Math.round(totalAvg * 100))
                        })
                    )

                    const results = await Promise.all(conversionPromises)
                    setIsConverting(false)

                    convertedFiles = results.filter((file): file is File => file !== null)
                }

                const allProcessedFiles = [...nativeFiles, ...convertedFiles]

                if (allProcessedFiles.length === 0) {
                    setVideoError("Some or all files are unsupported. Please use MP4, WebM, OGG, AVI, MOV, or MKV format.")
                    setShowFormatInfo(true)
                    return
                }

                const sortedFiles = allProcessedFiles.sort((a, b) =>
                    a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" })
                )

                try {
                    localStorage.removeItem("vehicle-curbCuts-data")
                } catch (error) {
                    console.error("Error clearing saved data:", error)
                }

                onFilesSelect(sortedFiles)
            },
            [onFilesSelect, validateVideoFormat]
        )

        const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault()
            e.stopPropagation()
            setDragCounter((prev) => prev + 1)
            setIsDragging(true)
        }, [])

        const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault()
            e.stopPropagation()
            setDragCounter((prev) => {
                const newCounter = prev - 1
                if (newCounter === 0) setIsDragging(false)
                return newCounter
            })
        }, [])

        const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault()
            e.stopPropagation()
        }, [])

        const handleDrop = useCallback(
            (e: React.DragEvent<HTMLDivElement>) => {
                e.preventDefault()
                e.stopPropagation()
                setIsDragging(false)
                setDragCounter(0)

                const files = Array.from(e.dataTransfer.files)
                if (files.length > 0) handleFilesProcess(files)
            },
            [handleFilesProcess],
        )

        const handleFileInputChange = useCallback(
            (e: React.ChangeEvent<HTMLInputElement>) => {
                const files = Array.from(e.target.files || [])
                if (files.length > 0) handleFilesProcess(files)
                e.target.value = ""
            },
            [handleFilesProcess],
        )

        const clearSavedData = useCallback(() => {
            try {
                localStorage.removeItem("vehicle-curbCuts-data")
                setShowRestoreNotification(false)
                window.location.reload()
            } catch (error) {
                console.error("Error clearing saved data:", error)
            }
        }, [])

        const handleVideoError = useCallback(() => {
            setVideoError("Unable to load video. Please try a different file or check that the video file is not corrupted.")
            if (onEnded) onEnded()
        }, [onEnded])

        const handleTryAgain = useCallback(() => {
            setVideoError(null)
            setShowFormatInfo(false)
            document.getElementById("video-upload-hidden")?.click()
        }, [])

        return (
            <Card
                className="h-full w-full flex flex-col shadow-lg rounded-b-none rounded-t-lg relative"
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                {isDragging && (
                    <div className="absolute inset-0 z-50 bg-primary/20 backdrop-blur-sm border-4 border-dashed border-primary rounded-lg flex items-center justify-center">
                        <div className="bg-background/90 p-6 rounded-xl shadow-xl text-center pointer-events-none">
                            <UploadCloud className="h-12 w-12 text-primary mx-auto mb-2" />
                            <p className="text-xl font-bold text-primary">Drop videos to process</p>
                        </div>
                    </div>
                )}

                {showRestoreNotification && (
                    <div className="absolute top-4 right-4 z-40 bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-lg max-w-sm animate-in slide-in-from-top duration-300">
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0">
                                <RotateCcw className="h-5 w-5 text-blue-600 mt-0.5" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-semibold text-blue-800 mb-1">Previous Session Restored</h4>
                                <p className="text-xs text-blue-700 mb-3">
                                    Your counting data and lines have been automatically restored from your last session.
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setShowRestoreNotification(false)}
                                        className="text-xs h-7 px-2"
                                    >
                                        Got it
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={clearSavedData}
                                        className="text-xs h-7 px-2 text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
                                    >
                                        Start Fresh
                                    </Button>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setShowRestoreNotification(false)}
                                className="h-6 w-6 text-blue-600 hover:bg-blue-100 flex-shrink-0"
                            >
                                ×
                            </Button>
                        </div>
                    </div>
                )}

                <CardContent className="p-4 flex-grow flex flex-col min-h-0 relative">
                    <div
                        className={`relative flex-grow rounded-lg flex items-center justify-center border-2 border-dashed transition-all duration-300 overflow-hidden ${
                            !videoSrc && !isConverting ? "cursor-pointer" : ""
                        } ${
                            !videoSrc && !isConverting
                                ? "bg-slate-200 dark:bg-slate-800/50 border-slate-300 dark:border-slate-700 hover:border-primary/50 hover:bg-primary/5 hover:scale-[1.01]"
                                : "border-transparent bg-black"
                        }`}
                        {...(!videoSrc && !isConverting && {
                            onClick: () => document.getElementById("video-upload-hidden")?.click(),
                        })}
                    >
                        {isConverting ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center w-full h-full bg-black text-slate-100 z-10">
                                <Loader2 className="animate-spin h-12 w-12 text-blue-500 mb-4" />
                                <p className="text-lg font-semibold mb-1 tracking-wide">
                                    Optimizing Videos
                                </p>
                                <p className="text-sm text-slate-400 mb-6 font-medium">
                                    {conversionProgress}% Complete
                                </p>
                                <div className="w-full max-w-xs bg-slate-800 rounded-full h-2 overflow-hidden shadow-inner border border-slate-700">
                                    <div
                                        className="bg-blue-500 h-full rounded-full transition-all duration-300 ease-out"
                                        style={{ width: `${conversionProgress}%` }}
                                    ></div>
                                </div>
                            </div>
                        ) : videoError ? (
                            <div className="text-center p-8 select-none flex flex-col items-center justify-center w-full h-full max-w-2xl mx-auto bg-slate-50 dark:bg-slate-900 rounded-lg">
                                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                                    <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
                                </div>
                                <p className="text-lg font-semibold mb-3 leading-tight text-red-700 dark:text-red-300">
                                    Video Format Issue
                                </p>
                                <p className="text-sm mb-6 leading-relaxed max-w-md text-red-600 dark:text-red-400">
                                    {videoError}
                                </p>

                                {showFormatInfo && (
                                    <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg max-w-md text-left">
                                        <div className="flex items-start gap-3">
                                            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
                                                    Supported Formats:
                                                </h4>
                                                <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                                                    <li>• <strong>MP4, WebM, OGG:</strong> Played natively</li>
                                                    <li>• <strong>AVI, MOV, MKV, WMV:</strong> Handled automatically</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-3">
                                    <Button onClick={handleTryAgain} className="bg-blue-600 hover:bg-blue-700">
                                        Choose Different File
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setVideoError(null)
                                            setShowFormatInfo(false)
                                        }}
                                        className="bg-transparent"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        ) : videoSrc ? (
                            <div className="relative w-full h-full">
                                <video
                                    ref={internalRef}
                                    src={videoSrc}
                                    className="w-full h-full object-contain bg-black rounded"
                                    onPlay={onPlay}
                                    onPause={onPause}
                                    onEnded={onEnded}
                                    onError={handleVideoError}
                                    controls={false}
                                    preload="metadata"
                                    onTimeUpdate={onTimeUpdate}
                                    onLoadedMetadata={onLoadedMetadata}
                                />
                            </div>
                        ) : (
                            <div className="text-center text-muted-foreground p-8 select-none flex flex-col items-center justify-center w-full h-full z-10">
                                <UploadCloud className="h-16 w-16 text-slate-400 mb-4 transition-transform duration-300 hover:scale-110" />
                                <p className="text-lg font-semibold mb-2 leading-tight">Drag & drop videos here</p>
                                <p className="text-sm mb-4 leading-tight">or click anywhere to select files</p>

                                <div className="bg-slate-100 dark:bg-slate-700 rounded-lg px-6 py-5 mb-6 max-w-md relative">
                                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-3 font-medium">
                                        <strong>Supported formats:</strong>
                                    </p>
                                    <div className="flex flex-wrap gap-2 justify-center">
                                        <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-3 py-1.5 rounded text-sm font-semibold">MP4</span>
                                        <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded text-sm font-semibold">WebM</span>
                                        <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-3 py-1.5 rounded text-sm font-semibold">OGG</span>
                                        {/*<span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-3 py-1.5 rounded text-sm font-semibold">AVI</span>*/}
                                        {/*<span className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-3 py-1.5 rounded text-sm font-semibold">MOV</span>*/}
                                        {/*<span className="bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 px-3 py-1.5 rounded text-sm font-semibold">MKV</span>*/}
                                    </div>
                                </div>
                            </div>
                        )}
                        <Input
                            id="video-upload-hidden"
                            type="file"
                            multiple
                            accept="video/*,.mkv,.avi,.mov,.wmv,.flv"
                            onChange={handleFileInputChange}
                            className="hidden"
                            style={{
                                position: "absolute",
                                left: "-9999px",
                                width: "1px",
                                height: "1px",
                                opacity: 0,
                                pointerEvents: "none",
                            }}
                            tabIndex={-1}
                            aria-hidden="true"
                        />
                    </div>
                </CardContent>
            </Card>
        )
    },
)

VideoPlayer.displayName = "VideoPlayer"
export default VideoPlayer
"use client"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { UploadCloud, Download, FileVideo, ListChecks, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { FFmpeg } from "@ffmpeg/ffmpeg"
import { fetchFile } from "@ffmpeg/util"

interface VideoEndPromptProps {
    isOpen: boolean
    mode?: "end" | "export"
    onAddMoreVideos: (files: File[]) => void
    onStartNewSection: () => void
    onExport: () => void
    onReview: () => void
    onCancel?: () => void
    totalCounts: number
    videoCount: number
}

export default function VideoEndPrompt({
                                           isOpen,
                                           mode = "end",
                                           onAddMoreVideos,
                                           onStartNewSection,
                                           onExport,
                                           onReview,
                                           onCancel,
                                           totalCounts,
                                           videoCount,
                                       }: VideoEndPromptProps) {
    const [isDragging, setIsDragging] = useState(false)
    const [isConverting, setIsConverting] = useState(false)
    const [conversionProgress, setConversionProgress] = useState(0)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const validateVideoFormat = (file: File): boolean => {
        const supportedTypes = ["video/mp4", "video/webm", "video/ogg"]
        if (supportedTypes.includes(file.type)) return true
        const extension = file.name.toLowerCase().split(".").pop()
        return ["mp4", "webm", "ogg"].includes(extension || "")
    }

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

            if (exitCode !== 0) return null

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

    const handleFilesProcess = async (files: File[]) => {
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

        if (allProcessedFiles.length > 0) {
            // Sort videos naturally before appending
            const sortedFiles = allProcessedFiles.sort((a, b) =>
                a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" })
            )

            // Pass processed & sorted files to parent handler
            onAddMoreVideos(sortedFiles)

            // Close popup
            if (onCancel) onCancel()
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        if (isConverting) return

        const files = Array.from(e.dataTransfer.files)
        if (files.length > 0) {
            handleFilesProcess(files)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && !isConverting && onCancel && onCancel()}>
            <DialogContent className="max-w-md mx-auto [&>button]:hidden">
                <DialogTitle className="sr-only">
                    {mode === "export" ? "Exporting Video" : "Video Complete"}
                </DialogTitle>

                <div className="flex flex-col items-center p-2 space-y-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                        <CheckCircle className="h-10 w-10 text-white" />
                    </div>

                    <div className="text-center space-y-2">
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-white">
                            {mode === "export" ? "Exporting Video" : "Video Complete!"}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                            You've analyzed <span className="font-semibold text-blue-600 dark:text-blue-400">{videoCount}</span> video(s) and logged <span className="font-semibold text-blue-600 dark:text-blue-400">{totalCounts}</span> total vehicles.
                        </p>
                    </div>

                    {/* Drag & Drop or Conversion Progress Zone */}
                    <div
                        className={`w-full p-6 border-2 border-dashed rounded-xl transition-colors duration-200 ${
                            isConverting
                                ? 'border-blue-500 bg-black text-white cursor-wait'
                                : isDragging
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 cursor-pointer'
                                    : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer'
                        }`}
                        onDragOver={(e) => { e.preventDefault(); if (!isConverting) setIsDragging(true) }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => {
                            if (!isConverting) fileInputRef.current?.click()
                        }}
                    >
                        {isConverting ? (
                            <div className="flex flex-col items-center justify-center py-2 text-center">
                                <Loader2 className="animate-spin h-8 w-8 text-blue-500 mb-3" />
                                <h3 className="text-sm font-semibold text-slate-100">Optimizing New Videos</h3>
                                <p className="text-xs text-slate-400 mt-1 mb-3">{conversionProgress}% Complete</p>
                                <div className="w-full max-w-xs bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
                                    <div
                                        className="bg-blue-500 h-full rounded-full transition-all duration-300 ease-out"
                                        style={{ width: `${conversionProgress}%` }}
                                    ></div>
                                </div>
                            </div>
                        ) : (
                            <>
                                <UploadCloud className={`w-10 h-10 mx-auto mb-3 ${isDragging ? 'text-blue-500' : 'text-slate-400'}`} />
                                <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200 text-center">Add More Videos</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-center">
                                    Drag & drop or click to append more videos to this session.
                                </p>
                            </>
                        )}

                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            multiple
                            accept="video/*,.mkv,.avi,.mov,.wmv,.flv"
                            onChange={(e) => {
                                const files = Array.from(e.target.files || [])
                                if (files.length > 0) handleFilesProcess(files)
                                e.target.value = ""
                            }}
                        />
                    </div>

                    <div className="flex flex-col w-full space-y-3">
                        <Button disabled={isConverting} onClick={onReview} className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                            <ListChecks className="h-4 w-4" />
                            Review Logs
                        </Button>

                        <Button disabled={isConverting} onClick={onExport} variant="outline" className="w-full flex items-center justify-center gap-2">
                            <Download className="h-4 w-4" />
                            Export Data
                        </Button>

                        <Button disabled={isConverting} onClick={onStartNewSection} variant="ghost" className="w-full flex items-center justify-center gap-2 text-slate-500 hover:text-amber-600 dark:hover:text-amber-500">
                            <FileVideo className="h-4 w-4" />
                            Start New Section
                        </Button>

                        {mode === "export" && onCancel && (
                            <Button disabled={isConverting} onClick={onCancel} variant="ghost" className="w-full flex items-center justify-center gap-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 mt-1">
                                <XCircle className="h-4 w-4" />
                                Cancel & Return
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
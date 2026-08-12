//TODO: make this scaleable
"use client"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { UploadCloud, Download, FileVideo, ListChecks, CheckCircle, XCircle } from "lucide-react"

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
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('video/'))
        if (files.length > 0) {
            onAddMoreVideos(files)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel && onCancel()}>
            {/* [&>button]:hidden hides the default Radix UI close 'X' button inside Shadcn's DialogContent */}
            <DialogContent className="max-w-md mx-auto [&>button]:hidden">
                {/* Hidden title for screen reader accessibility */}
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

                    {/* Drag & Drop Zone for appending videos */}
                    <div
                        className={`w-full p-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors duration-200 ${
                            isDragging
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <UploadCloud className={`w-10 h-10 mx-auto mb-3 ${isDragging ? 'text-blue-500' : 'text-slate-400'}`} />
                        <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200 text-center">Add More Videos</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-center">
                            Drag & drop or click to append more videos to this session.
                        </p>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            multiple
                            accept="video/mp4, video/webm, video/ogg"
                            onChange={(e) => {
                                const files = Array.from(e.target.files || [])
                                if (files.length > 0) onAddMoreVideos(files)
                                e.target.value = ""
                            }}
                        />
                    </div>

                    <div className="flex flex-col w-full space-y-3">
                        <Button onClick={onReview} className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                            <ListChecks className="h-4 w-4" />
                            Review Logs
                        </Button>

                        <Button onClick={onExport} variant="outline" className="w-full flex items-center justify-center gap-2">
                            <Download className="h-4 w-4" />
                            Export Data
                        </Button>

                        <Button onClick={onStartNewSection} variant="ghost" className="w-full flex items-center justify-center gap-2 text-slate-500 hover:text-amber-600 dark:hover:text-amber-500">
                            <FileVideo className="h-4 w-4" />
                            Start New Section
                        </Button>

                        {/* If in export mode, give the user an easy way to go back to the video */}
                        {mode === "export" && onCancel && (
                            <Button onClick={onCancel} variant="ghost" className="w-full flex items-center justify-center gap-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 mt-1">
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
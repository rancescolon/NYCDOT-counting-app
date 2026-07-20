"use client"

import React, { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, Loader2 } from "lucide-react"

interface ExportProgressModalProps {
  isOpen: boolean
  onComplete: () => void
  totalEntries: number
  groupedEntries: number // Currently unused, kept for prop compatibility
}

export default function ExportProgressModal({
                                              isOpen,
                                              onComplete,
                                              totalEntries,
                                            }: ExportProgressModalProps) {
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<"processing" | "formatting" | "complete">("processing")

  useEffect(() => {
    if (isOpen) {
      setProgress(0)
      setStatus("processing")

      const timer1 = setTimeout(() => {
        setProgress(50)
        setStatus("formatting")
      }, 600)

      const timer2 = setTimeout(() => {
        setProgress(100)
        setStatus("complete")
      }, 1500)

      const timer3 = setTimeout(() => {
        onComplete()
      }, 2000)

      return () => {
        clearTimeout(timer1)
        clearTimeout(timer2)
        clearTimeout(timer3)
      }
    }
  }, [isOpen, onComplete])

  return (
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Exporting Vehicle Data</DialogTitle>
            <DialogDescription>
              Please wait while we format your session data into an Excel-ready spreadsheet.
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 space-y-6">
            <Progress value={progress} className="h-2" />

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                {status === "processing" ? (
                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                ) : (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                )}
                Processing {totalEntries} logged vehicles
              </span>
              </div>

              <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                {status === "complete" ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : status === "formatting" ? (
                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                ) : (
                    <div className="h-4 w-4" />
                )}
                Generating Master CSV File
              </span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
  )
}
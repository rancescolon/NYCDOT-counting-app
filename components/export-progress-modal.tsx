"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, Download, CheckCircle } from "lucide-react"

interface ExportProgressModalProps {
  isOpen: boolean
  onComplete: () => void
  onCancel: () => void
}

export default function ExportProgressModal({ isOpen, onComplete, onCancel }: ExportProgressModalProps) {
  const [isProcessing, setIsProcessing] = useState(true)

  // Emulate a short loading progress bar for visual feedback
  useEffect(() => {
    if (isOpen) {
      setIsProcessing(true)
      const timer = setTimeout(() => {
        setIsProcessing(false)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  return (
      <Dialog open={isOpen}>
        {/* [&>button]:hidden hides the default Radix UI close 'X' button inside Shadcn's DialogContent */}
        <DialogContent className="max-w-md mx-auto [&>button]:hidden">
          <DialogTitle className="sr-only">Exporting Video</DialogTitle>

          <div className="flex flex-col items-center p-2 space-y-6">

            {/* Matches the VideoEndPrompt icon container styling */}
            <div className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-colors duration-500 ${isProcessing ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gradient-to-br from-green-500 to-green-600'}`}>
              {isProcessing ? (
                  <Loader2 className="h-10 w-10 text-white animate-spin" />
              ) : (
                  <CheckCircle className="h-10 w-10 text-white" />
              )}
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white">
                {isProcessing ? "Exporting Video..." : "Export Complete!"}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {isProcessing
                    ? "Please wait while we compile and format your logged data into an Excel spreadsheet."
                    : "Your Excel file has been formatted and is ready for download."}
              </p>
            </div>

            <div className="flex flex-col w-full space-y-3">
              <Button
                  onClick={onComplete}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                Download Excel File
              </Button>

              <Button
                  onClick={onCancel}
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2 bg-transparent border-slate-300 dark:border-slate-700"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
  )
}
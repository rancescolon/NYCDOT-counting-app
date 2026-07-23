"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

interface VideoTimeInputDialogProps {
  isOpen: boolean
  onConfirm: (startTime: Date) => void
  onSkip: () => void
  suggestedTime?: Date | null
}

export default function VideoTimeInputDialog({ isOpen, onConfirm, onSkip, suggestedTime }: VideoTimeInputDialogProps) {
  const [isManualMode, setIsManualMode] = useState(false)
  const [manualDate, setManualDate] = useState("")
  const [manualTime, setManualTime] = useState("")

  useEffect(() => {
    if (isOpen) {
      // If we have a suggested time, default to confirmation screen. Otherwise, go straight to manual.
      setIsManualMode(!suggestedTime)

      const defaultDate = suggestedTime || new Date()
      // Format to YYYY-MM-DD for the date input
      setManualDate(defaultDate.toISOString().split('T')[0])
      // Format to HH:MM for the time input (local time)
      setManualTime(defaultDate.toTimeString().split(' ')[0].substring(0, 5))
    }
  }, [isOpen, suggestedTime])

  if (!isOpen) return null

  const handleConfirmManual = () => {
    if (!manualDate || !manualTime) return
    const [year, month, day] = manualDate.split('-').map(Number)
    const [hour, minute] = manualTime.split(':').map(Number)

    const date = new Date(year, month - 1, day, hour, minute, 0)
    onConfirm(date)
  }

  return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl w-[420px] border border-slate-200 dark:border-slate-700">
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Confirm Time and Date</h3>

          {suggestedTime && !isManualMode ? (
              <div className="flex flex-col gap-4 animate-in fade-in">


                <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg text-center border border-slate-200 dark:border-slate-600">
              <span className="font-bold text-xl text-slate-800 dark:text-slate-100">
                {suggestedTime.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
              </span>
                  <br />
                  <span className="font-semibold text-lg text-blue-600 dark:text-blue-400">
                {suggestedTime.toLocaleTimeString(undefined, { hour: 'numeric', minute: 'numeric', second: 'numeric' })}
              </span>
                </div>


                <div className="flex justify-end gap-3 mt-2">
                  <Button variant="outline" onClick={() => setIsManualMode(true)}>No, edit manually</Button>
                  <Button onClick={() => onConfirm(suggestedTime)} className="bg-blue-600 text-white hover:bg-blue-700 shadow-sm">Yes, use this time</Button>
                </div>
              </div>
          ) : (
              <div className="flex flex-col gap-4 animate-in fade-in">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Please enter the exact date and time this video started recording.
                </p>

                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Date</label>
                    <input
                        type="date"
                        className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                        value={manualDate}
                        onChange={e => setManualDate(e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Time</label>
                    <input
                        type="time"
                        className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                        value={manualTime}
                        onChange={e => setManualTime(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4">

                  <div className="flex gap-2">
                    <Button onClick={handleConfirmManual} className="bg-blue-600 text-white hover:bg-blue-700">Confirm</Button>
                  </div>
                </div>
              </div>
          )}
        </div>
      </div>
  )
}
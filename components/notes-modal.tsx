"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

interface NotesModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: (note: string) => void
}

export default function NotesModal({ isOpen, onClose, onSave }: NotesModalProps) {
    const [pendingNote, setPendingNote] = useState("")

    useEffect(() => {
        if (isOpen) setPendingNote("")
    }, [isOpen])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl w-96 border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Add Note to Last Entry</h3>
                <input
                    type="text"
                    autoFocus
                    placeholder="Type a note..."
                    className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded mb-4 text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                    value={pendingNote}
                    onChange={e => setPendingNote(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === 'Enter') onSave(pendingNote)
                        if (e.key === 'Escape') onClose()
                    }}
                />
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={() => onSave(pendingNote)} className="bg-blue-600 text-white hover:bg-blue-700">Save Note</Button>
                </div>
            </div>
        </div>
    )
}
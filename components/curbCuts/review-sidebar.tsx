"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { CountEntry, VehicleCategory } from "@/lib/types/types"
import { X, Edit2, Check, ChevronDown } from "lucide-react"

interface ReviewSidebarProps {
    isOpen: boolean
    onClose: () => void
    entries: CountEntry[]
    onSeekToEntry: (entry: CountEntry) => void
    onUpdateEntry: (id: string, updatedEntry: CountEntry) => void
    onDeleteEntry?: (id: string) => void
}

const CATEGORIES: { label: string; value: VehicleCategory }[] = [
    { label: "Cut Through", value: "cut_through" },
    { label: "Sidewalk Parking", value: "parking" },
    { label: "Sidewalk Driving", value: "driving" },
]

export default function ReviewSidebar({
                                          isOpen,
                                          onClose,
                                          entries,
                                          onSeekToEntry,
                                          onUpdateEntry,
                                      }: ReviewSidebarProps) {
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editCategory, setEditCategory] = useState<VehicleCategory>("cut_through")
    const [editNote, setEditNote] = useState("")
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)

    if (!isOpen) return null

    const handleStartEdit = (entry: CountEntry) => {
        setEditingId(entry.id)
        setEditCategory(entry.category)
        setEditNote(entry.note || "")
    }

    const handleSaveEdit = (entry: CountEntry) => {
        onUpdateEntry(entry.id, {
            ...entry,
            category: editCategory,
            note: editNote
        })
        setEditingId(null)
        setOpenDropdownId(null)
    }

    // Filter to only entries marked with '?' and preserve their original 1-based index numbers
    const flaggedEntries = entries
        .map((entry, originalIndex) => ({ entry, originalIndex }))
        .filter(({ entry }) => entry.note?.includes('?'))

    return (
        <aside className="fixed inset-y-0 right-0 w-[400px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl z-50 flex flex-col transition-transform duration-300">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                    Flagged Entries ({flaggedEntries.length})
                </h2>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-9 w-9">
                    <X className="h-5 w-5" />
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {flaggedEntries.length === 0 ? (
                    <div className="text-center text-slate-400 dark:text-slate-500 py-12 italic text-sm">
                        No flagged entries ('?') recorded yet.
                    </div>
                ) : (
                    flaggedEntries.map(({ entry, originalIndex }) => {
                        const isEditing = editingId === entry.id
                        const isDropdownOpen = openDropdownId === entry.id
                        const displayIndex = originalIndex + 1 // Retains exact sequence number with skipped gaps

                        return (
                            <div
                                key={entry.id}
                                className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-col gap-2 transition-all hover:shadow-sm"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                        #{displayIndex} • {entry.timestamp}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onSeekToEntry(entry)}
                                            className="text-xs h-7 px-2 text-blue-600 dark:text-blue-400 hover:underline"
                                        >
                                            Jump
                                        </Button>
                                        {!isEditing ? (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleStartEdit(entry)}
                                                className="h-7 w-7 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                                            >
                                                <Edit2 className="h-3.5 w-3.5" />
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleSaveEdit(entry)}
                                                className="h-7 w-7 text-green-600 hover:text-green-700"
                                            >
                                                <Check className="h-3.5 w-3.5" />
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {!isEditing ? (
                                    <div className="flex flex-col gap-1">
                                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                            {entry.category === 'cut_through' ? 'Cut Through' : entry.category === 'parking' ? 'Sidewalk Parking' : 'Sidewalk Driving'}
                                        </span>
                                        {entry.note && (
                                            <span className="text-xs text-slate-500 dark:text-slate-400 italic">
                                                Note: {entry.note}
                                            </span>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-2 pt-1">
                                        {/* Custom Dropdown Implementation */}
                                        <div className="relative">
                                            <button
                                                type="button"
                                                onClick={() => setOpenDropdownId(isDropdownOpen ? null : entry.id)}
                                                className="w-full flex items-center justify-between px-3 py-1.5 text-sm bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <span>
                                                    {CATEGORIES.find(c => c.value === editCategory)?.label || "Select Category"}
                                                </span>
                                                <ChevronDown className="h-4 w-4 opacity-50" />
                                            </button>

                                            {isDropdownOpen && (
                                                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg z-20 overflow-hidden">
                                                    {CATEGORIES.map(cat => (
                                                        <button
                                                            key={cat.value}
                                                            type="button"
                                                            onClick={() => {
                                                                setEditCategory(cat.value)
                                                                setOpenDropdownId(null)
                                                            }}
                                                            className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-blue-50 dark:hover:bg-slate-700 ${
                                                                editCategory === cat.value ? 'bg-blue-100/50 dark:bg-slate-700/80 font-medium text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-200'
                                                            }`}
                                                        >
                                                            {cat.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <input
                                            type="text"
                                            value={editNote}
                                            onChange={(e) => setEditNote(e.target.value)}
                                            placeholder="Add note..."
                                            className="px-3 py-1 text-xs bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                )}
                            </div>
                        )
                    })
                )}
            </div>
        </aside>
    )
}
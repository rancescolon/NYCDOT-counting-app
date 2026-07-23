"use client"

import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CountEntry, VehicleCategory, VehicleType } from "@/lib/types"

interface ReviewSidebarProps {
    isOpen: boolean
    onClose: () => void
    entries: CountEntry[]
    onSeek: (time: number) => void
    onUpdateEntry: (id: string, updatedEntry: CountEntry) => void
}

export default function ReviewSidebar({ isOpen, onClose, entries, onSeek, onUpdateEntry }: ReviewSidebarProps) {
    if (!isOpen) return null

    const formatCat = (cat: string) => {
        if (cat === 'cut_through') return 'Cut Through'
        if (cat === 'parking') return 'Parking'
        return 'Driving'
    }

    return (
        <div className="fixed inset-y-0 right-0 w-96 bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 z-50 flex flex-col animate-in slide-in-from-right duration-300">

            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                <div>
                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Review Logs</h2>
                    <p className="text-xs text-slate-500">{entries.length} total entries</p>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-slate-200 dark:hover:bg-slate-800">
                    <X className="h-5 w-5 text-slate-500" />
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                {entries.length === 0 ? (
                    <p className="text-center text-slate-500 text-sm mt-10">No entries logged yet.</p>
                ) : (
                    entries.map((entry, i) => (
                        <div key={entry.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col gap-2 relative">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-xs font-bold text-slate-400">#{i + 1}</span>
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    className="h-6 text-xs px-2"
                                    onClick={() => onSeek(entry.videoTime)}
                                >
                                    Seek Video
                                </Button>
                            </div>

                            <div className="flex gap-2">
                                <select
                                    className="flex-1 p-1 text-xs border rounded bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600"
                                    value={entry.category}
                                    onChange={(e) => onUpdateEntry(entry.id, { ...entry, category: e.target.value as VehicleCategory })}
                                >
                                    <option value="cut_through">Cut Through</option>
                                    <option value="parking">Parking</option>
                                    <option value="driving">Driving</option>
                                </select>

                                <select
                                    className="w-24 p-1 text-xs border rounded bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600"
                                    value={entry.type}
                                    onChange={(e) => onUpdateEntry(entry.id, { ...entry, type: e.target.value as VehicleType })}
                                >
                                    <option value="Car">Car</option>
                                    <option value="Moto">Moto</option>
                                    <option value="Ebike">E-Bike</option>
                                    <option value="Truck">Truck</option>
                                </select>
                            </div>

                            <input
                                type="text"
                                placeholder="Notes / Modifiers..."
                                className="w-full p-1 text-xs border rounded bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600"
                                value={entry.note || ""}
                                onChange={(e) => onUpdateEntry(entry.id, { ...entry, note: e.target.value })}
                            />
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
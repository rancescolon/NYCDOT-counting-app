"use client"

import { X, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CountEntry, VehicleCategory, VehicleType } from "@/lib/types"

interface ReviewSidebarProps {
    isOpen: boolean
    onClose: () => void
    entries: CountEntry[]
    onSeekToEntry: (entry: CountEntry) => void
    onUpdateEntry: (id: string, updatedEntry: CountEntry) => void
}

export default function ReviewSidebar({ isOpen, onClose, entries, onSeekToEntry, onUpdateEntry }: ReviewSidebarProps) {
    if (!isOpen) return null

    // FIX: Explicitly include all entries that contain a '?' OR are a non-Car modifier
    const flaggedEntries = entries.filter(e =>
        (e.note && e.note.includes('?')) || e.type !== 'Car'
    )

    return (
        <div className="fixed inset-y-0 right-0 w-[400px] bg-white dark:bg-slate-900 shadow-[rgba(0,0,0,0.3)_0px_0px_30px] border-l border-slate-200 dark:border-slate-800 z-50 flex flex-col animate-in slide-in-from-right duration-300">

            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <Search className="w-5 h-5 text-indigo-500" />
                        Needs Review
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">{flaggedEntries.length} flagged log(s)</p>
                </div>
                <Button variant="outline" size="icon" onClick={onClose} className="hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700">
                    <X className="h-5 w-5 text-slate-500" />
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-slate-50/50 dark:bg-slate-950/50">
                {flaggedEntries.length === 0 ? (
                    <div className="text-center mt-12">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl">🎉</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 font-medium">All caught up!</p>
                        <p className="text-slate-500 text-sm mt-1">No flagged entries require review.</p>
                    </div>
                ) : (
                    flaggedEntries.map((entry, i) => (
                        <div key={entry.id} className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-3">
                            <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Log #{entries.findIndex(e => e.id === entry.id) + 1}
                </span>
                                <Button
                                    size="sm"
                                    variant="default"
                                    className="h-7 text-xs px-3 bg-indigo-600 hover:bg-indigo-700 text-white"
                                    onClick={() => onSeekToEntry(entry)}
                                >
                                    Review Video
                                </Button>
                            </div>

                            <div className="flex gap-2">
                                <select
                                    className="flex-1 p-2 text-sm font-medium border rounded-md bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={entry.category}
                                    onChange={(e) => onUpdateEntry(entry.id, { ...entry, category: e.target.value as VehicleCategory })}
                                >
                                    <option value="cut_through">Cut Through</option>
                                    <option value="parking">Sidewalk Parking</option>
                                    <option value="driving">Sidewalk Driving</option>
                                </select>

                                <select
                                    className="w-28 p-2 text-sm font-medium border rounded-md bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={entry.type}
                                    onChange={(e) => onUpdateEntry(entry.id, { ...entry, type: e.target.value as VehicleType })}
                                >
                                    <option value="Car">Car</option>
                                    <option value="Moto">Moto</option>
                                    <option value="Ebike">E-Bike</option>
                                    <option value="Truck">Truck</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-[11px] font-semibold text-slate-400 uppercase mb-1 block">Notes / Modifiers</label>
                                <input
                                    type="text"
                                    placeholder="Enter notes..."
                                    className="w-full p-2 text-sm border rounded-md bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={entry.note || ""}
                                    onChange={(e) => onUpdateEntry(entry.id, { ...entry, note: e.target.value })}
                                />
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
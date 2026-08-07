// components/speed-study/ActiveStudyView.tsx

import React, { useState, useEffect, useRef } from 'react';
import { SpeedStudyFormState } from '@/lib/types';
import * as XLSX from 'xlsx-js-style';

interface SpeedRecord {
    id: string;
    speed: number;
    timestamp: string;
}

interface Props {
    studyData: SpeedStudyFormState;
    onEndStudy: (records: SpeedRecord[]) => void;
}

export const ActiveStudyView: React.FC<Props> = ({ studyData, onEndStudy }) => {
    const [currentInput, setCurrentInput] = useState<string>('');
    const [recordedSpeeds, setRecordedSpeeds] = useState<SpeedRecord[]>([]);
    const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

    const inputRef = useRef<HTMLInputElement>(null);

    // Keep mobile numeric keyboard focused at all times
    useEffect(() => {
        const focusTimer = setTimeout(() => {
            inputRef.current?.focus();
        }, 100);
        return () => clearTimeout(focusTimer);
    }, []);

    // Timer for tracking study duration
    useEffect(() => {
        const timer = setInterval(() => {
            setElapsedSeconds((prev) => prev + 1);
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (totalSeconds: number) => {
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSubmitSpeed = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const speedNum = parseInt(currentInput, 10);
        if (isNaN(speedNum) || speedNum <= 0) return;

        const newRecord: SpeedRecord = {
            id: Math.random().toString(36).substring(2, 9),
            speed: speedNum,
            // Format timestamp without seconds (e.g., "04:17 PM")
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setRecordedSpeeds([newRecord, ...recordedSpeeds]);
        setCurrentInput('');

        // Re-focus input immediately and keep virtual keyboard up
        requestAnimationFrame(() => {
            inputRef.current?.focus();
        });
    };

    // Export both View 1 (Metadata) and View 2 (Speeds) to a true Excel (.xlsx) file using xlsx-js-style
    const handleExportAndEnd = () => {
        const wsData: (string | number)[][] = [];
        // --- SECTION 1: Study Metadata (View 1) ---
        wsData.push(['Street Name', studyData.streetName || 'Unnamed']);
        wsData.push(['Observer', studyData.observer]);
        wsData.push(['Team', studyData.team]);
        wsData.push(['Speed Limit', studyData.speedLimit]);
        wsData.push(['Street Type', studyData.streetType]);
        wsData.push(['Direction', studyData.direction]);
        wsData.push(['Weather', studyData.weather]);
        wsData.push(['Start Time Slot', studyData.startTimeSlot]);
        wsData.push(['Total Vehicles Logged', recordedSpeeds.length]);
        wsData.push(['Elapsed Time', formatTime(elapsedSeconds)]);
        wsData.push([]); // Empty spacer row

        // --- SECTION 2: Logged Vehicle Speeds (View 2) ---
        wsData.push(['No.', 'Speed (MPH)', 'Timestamp']);

        recordedSpeeds.slice().reverse().forEach((rec, index) => {
            wsData.push([index + 1, rec.speed, rec.timestamp]);
        });

        // Create workbook and worksheet
        const worksheet = XLSX.utils.aoa_to_sheet(wsData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Speed Study Report');

        // Trigger native Excel file download (.xlsx) formatted as streetName_date
        const sanitizedStreet = (studyData.streetName || 'Unnamed_Street').replace(/[^a-zA-Z0-9_-]/g, '_');
        const currentDate = new Date().toISOString().split('T')[0];
        const fileName = `${sanitizedStreet}_${currentDate}.xlsx`;

        XLSX.writeFile(workbook, fileName);

        onEndStudy(recordedSpeeds);
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col justify-between pb-4">
            {/* Top Header */}
            <div>
                <header className="bg-white border-b border-gray-200 px-3 py-2.5 sticky top-0 z-30 shadow-sm">
                    <div className="max-w-md mx-auto flex items-center justify-between">
                        <h1 className="text-base font-bold text-gray-900 truncate">
                            {studyData.streetName || 'Unnamed Street'}
                        </h1>
                        <button
                            type="button"
                            onClick={handleExportAndEnd}
                            className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-bold transition"
                        >
                            Export Excel
                        </button>
                    </div>
                </header>

                {/* Live Counters Banner - Tighter Gaps */}
                <div className="max-w-md mx-auto px-3 pt-3 grid grid-cols-2 gap-2">
                    <div className="bg-white p-2.5 rounded-xl border border-gray-200 shadow-sm text-center">
                        <span className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Vehicles Logged</span>
                        <span className="text-xl font-extrabold text-blue-600">{recordedSpeeds.length}</span>
                        <span className="text-[10px] text-gray-400"> / 100</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-gray-200 shadow-sm text-center">
                        <span className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Elapsed Time</span>
                        <span className="text-xl font-extrabold text-gray-800">{formatTime(elapsedSeconds)}</span>
                    </div>
                </div>
            </div>

            {/* Main Input & Recent Logs Area */}
            <div className="max-w-md mx-auto w-full px-3 flex-1 flex flex-col justify-center my-2 space-y-2">

                {/* Recent Entries Ticker (Placed Above Numpad) */}
                <div className="bg-white rounded-xl border border-gray-200 p-2.5 shadow-sm">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Recent Logs</span>
                    <div className="flex gap-1.5 overflow-x-auto pb-0.5">
                        {recordedSpeeds.length === 0 ? (
                            <span className="text-xs text-gray-400 italic">No vehicles logged yet. Type speed below.</span>
                        ) : (
                            recordedSpeeds.slice(0, 5).map((rec) => (
                                <div key={rec.id} className="bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-lg flex-shrink-0 text-center">
                                    <span className="block text-xs font-bold text-blue-600">{rec.speed} MPH</span>
                                    <span className="text-[9px] text-gray-400">{rec.timestamp}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Native Mobile Input Form Box */}
                <form onSubmit={handleSubmitSpeed} className="bg-white border-2 border-blue-500 rounded-xl p-3 shadow-sm flex items-center gap-3">
                    <div className="flex-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Type Speed</span>
                        <div className="flex items-center">
                            <input
                                ref={inputRef}
                                type="number"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={currentInput}
                                onChange={(e) => {
                                    if (e.target.value.length <= 3) {
                                        setCurrentInput(e.target.value);
                                    }
                                }}
                                placeholder="-- "
                                className="w-full text-2xl font-extrabold text-gray-900 bg-transparent outline-none tracking-tight"
                            />
                            <span className="text-lg font-bold text-gray-400 ml-1 self-center">MPH</span>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            type="submit"
                            disabled={!currentInput}
                            className={`px-5 py-3 rounded-xl font-bold text-sm transition shadow-sm ${
                                currentInput
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white active:scale-95'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                            }`}
                        >
                            ENTER ✓
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
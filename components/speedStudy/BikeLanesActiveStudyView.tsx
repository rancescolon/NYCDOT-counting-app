import React, { useState, useEffect, useRef } from 'react';
import { SpeedStudyFormState, TransportMode, SpeedRecord } from '@/lib/types/types';
import ExcelJS from 'exceljs';
import { CustomDropdown } from '@/components/ui/CustomDropdown';
import { getAssetPath } from '@/lib/utils';
import { flushSync } from 'react-dom';
interface Props {
    studyData: SpeedStudyFormState;
    onEndStudy: (records: SpeedRecord[]) => void;
}

const TRANSPORT_MODES: TransportMode[] = [
    'CitiBike',
    'E-CitiBike',
    'Bike',
    'E-Bike',
    'Cargo Bike',
    'Scooter',
    'Moped',
    'Motorcycle',
    'Other',
];

export const BikeLanesActiveStudyView: React.FC<Props> = ({ studyData, onEndStudy }) => {
    const [selectedMode, setSelectedMode] = useState<TransportMode | null>(null);
    const [speedInput, setSpeedInput] = useState<string>('');
    const [isDeliveryWorker, setIsDeliveryWorker] = useState<boolean>(false);
    const [recordedLogs, setRecordedLogs] = useState<SpeedRecord[]>([]);
    const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
    const [studyStartTime, setStudyStartTime] = useState<string | null>(null);
    const [isFinished, setIsFinished] = useState<boolean>(false);

    // Edit modal state
    const [editingRecord, setEditingRecord] = useState<SpeedRecord | null>(null);
    const [editSpeedInput, setEditSpeedInput] = useState<string>('');
    const [editMode, setEditMode] = useState<TransportMode>('Bike');
    const [editIsDelivery, setEditIsDelivery] = useState<boolean>(false);

    const speedInputRef = useRef<HTMLInputElement>(null);


    useEffect(() => {
        if (recordedLogs.length === 0) return;
        const timer = setInterval(() => {
            setElapsedSeconds((prev) => {
                const nextTime = prev + 1;
                if (nextTime >= 3600) {
                    setIsFinished(true);
                }
                return nextTime;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [recordedLogs.length]);

    useEffect(() => {
        if (recordedLogs.length >= 100) {
            setIsFinished(true);
        }
    }, [recordedLogs.length]);

    const formatTime = (totalSeconds: number) => {
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleAddRecord = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const speedNum = parseInt(speedInput, 10);
        if (!selectedMode || isNaN(speedNum) || speedNum <= 0 || isFinished) return;

        const timestampStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        if (recordedLogs.length === 0) {
            setStudyStartTime(timestampStr);
        }

        const newRecord: SpeedRecord = {
            id: Math.random().toString(36).substring(2, 9),
            speed: speedNum,
            timestamp: timestampStr,
            transportMode: selectedMode,
            isDeliveryWorker: isDeliveryWorker,
        };

        setRecordedLogs([newRecord, ...recordedLogs]);

        // Reset speed and mode selection while keeping delivery worker default false
        setSpeedInput('');
        setSelectedMode(null);
        setIsDeliveryWorker(false);
    };

    const handleOpenEdit = (record: SpeedRecord) => {
        if (isFinished) return;
        setEditingRecord(record);
        setEditSpeedInput(record.speed.toString());
        setEditMode(record.transportMode || 'Bike');
        setEditIsDelivery(record.isDeliveryWorker || false);
    };

    const handleSaveEdit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!editingRecord) return;

        const updatedSpeed = parseInt(editSpeedInput, 10);
        if (isNaN(updatedSpeed) || updatedSpeed <= 0) return;

        setRecordedLogs((prev) =>
            prev.map((rec) =>
                rec.id === editingRecord.id
                    ? {
                        ...rec,
                        speed: updatedSpeed,
                        transportMode: editMode,
                        isDeliveryWorker: editIsDelivery,
                    }
                    : rec
            )
        );
        setEditingRecord(null);
    };

    const handleDeleteRecord = () => {
        if (!editingRecord) return;
        setRecordedLogs((prev) => prev.filter((rec) => rec.id !== editingRecord.id));
        setEditingRecord(null);
    };

    const handleExportAndEnd = async () => {
        const sanitizedStreet = (studyData.streetName || 'Unnamed_Street').replace(/[^a-zA-Z0-9_-]/g, '_');
        const now = new Date();
        const currentDateStr = now.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Micromobility Study');

        // 1. Calculate the total counts for each transport mode
        const modeTotals = TRANSPORT_MODES.map((mode) => {
            const count = recordedLogs.filter((rec) => rec.transportMode === mode).length;
            return [mode, count];
        });

        // 2. Format the header rows including the new summary section
        const headerRows: (string | number)[][] = [
            ['MICROMOBILITY DATA COLLECTION FORM'],
            ['Location:', studyData.streetName || 'Unnamed'],
            ['Cross Streets:', `${studyData.fromStreet || 'N/A'} to ${studyData.toStreet || 'N/A'}`],
            ['Observer:', studyData.observer || 'N/A'],
            ['Weather Condition:', studyData.weather || 'N/A'],
            ['Date / Time:', `${currentDateStr} | ${studyStartTime || studyData.startTimeSlot || 'N/A'}`],
            [],
            ['MODE TOTALS (SUMMARY)'],
            ...modeTotals, // Spreads the mode totals into the rows dynamically
            [],
            ['RAW DATA EXPORT'],
            ['Record ID', 'Transport Mode', 'Speed (MPH)', 'Delivery Worker', 'Timestamp'],
        ];

        headerRows.forEach((row) => sheet.addRow(row));

        // 3. Add the raw logged data
        recordedLogs.slice().reverse().forEach((rec, index) => {
            sheet.addRow([
                index + 1,
                rec.transportMode || 'N/A',
                rec.speed,
                rec.isDeliveryWorker ? 'Yes' : 'No',
                rec.timestamp,
            ]);
        });

        // 4. Calculate dynamic row indices for styling (since mode totals length can vary if you add modes)
        const rawDataTitleRowIndex = 8 + modeTotals.length + 2;
        const rawDataHeaderRowIndex = rawDataTitleRowIndex + 1;

        // 5. Apply bold and size styling to the headers
        sheet.getRow(1).font = { bold: true, size: 14 }; // Main Title
        sheet.getRow(8).font = { bold: true, size: 12 }; // Summary Title
        sheet.getRow(rawDataTitleRowIndex).font = { bold: true, size: 12 }; // Raw Data Title
        sheet.getRow(rawDataHeaderRowIndex).font = { bold: true }; // Raw Data Columns

        // 6. Format column widths for readability
        sheet.columns.forEach((col) => {
            let maxLen = 14;
            col.eachCell?.({ includeEmpty: true }, (cell) => {
                const val = cell.value ? String(cell.value) : '';
                if (val.length > maxLen) maxLen = val.length;
            });
            col.width = maxLen + 4;
        });

        // 7. Create and trigger the download
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${sanitizedStreet}_Micromobility_Form_${currentDateStr.replace(/\//g, '-')}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        onEndStudy(recordedLogs);
    };


    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col justify-between pb-4 pt-36">
            <div>
                <header className="bg-white border-b border-gray-200 px-3 py-2.5 fixed top-0 left-0 right-0 z-30 shadow-sm pt-24">
                    <div className="max-w-md mx-auto flex items-center justify-between">
                        <div>
                            <span className="text-[10px] font-bold tracking-wider text-blue-600 uppercase block">
                                Bike Lane Study
                            </span>
                            <h1 className="text-base font-bold text-gray-900 truncate">
                                {studyData.streetName || 'Unnamed Street'}
                            </h1>
                        </div>
                        <button
                            type="button"
                            onClick={handleExportAndEnd}
                            className="bg-red-600 text-white border border-red-200 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm"
                        >
                            Export Excel
                        </button>
                    </div>
                </header>

                <div className="max-w-md mx-auto px-3 pt-3 grid grid-cols-2 gap-2">
                    <div className="bg-white p-2.5 rounded-xl border border-gray-200 shadow-sm text-center">
                        <span className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                            Logged
                        </span>
                        <span className="text-xl font-extrabold text-blue-600">{recordedLogs.length}</span>
                        <span className="text-[10px] text-gray-400"> / 100</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-gray-200 shadow-sm text-center">
                        <span className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                            Elapsed Time
                        </span>
                        <span className="text-xl font-extrabold text-gray-800">{formatTime(elapsedSeconds)}</span>
                    </div>
                </div>
            </div>

            <div className="max-w-md mx-auto w-full px-3 flex-1 flex flex-col justify-center my-2 space-y-3">

                {/* Log List */}
                <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-2">
                        Recent Logs (Tap to edit)
                    </span>
                    <div className="flex gap-2 overflow-x-auto pb-1 touch-pan-x scrollbar-thin">
                        {recordedLogs.length === 0 ? (
                            <span className="text-xs text-gray-400 italic py-2">
                                Select a mode above and log speed.
                            </span>
                        ) : (
                            recordedLogs.map((rec) => (
                                <button
                                    key={rec.id}
                                    type="button"
                                    onClick={() => handleOpenEdit(rec)}
                                    className="bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 px-3 py-2 rounded-xl flex-shrink-0 text-left min-w-[100px] transition cursor-pointer"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-extrabold text-blue-600">{rec.speed} MPH</span>
                                        {rec.isDeliveryWorker && (
                                            <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1 rounded">
                                                DEL
                                            </span>
                                        )}
                                    </div>
                                    <span className="block text-[10px] font-bold text-gray-700 truncate">
                                        {rec.transportMode}
                                    </span>
                                    <span className="text-[9px] text-gray-400">{rec.timestamp}</span>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Speed Entry Prompt */}
                {selectedMode && (
                    <form
                        onSubmit={handleAddRecord}
                        className="bg-white border-2 border-blue-500 rounded-xl p-3 shadow-sm space-y-3"
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex-1 flex items-center">
                                <input
                                    ref={speedInputRef}
                                    type="number"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    enterKeyHint="done"
                                    value={speedInput}
                                    onChange={(e) => {
                                        if (e.target.value.length <= 3) {
                                            setSpeedInput(e.target.value);
                                        }
                                    }}
                                    placeholder="Speed"
                                    className="w-full text-2xl font-extrabold text-gray-900 bg-transparent outline-none tracking-tight"
                                />
                                <span className="text-lg font-bold text-gray-400 ml-1">MPH</span>
                            </div>

                            <button
                                type="submit"
                                disabled={!speedInput || isFinished}
                                className={`px-5 py-3 rounded-xl font-bold text-sm transition shadow-sm ${
                                    speedInput && !isFinished
                                        ? 'bg-blue-600 hover:bg-blue-700 text-white active:scale-95'
                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                                }`}
                            >
                                LOG ✓
                            </button>
                        </div>
                    </form>
                )}


                {/* 3x3 Grid Transport Mode Selection */}
                <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-2">
                        Transport Mode
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                        {TRANSPORT_MODES.map((mode) => {
                            const isSelected = selectedMode === mode;
                            return (
                                <button
                                    key={mode}
                                    type="button"
                                    onClick={() => {
                                        flushSync(() => {
                                            setSelectedMode(mode);
                                        });
                                        speedInputRef.current?.focus();
                                    }}
                                    className={`py-3 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center text-center ${
                                        isSelected
                                            ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-600 scale-[1.02]'
                                            : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                                    }`}
                                >
                                    {/* Image container */}
                                    <div className="w-full h-16 mb-1 flex items-center justify-center overflow-hidden bg-transparent">
                                        <img
                                            src={getAssetPath(`/transport/${mode.toLowerCase().replace(/ /g, '-')}.png`)}
                                            alt={mode}
                                            className={`w-full h-full object-contain ${
                                                mode === 'E-CitiBike' ? 'scale-125' : 'scale-110'
                                            }`}
                                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                        />
                                    </div>
                                    {mode}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {editingRecord && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <form
                        onSubmit={handleSaveEdit}
                        className="bg-white rounded-2xl shadow-xl border border-gray-200 p-5 max-w-sm w-full space-y-4"
                    >
                        <h3 className="text-lg font-bold text-gray-900">Edit Bike Lane Log</h3>

                        <div>
                            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                                Transport Mode
                            </label>
                            <CustomDropdown
                                value={editMode}
                                options={TRANSPORT_MODES}
                                onChange={(val) => setEditMode(val as TransportMode)}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                                Speed in MPH
                            </label>
                            <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                autoFocus
                                value={editSpeedInput}
                                onChange={(e) => {
                                    if (e.target.value.length <= 3) {
                                        setEditSpeedInput(e.target.value);
                                    }
                                }}
                                className="w-full text-2xl font-extrabold text-gray-900 border border-gray-300 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                            <span className="text-base font-bold text-gray-700">Delivery Worker?</span>
                            <button
                                type="button"
                                onClick={() => setEditIsDelivery(!editIsDelivery)}
                                className={`px-3 py-1.5 rounded-lg text-s font-bold ${
                                    editIsDelivery ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                                }`}
                            >
                                {editIsDelivery ? 'YES' : 'NO'}
                            </button>
                        </div>

                        <div className="flex flex-col gap-2 pt-2">
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setEditingRecord(null)}
                                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 px-4 rounded-xl text-sm transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition shadow-sm"
                                >
                                    Save
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={handleDeleteRecord}
                                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition"
                            >
                                Delete Log
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Finish Popup */}
            {isFinished && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 max-w-sm w-full text-center space-y-4">
                        <h3 className="text-xl font-bold text-gray-900">Study Finished!</h3>
                        <p className="text-sm text-gray-600">
                            {recordedLogs.length >= 100
                                ? 'You have successfully logged 100 entries.'
                                : 'The study time limit has been reached.'}
                        </p>

                        <div className="pt-2">
                            <button
                                type="button"
                                onClick={handleExportAndEnd}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition shadow-sm text-sm"
                            >
                                Export Excel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
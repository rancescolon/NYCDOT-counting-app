import React, { useState, useEffect, useRef } from 'react';
import { SpeedStudyFormState } from '@/lib/types/types';
import ExcelJS from 'exceljs';

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
    const [studyStartTime, setStudyStartTime] = useState<string | null>(null);
    const [isFinished, setIsFinished] = useState<boolean>(false);

    // Edit modal states
    const [editingRecord, setEditingRecord] = useState<SpeedRecord | null>(null);
    const [editInputValue, setEditInputValue] = useState<string>('');

    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const focusTimer = setTimeout(() => {
            inputRef.current?.focus();
        }, 100);
        return () => clearTimeout(focusTimer);
    }, []);

    useEffect(() => {
        if (recordedSpeeds.length === 0) return;
        const timer = setInterval(() => {
            setElapsedSeconds((prev) => {
                const nextTime = prev + 1;
                if (nextTime >= 3600) {
                    setIsFinished(true);
                }
                return nextTime;
            });
        }, 1000);
        return () => clearTimeout(timer);
    }, [recordedSpeeds.length]);

    useEffect(() => {
        if (recordedSpeeds.length >= 100) {
            setIsFinished(true);
        }
    }, [recordedSpeeds.length]);

    const formatTime = (totalSeconds: number) => {
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSubmitSpeed = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const speedNum = parseInt(currentInput, 10);
        if (isNaN(speedNum) || speedNum <= 0 || isFinished) return;

        const timestampStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        if (recordedSpeeds.length === 0) {
            setStudyStartTime(timestampStr);
        }

        const newRecord: SpeedRecord = {
            id: Math.random().toString(36).substring(2, 9),
            speed: speedNum,
            timestamp: timestampStr,
        };

        setRecordedSpeeds([newRecord, ...recordedSpeeds]);
        setCurrentInput('');

        requestAnimationFrame(() => {
            inputRef.current?.focus();
        });
    };

    // Undo last recorded entry
    const handleUndo = () => {
        if (recordedSpeeds.length === 0 || isFinished) return;
        setRecordedSpeeds((prev) => prev.slice(1));
    };

    // Open Edit Modal
    const handleOpenEdit = (record: SpeedRecord) => {
        if (isFinished) return;
        setEditingRecord(record);
        setEditInputValue(record.speed.toString());
    };

    // Save Edited Entry
    const handleSaveEdit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!editingRecord) return;

        const updatedSpeed = parseInt(editInputValue, 10);
        if (isNaN(updatedSpeed) || updatedSpeed <= 0) return;

        setRecordedSpeeds((prev) =>
            prev.map((rec) => (rec.id === editingRecord.id ? { ...rec, speed: updatedSpeed } : rec))
        );
        setEditingRecord(null);
    };

    const getPercentile = (sortedSpeeds: number[], percentile: number) => {
        if (sortedSpeeds.length === 0) return 0;
        const index = Math.ceil((percentile / 100) * sortedSpeeds.length) - 1;
        return sortedSpeeds[Math.max(0, index)];
    };

    const calculate10MphPace = (speeds: number[]) => {
        if (speeds.length === 0) return { range: '0.0 - 0.0', percent: 0, belowPct: 0, abovePct: 0 };
        let maxCount = 0;
        let paceStart = 10;

        for (let start = 10; start <= 80; start++) {
            const count = speeds.filter((s) => s >= start && s <= start + 10).length;
            if (count > maxCount) {
                maxCount = count;
                paceStart = start;
            }
        }
        const paceEnd = paceStart + 10;
        const percent = ((maxCount / speeds.length) * 100);
        const belowCount = speeds.filter((s) => s < paceStart).length;
        const aboveCount = speeds.filter((s) => s > paceEnd).length;

        return {
            range: `${paceStart}.0 - ${paceEnd}.0`,
            percent: parseFloat(percent.toFixed(1)),
            belowPct: parseFloat(((belowCount / speeds.length) * 100).toFixed(1)),
            abovePct: parseFloat(((aboveCount / speeds.length) * 100).toFixed(1)),
        };
    };

    const calculateStdDev = (speeds: number[], mean: number) => {
        if (speeds.length === 0) return 0;
        const variance = speeds.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / speeds.length;
        return Math.sqrt(variance);
    };

    const generate2DChartBase64 = (rawSpeeds: number[], speedLimit: number): string => {
        const canvas = document.createElement('canvas');
        canvas.width = 750;
        canvas.height = 380;
        const ctx = canvas.getContext('2d');
        if (!ctx) return '';

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#111827';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('SPEED DISTRIBUTION CHART', canvas.width / 2, 28);

        const minSp = Math.max(10, Math.min(...(rawSpeeds.length ? rawSpeeds : [20])) - 2);
        const maxSp = Math.min(65, Math.max(...(rawSpeeds.length ? rawSpeeds : [30])) + 2);

        const speedsRange: number[] = [];
        for (let s = minSp; s <= maxSp; s++) speedsRange.push(s);

        const countsBelow = speedsRange.map((s) => rawSpeeds.filter((v) => v === s && v <= speedLimit).length);
        const countsAbove = speedsRange.map((s) => rawSpeeds.filter((v) => v === s && v > speedLimit).length);
        const maxCount = Math.max(1, ...countsBelow, ...countsAbove);

        const paddingLeft = 50;
        const paddingRight = 30;
        const paddingTop = 50;
        const paddingBottom = 60;
        const chartWidth = canvas.width - paddingLeft - paddingRight;
        const chartHeight = canvas.height - paddingTop - paddingBottom;

        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        ctx.fillStyle = '#6b7280';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'right';

        const gridSteps = 4;
        for (let i = 0; i <= gridSteps; i++) {
            const val = Math.round((maxCount / gridSteps) * i);
            const y = paddingTop + chartHeight - (i / gridSteps) * chartHeight;
            ctx.beginPath();
            ctx.moveTo(paddingLeft, y);
            ctx.lineTo(paddingLeft + chartWidth, y);
            ctx.stroke();
            ctx.fillText(String(val), paddingLeft - 8, y + 4);
        }

        const groupWidth = chartWidth / speedsRange.length;
        const barWidth = Math.max(3, (groupWidth - 4) / 2);

        speedsRange.forEach((speed, idx) => {
            const xGroup = paddingLeft + idx * groupWidth;
            const bCount = countsBelow[idx];
            const aCount = countsAbove[idx];

            if (bCount > 0) {
                const hBelow = (bCount / maxCount) * chartHeight;
                ctx.fillStyle = '#22c55e';
                ctx.fillRect(xGroup + 1, paddingTop + chartHeight - hBelow, barWidth, hBelow);
            }

            if (aCount > 0) {
                const hAbove = (aCount / maxCount) * chartHeight;
                ctx.fillStyle = '#ef4444';
                ctx.fillRect(xGroup + 1 + barWidth, paddingTop + chartHeight - hAbove, barWidth, hAbove);
            }

            const stepX = speedsRange.length > 25 ? 5 : speedsRange.length > 15 ? 2 : 1;
            if (speed % stepX === 0 || idx === 0 || idx === speedsRange.length - 1) {
                ctx.fillStyle = '#4b5563';
                ctx.textAlign = 'center';
                ctx.font = '10px sans-serif';
                ctx.fillText(String(speed), xGroup + groupWidth / 2, paddingTop + chartHeight + 18);
            }
        });

        const legendY = canvas.height - 18;
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(canvas.width / 2 - 110, legendY - 10, 12, 12);
        ctx.fillStyle = '#374151';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('Below Limit', canvas.width / 2 - 92, legendY);

        ctx.fillStyle = '#ef4444';
        ctx.fillRect(canvas.width / 2 + 20, legendY - 10, 12, 12);
        ctx.fillStyle = '#374151';
        ctx.fillText('Above Limit', canvas.width / 2 + 38, legendY);

        return canvas.toDataURL('image/png');
    };

    const handleExportAndEnd = async () => {
        const sanitizedStreet = (studyData.streetName || 'Unnamed_Street').replace(/[^a-zA-Z0-9_-]/g, '_');
        const now = new Date();
        const currentDateStr = now.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });
        const dayOfWeekStr = now.toLocaleDateString('en-US', { weekday: 'short' }) + '.';
        const rawSpeeds = recordedSpeeds.map((r) => r.speed);
        const sortedSpeeds = [...rawSpeeds].sort((a, b) => a - b);
        const totalCount = recordedSpeeds.length;

        const meanSpeedVal = totalCount > 0 ? rawSpeeds.reduce((a, b) => a + b, 0) / totalCount : 0;
        const avgSpeed = meanSpeedVal.toFixed(1);
        const p15Speed = getPercentile(sortedSpeeds, 15).toFixed(1);
        const medianSpeed = getPercentile(sortedSpeeds, 50).toFixed(1);
        const p85Speed = getPercentile(sortedSpeeds, 85).toFixed(1);
        const minSpeed = totalCount > 0 ? Math.min(...rawSpeeds).toFixed(1) : '0.0';
        const maxSpeed = totalCount > 0 ? Math.max(...rawSpeeds).toFixed(1) : '0.0';
        const speedLimitVal = studyData.speedLimit || 25;

        const overLimitCount = rawSpeeds.filter((s) => s > speedLimitVal).length;
        const overLimitPercent = totalCount > 0 ? ((overLimitCount / totalCount) * 100).toFixed(1) : '0.0';

        const paceInfo = calculate10MphPace(rawSpeeds);
        const stdDev = calculateStdDev(rawSpeeds, meanSpeedVal).toFixed(1);

        const workbook = new ExcelJS.Workbook();

        const sheet1 = workbook.addWorksheet('Full Form Data');
        const wsData1: (string | number)[][] = [
            ['SPEED STUDY COMPLETE FORM METADATA'],
            ['Street Name', studyData.streetName || 'Unnamed'],
            ['From Street', studyData.fromStreet || 'N/A'],
            ['To Street', studyData.toStreet || 'N/A'],
            ['Borough', studyData.borough || 'N/A'],
            ['Observer', studyData.observer || 'N/A'],
            ['Team', studyData.team || 'N/A'],
            ['Posted Speed Limit', `${speedLimitVal} MPH`],
            ['Street Type', studyData.streetType || 'N/A'],
            ['Direction', studyData.direction || 'N/A'],
            ['Moving Lanes', studyData.movingLanes || 'N/A'],
            ['Parking Lanes', studyData.parkingLanes || 'N/A'],
            ['Truck Route', studyData.isTruckRoute ? 'Yes' : 'No'],
            ['Bus Route', studyData.isBusRoute ? `Yes (${studyData.busLine || 'N/A'})` : 'No'],
            ['Weather Condition', studyData.weather || 'N/A'],
            ['Start Time', studyStartTime || studyData.startTimeSlot || 'N/A'],
            ['Total Vehicles Logged', totalCount],
            ['Elapsed Duration', formatTime(elapsedSeconds)],
            ['Notes', studyData.notes || 'None'],
            [],
            ['DETAILED VEHICLE SPEED LOGS'],
            ['Record No.', 'Speed (MPH)', 'Timestamp'],
        ];

        recordedSpeeds.slice().reverse().forEach((rec, index) => {
            wsData1.push([index + 1, rec.speed, rec.timestamp]);
        });

        wsData1.forEach((row) => sheet1.addRow(row));

        sheet1.getRow(1).font = { bold: true, size: 12 };
        sheet1.getRow(21).font = { bold: true, size: 12 };
        sheet1.getRow(22).font = { bold: true };

        sheet1.columns.forEach((column) => {
            let maxLen = 12;
            column.eachCell?.({ includeEmpty: true }, (cell) => {
                const val = cell.value != null ? String(cell.value) : '';
                if (val.length > maxLen) {
                    maxLen = val.length;
                }
            });
            column.width = maxLen + 4;
        });

        const sheet2 = workbook.addWorksheet('Radar Study Report');
        const titleCell = sheet2.getCell('C2');
        titleCell.value = 'RADAR SPEED SURVEY';
        titleCell.font = { bold: true, size: 16 };

        const streetCell = sheet2.getCell('B4');
        streetCell.value = studyData.streetName || 'Unnamed Street';
        streetCell.font = { bold: true };

        sheet2.getCell('D4').value = `From: ${studyData.fromStreet || 'N/A'}`;
        sheet2.getCell('F4').value = `To: ${studyData.toStreet || 'N/A'}`;

        const thinBorder: Partial<ExcelJS.Borders> = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
        };

        const gridRows = [
            { row: 6, leftLabel: 'Boro:', leftVal: studyData.borough, rightLabel: 'Average Speed:', rightVal: avgSpeed, rightUnit: 'mph' },
            { row: 7, leftLabel: 'Date:', leftVal: currentDateStr, rightLabel: '', rightVal: '', rightUnit: '' },
            { row: 8, leftLabel: 'Day:', leftVal: dayOfWeekStr, rightLabel: '15th Percentile:', rightVal: p15Speed, rightUnit: 'mph' },
            { row: 9, leftLabel: 'Weather:', leftVal: studyData.weather, rightLabel: '50th Percentile:', rightVal: medianSpeed, rightUnit: 'mph' },
            { row: 10, leftLabel: 'Time:', leftVal: studyStartTime || '10.00 am', rightLabel: '85th Percentile:', rightVal: p85Speed, rightUnit: 'mph' },
            { row: 11, leftLabel: 'Speed Limit:', leftVal: speedLimitVal, leftUnit: 'mph', rightLabel: 'Above Speed Limit:', rightVal: `${overLimitPercent} %`, rightUnit: '' },
            { row: 12, leftLabel: 'Sample Size:', leftVal: totalCount, rightLabel: 'Minimum Speed:', rightVal: minSpeed, rightUnit: 'mph' },
            { row: 13, leftLabel: '', leftVal: '', rightLabel: 'Maximum Speed:', rightVal: maxSpeed, rightUnit: 'mph' },
            { row: 14, leftLabel: 'Type of Roadway:', leftVal: studyData.streetType || '2-way', rightLabel: 'Pace:', rightVal: paceInfo.range, rightUnit: 'mph' },
            { row: 15, leftLabel: 'Width of Road by Direction:', leftVal: '', rightLabel: 'In Pace:', rightVal: `${paceInfo.percent} %`, rightUnit: '' },
            { row: 16, leftLabel: 'Number of Moving Lanes:', leftVal: studyData.movingLanes, rightLabel: 'Below Pace:', rightVal: `${paceInfo.belowPct} %`, rightUnit: '' },
            { row: 17, leftLabel: 'Number of Parking Lanes:', leftVal: studyData.parkingLanes, rightLabel: 'Above Pace:', rightVal: `${paceInfo.abovePct} %`, rightUnit: '' },
            { row: 18, leftLabel: 'Observer:', leftVal: studyData.observer || 'TW', rightLabel: 'Standard Deviation:', rightVal: stdDev, rightUnit: 'mph' },
        ];

        gridRows.forEach(({ row, leftLabel, leftVal, leftUnit, rightLabel, rightVal, rightUnit }) => {
            const cB = sheet2.getCell(`B${row}`);
            cB.value = leftLabel;
            cB.font = { size: 10 };
            cB.border = thinBorder;

            const cC = sheet2.getCell(`C${row}`);
            cC.value = leftVal;
            cC.alignment = { horizontal: 'right' };
            cC.border = thinBorder;

            const cD = sheet2.getCell(`D${row}`);
            cD.value = leftUnit || '';
            cD.border = thinBorder;

            const cE = sheet2.getCell(`E${row}`);
            cE.value = rightLabel;
            cE.font = { size: 10 };
            cE.border = thinBorder;

            const cF = sheet2.getCell(`F${row}`);
            cF.value = rightVal;
            cF.alignment = { horizontal: 'right' };
            cF.border = thinBorder;

            const cG = sheet2.getCell(`G${row}`);
            cG.value = rightUnit || '';
            cG.border = thinBorder;
        });

        const chartBase64 = generate2DChartBase64(rawSpeeds, speedLimitVal);
        if (chartBase64) {
            const chartImageId = workbook.addImage({
                base64: chartBase64,
                extension: 'png',
            });

            sheet2.addImage(chartImageId, 'B21:G38');
        }

        sheet2.getColumn(1).width = 3;
        sheet2.getColumn(2).width = 28;
        sheet2.getColumn(3).width = 14;
        sheet2.getColumn(4).width = 8;
        sheet2.getColumn(5).width = 24;
        sheet2.getColumn(6).width = 14;
        sheet2.getColumn(7).width = 8;

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${sanitizedStreet}_Speed_Study_${currentDateStr.replace(/\//g, '-')}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        onEndStudy(recordedSpeeds);
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col justify-between pb-4 pt-36">
            <div>
                <header className="bg-white border-b border-gray-200 px-3 py-2.5 fixed top-0 left-0 right-0 z-30 shadow-sm pt-24">
                    <div className="max-w-md mx-auto flex items-center justify-between">
                        <h1 className="text-base font-bold text-gray-900 truncate">
                            {studyData.streetName || 'Unnamed Street'}
                        </h1>
                        <button
                            type="button"
                            onClick={handleExportAndEnd}
                            className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm"
                        >
                            Export Excel
                        </button>
                    </div>
                </header>

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

            <div className="max-w-md mx-auto w-full px-3 flex-1 flex flex-col justify-center my-2 space-y-3">
                <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                            Recent Logs (Tap to edit)
                        </span>
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-1 touch-pan-x scrollbar-thin">
                        {recordedSpeeds.length === 0 ? (
                            <span className="text-xs text-gray-400 italic py-2">No vehicles logged yet. Type speed below.</span>
                        ) : (
                            recordedSpeeds.map((rec) => (
                                <button
                                    key={rec.id}
                                    type="button"
                                    onClick={() => handleOpenEdit(rec)}
                                    className="bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 px-3.5 py-2 rounded-xl flex-shrink-0 text-center min-w-[75px] transition cursor-pointer"
                                >
                                    <span className="block text-sm font-extrabold text-blue-600">{rec.speed} MPH</span>
                                    <span className="text-[10px] text-gray-500">{rec.timestamp}</span>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                <form onSubmit={handleSubmitSpeed} className="bg-white border-2 border-blue-500 rounded-xl p-3 shadow-sm flex items-center gap-3">
                    <div className="flex-1">
                        <div className="flex items-center">
                            <input
                                ref={inputRef}
                                type="number"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                enterKeyHint="done"
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
                            disabled={!currentInput || isFinished}
                            onMouseDown={(e) => e.preventDefault()}
                            className={`px-5 py-3 rounded-xl font-bold text-sm transition shadow-sm ${
                                currentInput && !isFinished
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white active:scale-95'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                            }`}
                        >
                            ENTER ✓
                        </button>

                        <button
                            type="button"
                            onClick={handleUndo}
                            disabled={recordedSpeeds.length === 0 || isFinished}
                            className={`px-3 py-3 rounded-xl font-bold text-xs transition shadow-sm ${
                                recordedSpeeds.length > 0 && !isFinished
                                    ? 'bg-amber-100 hover:bg-amber-200 text-amber-700 active:scale-95'
                                    : 'bg-gray-100 text-gray-300 cursor-not-allowed shadow-none'
                            }`}
                        >
                            UNDO
                        </button>
                    </div>
                </form>
            </div>

            {/* EDIT ENTRY POPUP MODAL */}
            {editingRecord && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <form
                        onSubmit={handleSaveEdit}
                        className="bg-white rounded-2xl shadow-xl border border-gray-200 p-5 max-w-sm w-full space-y-4"
                    >
                        <h3 className="text-lg font-bold text-gray-900">Edit Speed Log</h3>
                        <p className="text-xs text-gray-500">Recorded at: {editingRecord.timestamp}</p>

                        <div>
                            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                                Speed (MPH)
                            </label>
                            <input
                                type="number"
                                autoFocus
                                value={editInputValue}
                                onChange={(e) => setEditInputValue(e.target.value)}
                                className="w-full text-2xl font-extrabold text-gray-900 border border-gray-300 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="flex gap-2 pt-2">
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
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {isFinished && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 max-w-sm w-full text-center space-y-4">
                        <h3 className="text-xl font-bold text-gray-900">Study Finished!</h3>
                        <p className="text-sm text-gray-600">
                            {recordedSpeeds.length >= 100
                                ? "You have successfully logged 100 vehicles."
                                : "The study time limit (1 or 2 hours) has been reached."}
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
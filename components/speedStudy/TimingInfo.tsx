// components/speed-study/TimingInfo.tsx

import React from 'react';
import { SpeedStudyFormState } from '@/lib/types';

interface Props {
    data: SpeedStudyFormState;
    onChange: (updates: Partial<SpeedStudyFormState>) => void;
}

const TIME_SLOTS = ['10:00 AM', '02:00 PM'];

export const TimingInfo: React.FC<Props> = ({ data, onChange }) => {
    // Compute calculated end time based on street type (+2 hours for One Way, +1 hour for Two Way)
    const calculateEndTime = () => {
        const [time, modifier] = data.startTimeSlot.split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        if (modifier === 'PM' && hours < 12) hours += 12;
        if (modifier === 'AM' && hours === 12) hours = 0;

        const durationHours = data.streetType === 'One Way' ? 2 : 1;
        hours = (hours + durationHours) % 24;

        const newModifier = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 === 0 ? 12 : hours % 12;
        const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;

        return `${displayHours}:${formattedMinutes} ${newModifier}`;
    };

    const currentDateStr = new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-2 h-6 bg-blue-600 rounded-full"></span>
                Timing & Schedule
            </h2>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <div className="text-base font-semibold px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-800">
                        {currentDateStr}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time Slot (Team Dependent)</label>
                    <select
                        value={data.startTimeSlot}
                        onChange={(e) => onChange({ startTimeSlot: e.target.value })}
                        className="w-full text-base px-4 py-3 rounded-xl border border-gray-300 bg-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none font-semibold text-blue-600"
                    >
                        {TIME_SLOTS.map((slot) => (
                            <option key={slot} value={slot}>{slot}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="block text-sm font-medium text-gray-700">Estimated End Time</label>
                        <span className="text-xs text-gray-500 font-medium">Auto-calculated</span>
                    </div>
                    <div className="text-base font-semibold px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-800 flex justify-between items-center">
                        <span>{calculateEndTime()}</span>
                        <span className="text-xs font-normal text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
              {data.streetType === 'One Way' ? '2 Hours Duration' : '1 Hour Duration'} (or 100 vehicles)
            </span>
                    </div>
                </div>
            </div>
        </div>
    );
};
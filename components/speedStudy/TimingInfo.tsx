// components/speed-study/TimingInfo.tsx

import React, { useEffect } from 'react';
import { SpeedStudyFormState, Team } from '@/lib/types/types';
import Image from "next/image";

interface Props {
    data: SpeedStudyFormState;
    onChange: (updates: Partial<SpeedStudyFormState>) => void;
    onValidationChange?: (isValid: boolean) => void;
}

interface TeamRule {
    isAllowed: (date: Date) => boolean;
    description: string;
}

const TEAM_RULES: Record<Team, TeamRule> = {
    'School Safety': {
        isAllowed: (date: Date) => {
            const hours = date.getHours();
            const minutes = date.getMinutes();
            const totalMinutes = hours * 60 + minutes;
            return totalMinutes >= 0 && totalMinutes <= 1400; // 10:00 AM (600 mins) and 2:00 PM (840 mins)
        },
        description: 'School Safety Study hours are 10:00 AM - 2:00 PM.',
    },
    'Vision Zero': {
        isAllowed: () => true,
        description: 'Allowed anytime.',  // Add specific rules here later if needed
    },
    'Research': {
        isAllowed: () => true,
        description: 'Allowed anytime.',
    },
    'Engineering': {
        isAllowed: () => true,
        description: 'Allowed anytime.',
    },
};

export const TimingInfo: React.FC<Props> = ({ data, onChange, onValidationChange }) => {
    useEffect(() => {
        const updateStartTime = () => {
            const now = new Date();
            const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            onChange({ startTimeSlot: timeString });
        };
        updateStartTime();
        const interval = setInterval(updateStartTime, 1000);
        return () => clearInterval(interval);
    }, [onChange]);

    const now = new Date();
    const rule = TEAM_RULES[data.team] || { isAllowed: () => true, description: '' };
    const isTimeValid = rule.isAllowed(now);

    useEffect(() => {
        if (onValidationChange) {
            onValidationChange(isTimeValid);
        }
    }, [isTimeValid, data.team, onValidationChange]);

    const calculateEndTime = () => {
        if (!data.startTimeSlot) return '--';

        const [time, modifier] = data.startTimeSlot.split(' ');
        if (!time) return '--';

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

    const currentDateStr = now.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });

    const currentTimeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'});

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                Timing
            </h2>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <div className="text-base font-semibold px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-800">
                        {currentDateStr}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Time</label>
                    <div className="text-base font-semibold px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-800 flex justify-between items-center">
                        {currentTimeStr}
                    </div>
                </div>

                {!isTimeValid && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                        <div className="relative w-16 h-16 flex-shrink-0 mt-0.5">
                            <Image
                                src="/caution.png"
                                alt="Caution"
                                fill
                                className="object-contain"
                            />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-red-800">Outside Allowed Study Window</p>
                            <p className="text-s text-red-700 mt-0.5">{rule.description}</p>
                        </div>
                    </div>
                )}

                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="">Estimated End Time</label>
                    </div>
                    <div className="text-base font-semibold px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-800 flex justify-between items-center">
                        <span>{calculateEndTime()}</span>
                        <span className="block text-sm font-medium text-gray-700">(Or 100 vehicles)</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
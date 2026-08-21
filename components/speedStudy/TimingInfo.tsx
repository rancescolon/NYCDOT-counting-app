import React, { useEffect } from 'react';
import { SpeedStudyFormState } from '@/lib/types/types';
import Image from "next/image";
import { TEAM_RULES, isTimeAllowed, isDayAllowed } from '@/lib/config/speed-study.config';

interface Props {
    data: SpeedStudyFormState;
    onChange: (updates: Partial<SpeedStudyFormState>) => void;
    onValidationChange?: (isValid: boolean) => void;
}

export const TimingInfo: React.FC<Props> = ({ data, onChange, onValidationChange }) => {
    const rule = TEAM_RULES[data.team];
    const now = new Date();

    const isTimeValid = isTimeAllowed(data.team, now);
    const isDayValid = isDayAllowed(data.team, now);
    const isValid = isTimeValid && isDayValid;

    useEffect(() => {
        if (onValidationChange) {
            onValidationChange(isValid);
        }
    }, [isValid, onValidationChange]);

    const calculateEndTime = () => {
        const endTime = new Date(now.getTime() + 60 * 60 * 1000);
        return endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                Timing Information
            </h2>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Study Start Time</label>
                    <div className="text-base font-semibold px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-800">
                        {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>

                {/* Caution for disallowed time window */}
                {!isTimeValid && rule?.timeDescription && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                        <div className="relative w-10 h-10 flex-shrink-0 mt-0.5">
                            <Image
                                src="/caution-icon.png"
                                alt="Caution"
                                fill
                                className="object-contain"
                            />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-red-800">Outside Allowed Study Window</p>
                            <p className="text-xs text-red-700 mt-0.5">{rule.timeDescription}</p>
                        </div>
                    </div>
                )}

                {/* Caution for disallowed day of week */}
                {!isDayValid && rule?.daysDescription && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                        <div className="relative w-10 h-10 flex-shrink-0 mt-0.5">
                            <Image
                                src="/caution.png"
                                alt="Caution"
                                fill
                                className="object-contain"
                            />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-red-800">Restricted Day of Week</p>
                            <p className="text-xs text-red-700 mt-0.5">{rule.daysDescription}</p>
                        </div>
                    </div>
                )}

                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="block text-sm font-medium text-gray-700">Estimated End Time</label>
                    </div>
                    <div className="text-base font-semibold px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-800 flex justify-between items-center">
                        <span>{calculateEndTime()}</span>
                        <span className="block text-xs font-medium text-gray-500">(Or 100 vehicles)</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
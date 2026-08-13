// components/speed-study/StudyInfo.tsx

import React, { useEffect } from 'react';
import { Direction, SpeedStudyFormState, StreetType, Team } from '@/lib/types/types';
import { CustomDropdown } from '@/components/ui/CustomDropdown';
import { TEAMS, OBSERVERS_BY_TEAM } from '@/lib/config/speed-study.config';

interface Props {
    data: SpeedStudyFormState;
    onChange: (updates: Partial<SpeedStudyFormState>) => void;
}

const DIRECTIONS: Direction[] = ['Northbound', 'Southbound', 'Eastbound', 'Westbound'];
const SPEED_LIMITS = [15, 20, 25, 30, 35, 40, 45];

export const StudyInfo: React.FC<Props> = ({ data, onChange }) => {
    // Dynamically retrieve observers for selected team
    const availableObservers = OBSERVERS_BY_TEAM[data.team] || OBSERVERS_BY_TEAM[TEAMS[0]] || [];

    // Ensure selected observer belongs to current team
    useEffect(() => {
        if (!availableObservers.includes(data.observer)) {
            if (availableObservers.length > 0) {
                onChange({ observer: availableObservers[0] });
            }
        }
    }, [data.team, data.observer, availableObservers, onChange]);

    const handleTeamChange = (newTeam: string) => {
        const teamObservers = OBSERVERS_BY_TEAM[newTeam] || [];
        const newObserver = teamObservers.includes(data.observer)
            ? data.observer
            : (teamObservers[0] || '');

        onChange({
            team: newTeam as Team,
            observer: newObserver
        });
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                Study Information
            </h2>

            <div className="space-y-4">
                {/* Team Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Team</label>
                    <CustomDropdown
                        value={data.team}
                        options={TEAMS}
                        onChange={(val) => handleTeamChange(val)}
                    />
                </div>

                {/* Per-Team Observer Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Observer</label>
                    <CustomDropdown
                        value={data.observer}
                        options={availableObservers}
                        onChange={(val) => onChange({ observer: val })}
                    />
                </div>

                {/* Posted Speed Limit */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Posted Speed Limit (MPH)</label>
                    <div className="flex flex-wrap gap-2">
                        {SPEED_LIMITS.map((limit) => (
                            <button
                                key={limit}
                                type="button"
                                onClick={() => onChange({ speedLimit: limit })}
                                className={`py-2 px-3.5 text-sm font-semibold rounded-xl border transition-all ${
                                    data.speedLimit === limit
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                                }`}
                            >
                                {limit}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Street Type */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Street Type</label>
                    <div className="grid grid-cols-2 gap-3">
                        {(['One Way', 'Two Way'] as StreetType[]).map((type) => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => onChange({ streetType: type })}
                                className={`py-3 px-4 text-base font-semibold rounded-xl border transition-all ${
                                    data.streetType === type
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                                }`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Direction */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Direction</label>
                    <CustomDropdown
                        value={data.direction}
                        options={DIRECTIONS}
                        onChange={(val) => onChange({ direction: val as Direction })}
                    />
                </div>
            </div>
        </div>
    );
};
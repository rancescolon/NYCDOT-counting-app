// components/speed-study/StudyInfo.tsx
// Change this file if add more ppl and/or other teams aswell as TEAM_RULES in TimingInfo.tsx

import React from 'react';
import { Direction, SpeedStudyFormState, StreetType, Team } from '@/lib/types';
import { CustomDropdown } from '@/components/ui/CustomDropdown';

interface Props {
    data: SpeedStudyFormState;
    onChange: (updates: Partial<SpeedStudyFormState>) => void;
}

// Easily add more teams or observers here as needed
const TEAMS: Team[] = ['School Safety', 'Vision Zero', 'Research', 'Engineering'];
const OBSERVERS = ['R. Colon', 'F. Castro','N, Carey']; // Add more ppl here
const DIRECTIONS: Direction[] = ['Northbound', 'Southbound', 'Eastbound', 'Westbound'];
const SPEED_LIMITS = [15, 20, 25, 30, 35, 40, 45];

export const StudyInfo: React.FC<Props> = ({ data, onChange }) => {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">

                Study Information
            </h2>

            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Observer</label>
                        <CustomDropdown
                            value={data.observer}
                            options={OBSERVERS}
                            onChange={(val) => onChange({ observer: val })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Team</label>
                        <CustomDropdown
                            value={data.team}
                            options={TEAMS}
                            onChange={(val) => onChange({ team: val as Team })}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Speed Limit</label>
                    <CustomDropdown
                        value={data.speedLimit}
                        options={SPEED_LIMITS}
                        suffix="MPH"
                        onChange={(val) => onChange({ speedLimit: Number(val) })}
                    />
                </div>

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
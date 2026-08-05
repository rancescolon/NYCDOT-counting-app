// components/speed-study/StudyInfo.tsx

import React from 'react';
import { Direction, SpeedStudyFormState, StreetType, Team } from '@/lib/types';

interface Props {
    data: SpeedStudyFormState;
    onChange: (updates: Partial<SpeedStudyFormState>) => void;
}

const TEAMS: Team[] = ['School Safety', 'Vision Zero', 'Research', 'Engineering'];
const DIRECTIONS: Direction[] = ['Northbound', 'Southbound', 'Eastbound', 'Westbound'];
const SPEED_LIMITS = [15, 20, 25, 30, 35, 40, 45];

export const StudyInfo: React.FC<Props> = ({ data, onChange }) => {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-2 h-6 bg-blue-600 rounded-full"></span>
                Study Information
            </h2>

            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Observer</label>
                        <select
                            value={data.observer}
                            onChange={(e) => onChange({ observer: e.target.value })}
                            className="w-full text-base px-4 py-3 rounded-xl border border-gray-300 bg-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none"
                        >
                            <option value="R. Colon">R. Colon</option>
                            <option value="J. Smith">J. Smith</option>
                            <option value="A. Davis">A. Davis</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Team</label>
                        <select
                            value={data.team}
                            onChange={(e) => onChange({ team: e.target.value as Team })}
                            className="w-full text-base px-4 py-3 rounded-xl border border-gray-300 bg-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none"
                        >
                            {TEAMS.map((t) => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Speed Limit (MPH)</label>
                    <select
                        value={data.speedLimit}
                        onChange={(e) => onChange({ speedLimit: Number(e.target.value) })}
                        className="w-full text-base px-4 py-3 rounded-xl border border-gray-300 bg-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none"
                    >
                        {SPEED_LIMITS.map((limit) => (
                            <option key={limit} value={limit}>{limit} MPH</option>
                        ))}
                    </select>
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
                    <select
                        value={data.direction}
                        onChange={(e) => onChange({ direction: e.target.value as Direction })}
                        className="w-full text-base px-4 py-3 rounded-xl border border-gray-300 bg-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none"
                    >
                        {DIRECTIONS.map((dir) => (
                            <option key={dir} value={dir}>{dir}</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
};
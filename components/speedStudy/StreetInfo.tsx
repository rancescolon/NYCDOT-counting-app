// components/speed-study/StreetInfo.tsx

import React from 'react';
import { Borough, SpeedStudyFormState }  from '@/lib/types';

interface Props {
    data: SpeedStudyFormState;
    onChange: (updates: Partial<SpeedStudyFormState>) => void;
}

const BOROUGHS: Borough[] = ['Manhattan', 'Bronx', 'Brooklyn', 'Queens', 'Staten Island'];

export const StreetInfo: React.FC<Props> = ({ data, onChange }) => {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                
                Street Information
            </h2>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Street Name</label>
                    <input
                        type="text"
                        value={data.streetName}
                        onChange={(e) => onChange({ streetName: e.target.value })}
                        placeholder="e.g., Grand Concourse"
                        className="w-full text-base px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none"
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">From Street</label>
                        <input
                            type="text"
                            value={data.fromStreet}
                            onChange={(e) => onChange({ fromStreet: e.target.value })}
                            placeholder="e.g., 161st St"
                            className="w-full text-base px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">To Street</label>
                        <input
                            type="text"
                            value={data.toStreet}
                            onChange={(e) => onChange({ toStreet: e.target.value })}
                            placeholder="e.g., 160th St"
                            className="w-full text-base px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Borough</label>
                    <div className="grid grid-cols-2 gap-2">
                        {BOROUGHS.map((b) => (
                            <button
                                key={b}
                                type="button"
                                onClick={() => onChange({ borough: b })}
                                className={`py-3 px-3 text-sm font-semibold rounded-xl border transition-all ${
                                    data.borough === b
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                                }`}
                            >
                                {b}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
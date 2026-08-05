// components/speed-study/WeatherInfo.tsx

import React from 'react';
import { SpeedStudyFormState, WeatherCondition } from '@/lib/types';

interface Props {
    data: SpeedStudyFormState;
    onChange: (updates: Partial<SpeedStudyFormState>) => void;
}

const WEATHER_OPTIONS: { label: WeatherCondition; icon: string }[] = [
    { label: 'Clear', icon: '☀' },
    { label: 'Cloudy', icon: '☁' },
    { label: 'Wet Pavement', icon: '🌧' },
];

export const WeatherInfo: React.FC<Props> = ({ data, onChange }) => {
    const isInvalidWeather = data.isRaining || data.isSnowing;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-2 h-6 bg-blue-600 rounded-full"></span>
                Weather Condition
            </h2>

            <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                    {WEATHER_OPTIONS.map((w) => (
                        <button
                            key={w.label}
                            type="button"
                            onClick={() => onChange({ weather: w.label })}
                            className={`py-3 px-2 flex flex-col items-center justify-center text-sm font-semibold rounded-xl border transition-all ${
                                data.weather === w.label
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                            }`}
                        >
                            <span className="text-xl mb-1">{w.icon}</span>
                            <span className="text-center leading-tight">{w.label}</span>
                        </button>
                    ))}
                </div>

                <div className="border-t border-gray-100 pt-4 space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                        <span className="text-base font-medium text-gray-800">Currently Raining?</span>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => onChange({ isRaining: false })}
                                className={`px-4 py-2 rounded-lg text-sm font-bold ${
                                    !data.isRaining ? 'bg-gray-200 text-gray-800' : 'bg-white text-gray-500 border border-gray-200'
                                }`}
                            >
                                No
                            </button>
                            <button
                                type="button"
                                onClick={() => onChange({ isRaining: true })}
                                className={`px-4 py-2 rounded-lg text-sm font-bold ${
                                    data.isRaining ? 'bg-red-600 text-white shadow-sm' : 'bg-white text-gray-500 border border-gray-200'
                                }`}
                            >
                                Yes
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                        <span className="text-base font-medium text-gray-800">Currently Snowing?</span>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => onChange({ isSnowing: false })}
                                className={`px-4 py-2 rounded-lg text-sm font-bold ${
                                    !data.isSnowing ? 'bg-gray-200 text-gray-800' : 'bg-white text-gray-500 border border-gray-200'
                                }`}
                            >
                                No
                            </button>
                            <button
                                type="button"
                                onClick={() => onChange({ isSnowing: true })}
                                className={`px-4 py-2 rounded-lg text-sm font-bold ${
                                    data.isSnowing ? 'bg-red-600 text-white shadow-sm' : 'bg-white text-gray-500 border border-gray-200'
                                }`}
                            >
                                Yes
                            </button>
                        </div>
                    </div>
                </div>

                {isInvalidWeather && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                        <span className="text-red-600 text-xl font-bold">⚠</span>
                        <p className="text-sm font-semibold text-red-700 leading-snug">
                            Speed studies cannot be performed while it is raining or snowing.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
// components/speed-study/WeatherInfo.tsx

import React from 'react';
import Image from 'next/image';
import { SpeedStudyFormState } from '@/lib/types';
import { getAssetPath } from '@/lib/utils'; // Adjust import path as needed

interface Props {
    data: SpeedStudyFormState;
    onChange: (updates: Partial<SpeedStudyFormState>) => void;
}

const WEATHER_OPTIONS = [
    { label: 'Sunny', icon: getAssetPath('/sunny.png'), isRain: false, isSnow: false },
    { label: 'Cloudy', icon: getAssetPath('/cloudy.png'), isRain: false, isSnow: false },
    { label: 'Rain', icon: getAssetPath('/rain.png'), isRain: true, isSnow: false },
    { label: 'Snowy', icon: getAssetPath('/snowy.png'), isRain: false, isSnow: true },
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
                <div className="grid grid-cols-2 gap-3">
                    {WEATHER_OPTIONS.map((w) => {
                        const isSelected = data.weather === w.label;
                        return (
                            <button
                                key={w.label}
                                type="button"
                                onClick={() =>
                                    onChange({
                                        weather: w.label as any,
                                        isRaining: w.isRain,
                                        isSnowing: w.isSnow,
                                    })
                                }
                                className={`p-3.5 flex items-center gap-3 rounded-xl border transition-all ${
                                    isSelected
                                        ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-sm ring-1 ring-blue-600'
                                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-150'
                                }`}
                            >
                                <div className="relative w-8 h-8 flex-shrink-0">
                                    <Image
                                        src={w.icon}
                                        alt={w.label}
                                        fill
                                        className="object-contain"
                                    />
                                </div>
                                <span className="text-base font-semibold">{w.label}</span>
                            </button>
                        );
                    })}
                </div>

                {isInvalidWeather && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                        <div className="relative w-6 h-6 flex-shrink-0 mt-0.5">
                            <Image
                                src={getAssetPath('/caution.png')}
                                alt="Caution"
                                fill
                                className="object-contain"
                            />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-red-800">Outside Allowed Study Window / Weather Alert</p>
                            <p className="text-xs text-red-700 mt-0.5">Speed studies cannot be performed while it is raining or snowing.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
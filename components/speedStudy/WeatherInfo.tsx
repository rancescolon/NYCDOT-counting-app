// components/speed-study/WeatherInfo.tsx

import React, { useEffect } from 'react';
import Image from 'next/image';
import { SpeedStudyFormState, WeatherCondition } from '@/lib/types/types'; // 1. Import WeatherCondition
import { getAssetPath } from '@/lib/utils';
import { TEAM_RULES, isWeatherAllowed } from '@/lib/config/speed-study.config';

interface Props {
    data: SpeedStudyFormState;
    onChange: (updates: Partial<SpeedStudyFormState>) => void;
    onValidationChange?: (isValid: boolean) => void;
}

// 2. Type WEATHER_OPTIONS with WeatherCondition
const WEATHER_OPTIONS: { label: WeatherCondition; icon: string; isRain: boolean; isSnow: boolean }[] = [
    { label: 'Sunny', icon: getAssetPath('/sunny.png'), isRain: false, isSnow: false },
    { label: 'Cloudy', icon: getAssetPath('/cloudy.png'), isRain: false, isSnow: false },
    { label: 'Rainy', icon: getAssetPath('/rainy.png'), isRain: true, isSnow: false },
    { label: 'Heavy Rain', icon: getAssetPath('/rain.png'), isRain: true, isSnow: false },
    { label: 'Snowing', icon: getAssetPath('/snowy.png'), isRain: false, isSnow: true },
];

export const WeatherInfo: React.FC<Props> = ({ data, onChange, onValidationChange }) => {
    const isWeatherValid = isWeatherAllowed(data.team, data.weather);
    const rule = TEAM_RULES[data.team]?.weatherRestriction;

    useEffect(() => {
        if (onValidationChange) {
            onValidationChange(isWeatherValid);
        }
    }, [isWeatherValid, onValidationChange]);

    // 3. Type `label` parameter as WeatherCondition instead of string
    const handleSelectWeather = (label: WeatherCondition, isRain: boolean, isSnow: boolean) => {
        onChange({
            weather: label,
            isRaining: isRain,
            isSnowing: isSnow,
        });
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                Weather Conditions
            </h2>

            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2.5">
                    {WEATHER_OPTIONS.map((w) => {
                        const isSelected = data.weather === w.label;
                        return (
                            <button
                                key={w.label}
                                type="button"
                                onClick={() => handleSelectWeather(w.label, w.isRain, w.isSnow)}
                                className={`p-3.5 flex items-center gap-3 rounded-xl border transition-all ${
                                    isSelected
                                        ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-sm ring-1 ring-blue-600'
                                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
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

                {/* Caution for disallowed weather */}
                {!isWeatherValid && rule && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                        <p className="text-sm font-semibold text-red-700 leading-snug">
                            {rule.description}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
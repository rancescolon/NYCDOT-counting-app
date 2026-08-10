// components/speed-study/RoadInfo.tsx

import React from 'react';
import { SpeedStudyFormState } from '@/lib/types';

interface Props {
    data: SpeedStudyFormState;
    onChange: (updates: Partial<SpeedStudyFormState>) => void;
}

export const RoadInfo: React.FC<Props> = ({ data, onChange }) => {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">

                Road Configuration
            </h2>

            <div className="space-y-5">
                {/* Moving Lanes Stepper */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <span className="text-base font-medium text-gray-800">Moving Lanes</span>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => onChange({ movingLanes: Math.max(1, data.movingLanes - 1) })}
                            className="w-11 h-11 flex items-center justify-center bg-white border border-gray-300 rounded-xl text-xl font-bold text-blue-600 shadow-sm active:scale-95 transition"
                        >
                            -
                        </button>
                        <span className="text-xl font-bold w-6 text-center text-gray-900">{data.movingLanes}</span>
                        <button
                            type="button"
                            onClick={() => onChange({ movingLanes: data.movingLanes + 1 })}
                            className="w-11 h-11 flex items-center justify-center bg-white border border-gray-300 rounded-xl text-xl font-bold text-blue-600 shadow-sm active:scale-95 transition"
                        >
                            +
                        </button>
                    </div>
                </div>

                {/* Parking Lanes Stepper */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <span className="text-base font-medium text-gray-800">Parking Lanes</span>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => onChange({ parkingLanes: Math.max(0, data.parkingLanes - 1) })}
                            className="w-11 h-11 flex items-center justify-center bg-white border border-gray-300 rounded-xl text-xl font-bold text-blue-600 shadow-sm active:scale-95 transition"
                        >
                            -
                        </button>
                        <span className="text-xl font-bold w-6 text-center text-gray-900">{data.parkingLanes}</span>
                        <button
                            type="button"
                            onClick={() => onChange({ parkingLanes: data.parkingLanes + 1 })}
                            className="w-11 h-11 flex items-center justify-center bg-white border border-gray-300 rounded-xl text-xl font-bold text-blue-600 shadow-sm active:scale-95 transition"
                        >
                            +
                        </button>
                    </div>
                </div>

                {/* Truck Route Toggle */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <span className="text-base font-medium text-gray-800">Truck Route</span>
                    <button
                        type="button"
                        onClick={() => onChange({ isTruckRoute: !data.isTruckRoute })}
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                            data.isTruckRoute
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'bg-gray-200 text-gray-600'
                        }`}
                    >
                        {data.isTruckRoute ? 'ON' : 'OFF'}
                    </button>
                </div>

                {/* Bus Route Toggle */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <span className="text-base font-medium text-gray-800">Bus Route</span>
                    <button
                        type="button"
                        onClick={() => onChange({ isBusRoute: !data.isBusRoute })}
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                            data.isBusRoute
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'bg-gray-200 text-gray-600'
                        }`}
                    >
                        {data.isBusRoute ? 'ON' : 'OFF'}
                    </button>
                </div>

                {/* Conditional Bus Line */}
                {data.isBusRoute && (
                    <div className="pt-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bus Line</label>
                        <input
                            type="text"
                            value={data.busLine}
                            onChange={(e) => onChange({ busLine: e.target.value })}
                            placeholder="ex: Bx41"
                            className="w-full text-base px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none bg-white"
                        />
                    </div>
                )}
            </div>
        </div>
    );
};
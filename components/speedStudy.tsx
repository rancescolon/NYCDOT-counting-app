// app/speed-study/page.tsx

 'use client'

import React, { useState } from 'react';
import { SpeedStudyFormState } from '@/lib/types'
import { StreetInfo } from '@/components/speedStudy/StreetInfo';
import { StudyInfo } from '@/components/speedStudy/StudyInfo';
import { RoadInfo } from '@/components/speedStudy/RoadInfo';
import { WeatherInfo } from '@/components/speedStudy/WeatherInfo';
import { TimingInfo } from '@/components/speedStudy/TimingInfo';
import { Notes } from '@/components/speedStudy/Notes';
import { ReminderCard } from '@/components/speedStudy/ReminderCard';
import { StickyFooter } from '@/components/speedStudy/StickyFooter';

export default function SpeedStudyPage() {
    const [formState, setFormState] = useState<SpeedStudyFormState>({
        streetName: '',
        fromStreet: '',
        toStreet: '',
        borough: 'Bronx',
        observer: 'R. Colon',
        team: 'School Safety',
        speedLimit: 25,
        streetType: 'One Way',
        direction: 'Northbound',
        movingLanes: 2,
        parkingLanes: 2,
        isTruckRoute: false,
        isBusRoute: false,
        busLine: '',
        weather: 'Clear',
        isSnowing: false,
        isRaining: false,
        startTimeSlot: '10:00 AM',
        notes: '',
    });

    const handleUpdate = (updates: Partial<SpeedStudyFormState>) => {
        setFormState((prev) => ({ ...prev, ...updates }));
    };

    const isRainOrSnow = formState.isRaining || formState.isSnowing;

    const handleStartStudy = () => {
        if (isRainOrSnow) return;
        // Transition to active logging view or store to context/backend
        alert('Study started successfully! Transitioning to vehicle speed logging interface...');
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 pb-12">
            {/* Top Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-40 px-4 py-3.5 shadow-sm">
                <div className="max-w-md mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => window.history.back()}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition"
                        >
                            ←
                        </button>
                        <h1 className="text-lg font-bold text-gray-900">Speed Study Setup</h1>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
            Step 1 of 2
          </span>
                </div>
            </header>

            {/* Form Body */}
            <main className="max-w-md mx-auto p-4">
                <StreetInfo data={formState} onChange={handleUpdate} />
                <StudyInfo data={formState} onChange={handleUpdate} />
                <RoadInfo data={formState} onChange={handleUpdate} />
                <WeatherInfo data={formState} onChange={handleUpdate} />
                <TimingInfo data={formState} onChange={handleUpdate} />
                <Notes data={formState} onChange={handleUpdate} />
                <ReminderCard />
            </main>

            {/* Sticky Bottom Action */}
            <StickyFooter disabled={isRainOrSnow} onStartStudy={handleStartStudy} />
        </div>
    );
}
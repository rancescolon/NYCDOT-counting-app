// app/speed-study/page.tsx

'use client'

import React, { useState } from 'react';
import { SpeedStudyFormState } from '@/lib/types/types'
import { StreetInfo } from '@/components/speedStudy/StreetInfo';
import { StudyInfo } from '@/components/speedStudy/StudyInfo';
import { RoadInfo } from '@/components/speedStudy/RoadInfo';
import { WeatherInfo } from '@/components/speedStudy/WeatherInfo';
import { TimingInfo } from '@/components/speedStudy/TimingInfo';
import { Notes } from '@/components/speedStudy/Notes';
import { ReminderCard } from '@/components/speedStudy/ReminderCard';
import { StickyFooter } from '@/components/speedStudy/StickyFooter';
import { ActiveStudyView } from '@/components/speedStudy/ActiveStudyView';

export default function SpeedStudyPage() {
    const [isStudyActive, setIsStudyActive] = useState(false);
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
    const [isTimeValid, setIsTimeValid] = useState(true);


    const handleUpdate = (updates: Partial<SpeedStudyFormState>) => {
        setFormState((prev) => ({ ...prev, ...updates }));
    };

    const isRainOrSnow = formState.isRaining || formState.isSnowing;

    if (isStudyActive) {
        return (
            <ActiveStudyView
                studyData={formState}
                onEndStudy={() => setIsStudyActive(false)}
            />
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 pb-12">
            {/* Top Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-40 px-4 py-3.5 shadow-sm">
                <div className="max-w-md mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <h1 className="text-lg font-bold text-gray-900 ">Speed Study Setup</h1>
                    </div>
                </div>
            </header>

            {/* Form Body */}
            <main className="max-w-md mx-auto p-4">
                <StreetInfo data={formState} onChange={handleUpdate} />
                <StudyInfo data={formState} onChange={handleUpdate} />
                <RoadInfo data={formState} onChange={handleUpdate} />
                <WeatherInfo data={formState} onChange={handleUpdate} />
                <TimingInfo data={formState} onChange={handleUpdate} onValidationChange={setIsTimeValid}/>
                <Notes data={formState} onChange={handleUpdate} />
                <ReminderCard />
            </main>

            <StickyFooter
                disabled={isRainOrSnow || !isTimeValid}
                onStartStudy={() => setIsStudyActive(true)}
            />
        </div>
    );
}
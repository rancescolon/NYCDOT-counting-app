'use client'

import React, { useState } from 'react';
import { SpeedStudyFormState } from '@/lib/types/types';
import { StreetInfo } from '@/components/speedStudy/StreetInfo';
import { StudyInfo } from '@/components/speedStudy/StudyInfo';
import { RoadInfo } from '@/components/speedStudy/RoadInfo';
import { WeatherInfo } from '@/components/speedStudy/WeatherInfo';
import { TimingInfo } from '@/components/speedStudy/TimingInfo';
import { Notes } from '@/components/speedStudy/Notes';
import { ReminderCard } from '@/components/speedStudy/ReminderCard';
import { StickyFooter } from '@/components/speedStudy/StickyFooter';
import { ActiveStudyView } from '@/components/speedStudy/ActiveStudyView';
import { BikeLanesActiveStudyView } from '@/components/speedStudy/BikeLanesActiveStudyView';
import { TEAMS, OBSERVERS_BY_TEAM, TEAM_RULES } from '@/lib/config/speed-study.config';

export default function SpeedStudyPage() {
    const [isStudyActive, setIsStudyActive] = useState(false);
    const [isTimeAndDayValid, setIsTimeAndDayValid] = useState(true);
    const [isWeatherValid, setIsWeatherValid] = useState(true);

    const defaultTeam = TEAMS[0] || 'School Safety';
    const defaultObserver = OBSERVERS_BY_TEAM[defaultTeam]?.[0] || 'R. Colon';

    const [formState, setFormState] = useState<SpeedStudyFormState>({
        streetName: '',
        fromStreet: '',
        toStreet: '',
        borough: 'Bronx',
        observer: defaultObserver,
        team: defaultTeam as any,
        speedLimit: 25,
        streetType: 'One Way',
        direction: 'Northbound',
        movingLanes: 2,
        parkingLanes: 2,
        isTruckRoute: false,
        isBusRoute: false,
        busLine: '',
        weather: 'Sunny',
        isRaining: false,
        isSnowing: false,
        startTimeSlot: '',
        notes: '',
    });

    const handleUpdate = (updates: Partial<SpeedStudyFormState>) => {
        setFormState((prev) => ({ ...prev, ...updates }));
    };

    const currentTeamRule = TEAM_RULES[formState.team];
    const cardConfig = currentTeamRule?.cards || {};

    // Route active view layout based on team config
    if (isStudyActive) {
        if (currentTeamRule?.activePage === 'bike_lanes') {
            return (
                <BikeLanesActiveStudyView
                    studyData={formState}
                    onEndStudy={() => setIsStudyActive(false)}
                />
            );
        }

        return (
            <ActiveStudyView
                studyData={formState}
                onEndStudy={() => setIsStudyActive(false)}
            />
        );
    }

    const isFormDisabled =
        !isTimeAndDayValid ||
        !isWeatherValid ||
        !formState.streetName.trim() ||
        !formState.fromStreet.trim() ||
        !formState.toStreet.trim();

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 pb-12">
            <header className="bg-white border-b border-gray-200 sticky top-0 z-40 px-4 py-3.5 shadow-sm">
                <div className="max-w-md mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <h1 className="text-lg font-bold text-gray-900">Speed Study Setup</h1>
                    </div>
                </div>
            </header>

            {/* StudyInfo is rendered FIRST to drive configuration across downstream cards */}
            <main className="max-w-md mx-auto p-4">
                <StudyInfo data={formState} onChange={handleUpdate} />

                {(cardConfig.streetInfo ?? true) && (
                    <StreetInfo data={formState} onChange={handleUpdate} />
                )}

                {(cardConfig.roadInfo ?? true) && (
                    <RoadInfo data={formState} onChange={handleUpdate} />
                )}

                {(cardConfig.weatherInfo ?? true) && (
                    <WeatherInfo
                        data={formState}
                        onChange={handleUpdate}
                        onValidationChange={setIsWeatherValid}
                    />
                )}

                {(cardConfig.timingInfo ?? true) && (
                    <TimingInfo
                        data={formState}
                        onChange={handleUpdate}
                        onValidationChange={setIsTimeAndDayValid}
                    />
                )}

                {(cardConfig.notes ?? true) && (
                    <Notes data={formState} onChange={handleUpdate} />
                )}

                {(cardConfig.reminderCard ?? true) && (
                    <ReminderCard />
                )}
            </main>

            <StickyFooter
                disabled={isFormDisabled}
                onStartStudy={() => setIsStudyActive(true)}
            />
        </div>
    );
}
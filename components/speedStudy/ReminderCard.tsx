// components/speed-study/ReminderCard.tsx

import React from 'react';

export const ReminderCard: React.FC = () => {
    return (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-24">
            <div className="flex items-center gap-2 mb-3">
                <span className="text-blue-600 text-lg">ℹ</span>
                <h3 className="text-base font-bold text-blue-900">Important Reminder</h3>
            </div>
            <p className="text-sm font-medium text-blue-800 mb-2">
                Speeds cannot be collected during:
            </p>
            <ul className="space-y-1.5 text-sm text-blue-800 pl-2">
                <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                    Extended loading activity
                </li>
                <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                    Double parking
                </li>
                <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                    School dismissal / pick-up
                </li>
                <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                    Moving truck parked over 30 minutes
                </li>
            </ul>
        </div>
    );
};
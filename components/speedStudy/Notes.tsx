// components/speed-study/Notes.tsx

import React from 'react';
import { SpeedStudyFormState } from '@/lib/types';

interface Props {
    data: SpeedStudyFormState;
    onChange: (updates: Partial<SpeedStudyFormState>) => void;
}

export const Notes: React.FC<Props> = ({ data, onChange }) => {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-2 h-6 bg-blue-600 rounded-full"></span>
                Additional Notes
            </h2>

            <div>
        <textarea
            rows={3}
            value={data.notes}
            onChange={(e) => onChange({ notes: e.target.value })}
            placeholder="Add any observations or exceptional conditions here..."
            className="w-full text-base px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none resize-none bg-gray-50/50"
        />
            </div>
        </div>
    );
};
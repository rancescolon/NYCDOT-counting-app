// components/speed-study/StickyFooter.tsx

import React from 'react';

interface Props {
    disabled: boolean;
    onStartStudy: () => void;
}

export const StickyFooter: React.FC<Props> = ({ disabled, onStartStudy }) => {
    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 p-4 shadow-lg z-50">
            <div className="max-w-md mx-auto">
                <button
                    type="button"
                    disabled={disabled}
                    onClick={onStartStudy}
                    className={`w-full py-4 px-6 rounded-2xl text-lg font-semibold tracking-wide transition-all shadow-md ${
                        disabled
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                            : 'bg-blue-600 hover:bg-blue-700 text-white active:scale-[0.98]'
                    }`}
                >
                    START STUDY
                </button>
            </div>
        </div>
    );
};
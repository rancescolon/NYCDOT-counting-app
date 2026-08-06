// components/ui/CustomDropdown.tsx

import React, { useState, useRef, useEffect } from 'react';

interface Option {
    label: string | number;
    value: string | number;
}

interface CustomDropdownProps {
    value: string | number;
    options: (string | number)[] | Option[];
    onChange: (val: any) => void;
    suffix?: string;
    placeholder?: string;
}

export const CustomDropdown: React.FC<CustomDropdownProps> = ({
                                                                  value,
                                                                  options,
                                                                  onChange,
                                                                  suffix = '',
                                                                  placeholder = 'Select option',
                                                              }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Normalize inputs to support simple arrays or label/value objects
    const normalizedOptions: Option[] = options.map((opt) =>
        typeof opt === 'object' && opt !== null
            ? opt
            : { label: opt, value: opt }
    );

    const selectedOption = normalizedOptions.find((opt) => opt.value === value);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full text-base px-4 py-3 rounded-xl border border-gray-300 bg-white flex items-center justify-between focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none text-left shadow-sm transition active:bg-gray-50"
            >
        <span className={selectedOption ? 'text-gray-900 font-medium' : 'text-gray-400'}>
          {selectedOption ? `${selectedOption.label}${suffix ? ` ${suffix}` : ''}` : placeholder}
        </span>
                <span className={`text-gray-500 text-xs transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
            </button>

            {isOpen && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto divide-y divide-gray-100">
                    {normalizedOptions.map((opt) => {
                        const isSelected = opt.value === value;
                        return (
                            <button
                                key={String(opt.value)}
                                type="button"
                                onClick={() => {
                                    onChange(opt.value);
                                    setIsOpen(false);
                                }}
                                className={`w-full px-4 py-3.5 text-base text-left flex items-center justify-between transition ${
                                    isSelected
                                        ? 'bg-blue-50 text-blue-600 font-semibold'
                                        : 'text-gray-800 hover:bg-gray-50'
                                }`}
                            >
                                <span>{opt.label}{suffix ? ` ${suffix}` : ''}</span>
                                {isSelected && <span className="text-blue-600 font-bold">✓</span>}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
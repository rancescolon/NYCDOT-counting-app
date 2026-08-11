// components/Navbar.tsx

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getAssetPath } from '@/lib/utils';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <header className="bg-black text-white p-4 relative z-50">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                <Link href="/" className="text-xl font-bold">
                    DOT Tool App
                </Link>

                {/* Desktop Navigation (Identical to original) */}
                <nav className="hidden md:block">
                    <ul className="flex items-center gap-6">
                        <li>
                            <Link href="/counter" className="hover:text-gray-300 transition-colors">
                                Curb Cuts
                            </Link>
                        </li>
                        <li>
                            <Link href="/speedStudy" className="hover:text-gray-300 transition-colors">
                                Speed Study
                            </Link>
                        </li>
                        <li>
                            <Link href="/pedestrianCounting" className="hover:text-gray-300 transition-colors">
                                Pedestrian Counting
                            </Link>
                        </li>
                    </ul>
                </nav>

                {/* Mobile Burger Button */}
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="md:hidden p-2 focus:outline-none"
                    aria-label="Toggle Navigation Menu"
                >
                    <div className="relative w-6 h-6">
                        <Image
                            src={getAssetPath('/burger-menu.svg')}
                            alt="Menu"
                            fill
                            className="object-contain invert"
                        />
                    </div>
                </button>
            </div>

            {/* Mobile Dropdown Menu */}
            {isOpen && (
                <nav className="md:hidden mt-4 pb-2 border-t border-gray-800 pt-4 animate-fadeIn">
                    <ul className="flex flex-col gap-4 px-2">
                        <li>
                            <Link
                                href="/counter"
                                onClick={() => setIsOpen(false)}
                                className="block text-base hover:text-gray-300 transition-colors py-1"
                            >
                                Curb Cut
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="/speedStudy"
                                onClick={() => setIsOpen(false)}
                                className="block text-base hover:text-gray-300 transition-colors py-1"
                            >
                                Speed Study
                            </Link>
                        </li>
                    </ul>
                </nav>
            )}
        </header>
    );
}
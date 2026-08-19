'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { getAssetPath } from '@/lib/utils';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const pathname = usePathname();

    useEffect(() => {
        const isRoot = pathname === '/';

        const checkVisibilityRules = () => {
            // Always visible on root page or mobile viewports (< 768px)
            if (isRoot || window.innerWidth < 768) {
                setIsVisible(true);
                return true;
            }
            return false;
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (checkVisibilityRules()) return;

            if (e.clientY <= 60 || isOpen) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        const handleResize = () => {
            checkVisibilityRules();
        };

        // Initial check on mount/route change
        if (!checkVisibilityRules()) {
            setIsVisible(false);
        }

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('resize', handleResize);
        };
    }, [pathname, isOpen]);

    const isRoot = pathname === '/';

    return (
        <header className={`fixed top-0 left-0 right-0 z-50 bg-black text-white p-4 transition-transform duration-300 ${isVisible || isRoot ? 'translate-y-0' : '-translate-y-full'}`}>
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                <Link href="/" className="text-xl font-bold">
                    DOT Tool App
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden md:block">
                    <ul className="flex items-center gap-6">
                        <li>
                            <Link href="/curbcuts" className="hover:text-gray-300 transition-colors">
                                Curb Cuts
                            </Link>
                        </li>
                        <li>
                            <Link href="/speedStudy" className="hover:text-gray-300 transition-colors">
                                Speed Study
                            </Link>
                        </li>
                        <li>
                            <Link href="/pedestrian" className="hover:text-gray-300 transition-colors">
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
                                href="/speedStudy"
                                onClick={() => setIsOpen(false)}
                                className="block text-base hover:text-gray-300 transition-colors py-1 font-medium"
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
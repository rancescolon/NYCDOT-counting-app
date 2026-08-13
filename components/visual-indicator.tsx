"use client"

import type React from "react"

interface VisualIndicatorProps {
    children: React.ReactNode
}

/**
 * A generic interface/wrapper for overlaying visual tools on the video player.
 * It handles the absolute positioning and z-indexing, delegating the actual
 * functionality (like drawing or markers) to its children.
 */
export function VisualIndicator({ children }: VisualIndicatorProps) {
    return (
        <div className="absolute inset-0 w-full h-full z-50 pointer-events-none flex items-center justify-center">
            {children}
        </div>
    )
}
// components/visual-indicator.tsx
"use client"

import type React from "react"

interface VisualIndicatorProps {
    children: React.ReactNode
}

export function VisualIndicator({ children }: VisualIndicatorProps) {
    return (
        <div className="absolute inset-0 w-full h-full z-20 pointer-events-none">
            {children}
        </div>
    )
}
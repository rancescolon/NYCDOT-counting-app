"use client"

import React from "react"

interface ControlsPanelProps {
    children?: React.ReactNode
    className?: string
}

export function ControlsPanel({ children, className = "" }: ControlsPanelProps) {
    if (!children) return null

    return (
        <div className={`flex items-center gap-2 shrink-0 ${className}`}>
            {children}
        </div>
    )
}
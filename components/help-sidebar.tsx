"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ChevronRight, Undo2, ExternalLink } from "lucide-react"
import { SidebarConfig, QuickTipContext } from "@/lib/config/sidebar.config"

interface HelpSidebarProps {
    isOpen: boolean
    onClose: () => void
    onUndo?: () => void
    canUndo?: boolean
    onAction?: (actionKey: string) => void
    config: SidebarConfig
    context?: QuickTipContext
}

export default function HelpSidebar({
                                        isOpen,
                                        onClose,
                                        onUndo,
                                        canUndo = false,
                                        onAction,
                                        config,
                                        context = {}
                                    }: HelpSidebarProps) {
    const [isCollapsed, setIsCollapsed] = useState(false)

    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose()
            }
        }
        if (isOpen) {
            document.addEventListener("keydown", handleEscape)
        }
        return () => {
            document.removeEventListener("keydown", handleEscape)
        }
    }, [isOpen, onClose])

    if (!isOpen) return null

    const tips = config.quickTips(context);

    return (
        <>
            <div
                className={`fixed top-0 right-0 h-full bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-2xl z-40 transition-all duration-300 ease-in-out ${
                    isCollapsed ? "w-12" : "w-80"
                } animate-in slide-in-from-right duration-300`}
            >
                {/* Side Arrow Button */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                            if (isCollapsed) {
                                setIsCollapsed(false)
                            } else {
                                onClose()
                            }
                        }}
                        className="h-16 w-8 rounded-l-lg rounded-r-none bg-white dark:bg-gray-800 border border-r-0 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 shadow-lg transition-all duration-200"
                        title={isCollapsed ? "Expand sidebar" : "Close help"}
                    >
                        <ChevronRight
                            className={`h-5 w-5 text-gray-600 dark:text-gray-300 transition-transform duration-200 ${
                                isCollapsed ? "rotate-180" : ""
                            }`}
                        />
                    </Button>
                </div>

                <div className="flex flex-col h-full">
                    {!isCollapsed && (
                        <>
                            {/* Header / Undo Button */}
                            {onUndo && (
                                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                                    <Button
                                        onClick={onUndo}
                                        disabled={!canUndo}
                                        className={`w-full flex items-center justify-center gap-3 h-12 transition-all duration-200 ${
                                            canUndo
                                                ? "bg-orange-500 hover:bg-orange-600 text-white hover:scale-105 hover:shadow-md"
                                                : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                                        }`}
                                    >
                                        <Undo2 className="h-5 w-5" />
                                        <span className="font-semibold">Undo Last Count</span>
                                        <kbd className="px-2 py-1 text-xs font-mono bg-black/20 text-white rounded">Z</kbd>
                                    </Button>
                                </div>
                            )}

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-4">
                                <div className="space-y-3" style={{ userSelect: "none" }}>
                                    {config.shortcuts.map((shortcut, index) => {
                                        const isClickable = !!shortcut.actionKey && !!onAction;

                                        return (
                                            <div
                                                key={index}
                                                onClick={() => {
                                                    if (isClickable && shortcut.actionKey && onAction) {
                                                        onAction(shortcut.actionKey)
                                                    }
                                                }}
                                                className={`flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 transition-all duration-200 ${
                                                    isClickable ? "hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer hover:scale-105 shadow-sm" : ""
                                                }`}
                                            >
                                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                                    <div className="flex gap-2">
                                                        {shortcut.keys.map((key, keyIndex) => (
                                                            <kbd
                                                                key={keyIndex}
                                                                className={`px-3 py-2 text-sm font-mono ${shortcut.color} text-white rounded shadow-md min-w-[2rem] text-center font-bold`}
                                                            >
                                                                {key}
                                                            </kbd>
                                                        ))}
                                                    </div>
                                                    <span className="text-sm text-gray-700 dark:text-gray-200 font-medium">
                                                        {shortcut.description}
                                                    </span>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>

                                {tips.length > 0 && (
                                    <div className="mt-6 rounded-lg border border-blue-500 bg-gray-100 p-4 mb-4 dark:border-blue-400 dark:bg-gray-800">
                                        <h4 className="mb-3 text-sm font-semibold text-blue-800 dark:text-blue-200">
                                            Quick Tips
                                        </h4>

                                        <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                                            {tips.map((tip, index) => (
                                                <li key={index}>
                                                    • {tip.text}
                                                    {tip.link && (
                                                        <a
                                                            href={tip.link.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1 font-medium text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 ml-1"
                                                        >
                                                            {tip.link.label}
                                                            <ExternalLink className="h-4 w-4" />
                                                        </a>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    )
}
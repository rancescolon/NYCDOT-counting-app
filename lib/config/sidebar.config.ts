export interface ShortcutItem {
    keys: string[]
    description: string
    color: string
    actionKey?: string
    direction?: string
}

export interface QuickTipContext {
    canUndo?: boolean
    intersectionsSet?: boolean
}

export interface SidebarConfig {
    shortcuts: ShortcutItem[]
    quickTips: (context: QuickTipContext) => Array<{
        text: string
        link?: { label: string; url: string }
    }>
}

export const HelpSidebarConfig: Record<string, SidebarConfig> = {
    vehicle: {
        shortcuts: [
            { keys: ["1"], description: "Mark Sidewalk Cut Through", color: "bg-blue-500", actionKey: "1" },
            { keys: ["2"], description: "Mark Sidewalk Parking", color: "bg-emerald-500", actionKey: "2" },
            { keys: ["3"], description: "Mark Sidewalk Driving", color: "bg-amber-400", actionKey: "3" },
            { keys: ["Hold M"], description: "Motorcycle Modifier", color: "bg-purple-500" },
            { keys: ["Hold E", "Hold B"], description: "E-Bike Modifier", color: "bg-purple-500" },
            { keys: ["Hold T"], description: "Truck Modifier", color: "bg-purple-500" },
            { keys: ["Shift"], description: "Drawing Mode", color: "bg-red-500" },
            { keys: ["↑", "↓"], description: "Slow down / Speed up", color: "bg-gray-500" },
            { keys: ["?"], description: "Toggle this help menu", color: "bg-gray-800" },
            { keys: ["R"], description: "Redo an undo", color: "bg-yellow-800" },
            { keys: ["Hold Q"], description: "Questionable Modifier", color: "bg-purple-500" },
            { keys: ["N"], description: "Add a note", color: "bg-red-500" },
        ],
        quickTips: (context) => [
            { text: "Press 1, 2, or 3 to log a vehicle (incorporates any held modifier)." },
            { text: "Hold M, E/B, or T to change the vehicle type." },
            { text: "Press Shift to toggle drawing restricted zones." },
            { text: `Press Z to undo the last logged vehicle.${context.canUndo ? " (Undo available!)" : ""}` },
            { text: "Press Shift + Z to undo the last drawn line." },
            {
                text: "Tutorial: ",
                link: {
                    label: "How to use the app",
                    url: "https://scribehow.com/o/3GFUEJCXRdq_VBvGu59luw/viewer/How_To_Use_The_NYCDOT_Traffic_Video_Counting_App__I3HaCYxETYuEN6NGyajSNw",
                },
            },
        ],
    },


    pedestrian: {
        shortcuts: [
            { keys: ["1"], description: "Count Eastbound (North)", color: "bg-blue-500", direction: "Eastbound", actionKey: "1" },
            { keys: ["2"], description: "Count Westbound (North)", color: "bg-blue-500", direction: "Westbound", actionKey: "2" },
            { keys: ["3"], description: "Count Eastbound (South)", color: "bg-red-500", direction: "Eastbound", actionKey: "3" },
            { keys: ["4"], description: "Count Westbound (South)", color: "bg-red-500", direction: "Westbound", actionKey: "4" },
            { keys: ["5"], description: "Count Northbound (East)", color: "bg-emerald-500", direction: "Northbound", actionKey: "5" },
            { keys: ["6"], description: "Count Southbound (East)", color: "bg-emerald-500", direction: "Southbound", actionKey: "6" },
            { keys: ["7"], description: "Count Northbound (West)", color: "bg-amber-500", direction: "Northbound", actionKey: "7" },
            { keys: ["8"], description: "Count Southbound (West)", color: "bg-amber-500", direction: "Southbound", actionKey: "8" },
            { keys: ["Space"], description: "Play/Pause video", color: "bg-gray-500" },
            { keys: ["←", "→"], description: "Slow down / Speed up", color: "bg-gray-500" },
            { keys: ["?"], description: "Toggle this help", color: "bg-purple-500" },
            { keys: ["R"], description: "Redo an undo", color: "bg-yellow-800" },

        ],
        quickTips: ({ intersectionsSet, canUndo }: QuickTipContext) => [
            { text: "Press number keys 1-8 to count pedestrians." },
            {
                text: intersectionsSet
                    ? "Click on counting shortcuts above to count with mouse."
                    : "Set up intersections first to enable mouse counting.",
            },
            { text: "Use Space bar to play/pause video." },
            { text: `Press Z to undo the last count ${canUndo ? "(or click the undo button above)" : ""}.` },
            { text: "Press ? to toggle this help sidebar." },
            { text: "Use arrow keys ← → to adjust playback speed." },
            { text: "When video ends, you can upload another video to continue counting." },
            { text: "All data from multiple videos will be combined in the export." },
        ],
    },
}
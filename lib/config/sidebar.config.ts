export type VehicleCategory = 'cut_through' | 'parking' | 'driving'
export type VehicleType = 'Car' | 'Moto' | 'Ebike' | 'Truck'
export type SidebarMode = 'vehicle' | 'pedestrian'

export interface ShortcutItem {
    keys: string[]
    description: string
    color: string
    direction?: 'Eastbound' | 'Westbound' | 'Northbound' | 'Southbound' | null
    actionKey?: string
}

export interface QuickTipContext {
    intersectionsSet?: boolean
    canUndo?: boolean
}

export interface QuickTipItem {
    text: string
    link?: { url: string; label: string }
}

export interface SidebarConfig {
    shortcuts: ShortcutItem[]
    quickTips: (context: QuickTipContext) => QuickTipItem[]
}

export const HelpSidebarConfig: Record<SidebarMode, SidebarConfig> = {
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
            { keys: ["Space"], description: "Log Pedestrian", color: "bg-blue-500" },
            { keys: ["C"], description: "Clear Count", color: "bg-red-500" },
        ],
        quickTips: () => [
            { text: "Press Space to quickly tally pedestrians crossing the zone." }
        ]
    }
}
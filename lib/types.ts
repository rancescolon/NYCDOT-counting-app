// lib/types.ts

export type VehicleCategory = 'cut_through' | 'parking' | 'driving'
export type VehicleType = 'Car' | 'Moto' | 'Ebike' | 'Truck'

export interface CountEntry {
    id: string
    timestamp: string
    category: VehicleCategory
    type: VehicleType
    videoIndex: number
    note?: string
}

export interface Point {
    x: number
    y: number
}

export interface Stroke {
    id: string
    points: Point[]
}

export interface VideoMetadata {
    recordingStartTime: Date | null
    strokes: Stroke[]
}

export interface SavedState {
    entries: CountEntry[]
    strokes: Stroke[]
    videoSrc: string | null
    playbackRate: number
    currentTime: number
    duration: number
    lastSaved: number
    videoFileName?: string
    recordingStartTime?: string
    videoCount: number
    currentVideoIndex: number
    videoMetadata: Record<number, VideoMetadata>
}
// lib/types.ts

export type VehicleCategory = 'cut_through' | 'parking' | 'driving'
export type VehicleType = 'Car' | 'Moto' | 'Ebike' | 'Truck'

export interface CountEntry {
    id: string
    timestamp: string
    videoTime: number
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



export type Borough = 'Manhattan' | 'Bronx' | 'Brooklyn' | 'Queens' | 'Staten Island';
export type Team = 'School Safety' | 'Vision Zero' | 'Research' | 'Engineering';
export type StreetType = 'One Way' | 'Two Way';
export type Direction = 'Northbound' | 'Southbound' | 'Eastbound' | 'Westbound';

export type WeatherCondition = 'Sunny' | 'Cloudy' | 'Rainy' | 'Heavy Rain' | 'Snowing';

export interface SpeedStudyFormState {
    streetName: string;
    fromStreet: string;
    toStreet: string;
    borough: Borough;
    observer: string;
    team: Team;
    speedLimit: number;
    streetType: StreetType;
    direction: Direction;
    movingLanes: number;
    parkingLanes: number;
    isTruckRoute: boolean;
    isBusRoute: boolean;
    busLine: string;
    weather: WeatherCondition;
    isSnowing: boolean;
    isRaining: boolean;
    startTimeSlot: string;
    notes: string;
}
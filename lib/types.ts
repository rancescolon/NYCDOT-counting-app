// types.ts
export type VehicleCategory = 'cut_through' | 'parking' | 'driving';
export type VehicleType = 'Car' | 'Moto' | 'Ebike' | 'Truck';

export interface CountEntry {
    id: string; // Unique ID for precise undo operations
    timestamp: string; // e.g., "12:12:53"
    category: VehicleCategory;
    type: VehicleType;
}

export interface Stroke {
    id: string;
    points: { x: number; y: number }[];
}
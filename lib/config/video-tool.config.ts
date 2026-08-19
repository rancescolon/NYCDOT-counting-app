export type IndicatorMode = 'drawing' | 'markers' | 'none'| 'intersections';

export interface VideoToolConfig {
    indicatorMode: IndicatorMode;
    features: {
        playbackControls: boolean;
        speedAdjustment: boolean;
        scrubBar: boolean;
        undoRedo: boolean;
        drawingMode: boolean; // Renamed concept or toggled for drawing overlay
        markers: boolean;
        export: boolean;
        help: boolean;
    };
}

export const intersectionMarkersConfig = {
    intersections: ["North", "East", "South", "West"],
    directions: [
        { key: "1", description: "Count Eastbound (North)", intersection: "North", direction: "Eastbound" },
        { key: "2", description: "Count Westbound (North)", intersection: "North", direction: "Westbound" },
        { key: "3", description: "Count Eastbound (South)", intersection: "South", direction: "Eastbound" },
        { key: "4", description: "Count Westbound (South)", intersection: "South", direction: "Westbound" },
        { key: "5", description: "Count Northbound (East)", intersection: "East", direction: "Northbound" },
        { key: "6", description: "Count Southbound (East)", intersection: "East", direction: "Southbound" },
        { key: "7", description: "Count Northbound (West)", intersection: "West", direction: "Northbound" },
        { key: "8", description: "Count Southbound (West)", intersection: "West", direction: "Southbound" }
    ]
};


export const videoToolConfigs: Record<string, VideoToolConfig> = {
    curbCuts: {
        indicatorMode: 'drawing', // Using the renamed drawing indicator mode
        features: {
            playbackControls: true,
            speedAdjustment: true,
            scrubBar: true,
            undoRedo: true,
            drawingMode: true,
            markers: false,
            export: true,
            help: true,
        },
    },
    // Example for a future page that uses markers or no drawing overlay at all
    speedStudy: {
        indicatorMode: 'markers',
        features: {
            playbackControls: true,
            speedAdjustment: true,
            scrubBar: true,
            undoRedo: false,
            drawingMode: false,
            markers: true,
            export: true,
            help: false,
        },
    },
    minimalPlayer: {
        indicatorMode: 'none',
        features: {
            playbackControls: true,
            speedAdjustment: false,
            scrubBar: true,
            undoRedo: false,
            drawingMode: false,
            markers: false,
            export: false,
            help: false,
        },
    },

    pedestrian: {
        indicatorMode: 'intersections',
        features: {
            playbackControls: true,
            speedAdjustment: true,
            scrubBar: true,
            undoRedo: true,
            drawingMode: false,
            markers: true,
            export: true,
            help: true,
        },
    }

};
export type IndicatorMode = 'drawing' | 'markers' | 'none';

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
    }
};
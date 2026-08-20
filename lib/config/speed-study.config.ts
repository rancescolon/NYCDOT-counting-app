export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const DAY_NAMES: Record<DayOfWeek, string> = {
    0: 'Sunday',
    1: 'Monday',
    2: 'Tuesday',
    3: 'Wednesday',
    4: 'Thursday',
    5: 'Friday',
    6: 'Saturday',
};

export interface TimeWindow {
    startHour: number; // 0-23
    startMinute: number;
    endHour: number;
    endMinute: number;
}

export type WeatherMode = 'allowed_only' | 'forbidden' | 'any';

export interface WeatherRestriction {
    mode: WeatherMode;
    weatherTypes: string[]; // Options: 'Sunny', 'Cloudy', 'Rainy', 'Heavy Rain', 'Snowing'
    description: string;
}

export interface TeamRuleConfig {
    timeWindow?: TimeWindow;
    timeDescription?: string;
    allowedDays?: DayOfWeek[];
    daysDescription?: string;
    weatherRestriction?: WeatherRestriction;
}


export const OBSERVERS_BY_TEAM: Record<string, string[]> = {
    'School Safety': ['R. Colon', 'F. Castro','N. Carey', 'R. Gomez', 'K. Graham','E. Lunyova', 'N. Adler', 'I. Smith', 'M. Ussery'], // Nick/Elena team
    'Vision Zero': ['J. Smith'],
    'Research': ['J. Adams', 'V. Berliner', 'T. Dorsett', 'A. Rashidov', 'D. Willoughby','F. Adman' ], //John Adams Team
    'Engineering': ['E. Davis', 'K. Wilson'],
};

export const TEAMS = Object.keys(OBSERVERS_BY_TEAM);


export const TEAM_RULES: Record<string, TeamRuleConfig> = {
    
    // Key: Team identifier (matches Team type: 'School Safety' | 'Vision Zero' | 'Research' | 'Engineering')
    'School Safety': {

        /**
         * TIME WINDOW RESTRICTIONS
         * Defines the allowed daily operating hours for conducting a study.
         */
        timeWindow: {
            // Start time in 24-hour format
            startHour: 10,

            // Start minute (0 - 59)
            startMinute: 0,

            // End time in 24-hour format
            endHour: 14,

            // End minute (0 - 59)
            endMinute: 0,
        },

        /**
         * Explanation of the time restriction.
         * Displayed on UI warning banners/tooltips when the study is scheduled outside the allowed window.
         */
        timeDescription: 'School Safety study hours are 10:00 AM – 2:00 PM.',

        /**
         * ALLOWED DAYS OF THE WEEK
         * Array of day indexes based on JavaScript's Date.getDay() format
         */
        allowedDays: [1, 2, 3, 4, 5],

        /**
         * Explanation of the permitted days.
         * Displayed when the selected date falls on a restricted day (e.g., weekend).
         */
        daysDescription: 'School Safety studies are only permitted Monday through Friday.',

        /**
         * WEATHER RESTRICTIONS
         * Defines rules regarding acceptable weather conditions for data collection.
         */
        weatherRestriction: {
            /**
             * Evaluation mode:
             * - 'forbidden': The conditions listed in `weatherTypes` are DISALLOWED. (All other weather is valid)
             * - 'allowed': ONLY the conditions listed in `weatherTypes` are PERMITTED. (All unlisted weather is invalid)
             * - 'any' : Disables weather validation completely (allows all weather types).
             */
            mode: 'forbidden',

            /**
             * List of weather condition labels to evaluate against.
             * Values must match the `WeatherCondition` type:
             * 'Sunny' | 'Cloudy' | 'Rainy' | 'Heavy Rain' | 'Snowing'
             */
            weatherTypes: ['Heavy Rain', 'Snowing'],

            /**
             * User-facing error message displayed when the chosen weather violates the restriction rule.
             */
            description: 'Speed studies cannot be performed during Heavy Rain or Snow.',
        },
    },
    
    'Research': { // fill out for johns team
        allowedDays: [0, 1, 2, 3, 4, 5, 6], // Allowed any day
        weatherRestriction: {
            mode: 'any',
            weatherTypes: [],
            description: 'Allowed in any weather.',
        },
    },

    'Vision Zero': {
        allowedDays: [1, 2, 3, 4, 5],
        daysDescription: 'Research studies are conducted Monday through Friday.',

        weatherRestriction: {
            mode: 'allowed_only',
            weatherTypes: ['Rainy', 'Heavy Rain'],
            description: 'This research study requires wet weather conditions (Rainy or Heavy Rain only).',
        },
    },
    'Engineering': {
        allowedDays: [1, 2, 3, 4, 5],
        daysDescription: 'Engineering studies are conducted Monday through Friday.',
        weatherRestriction: {
            mode: 'forbidden',
            weatherTypes: ['Heavy Rain', 'Snowing'],
            description: 'Engineering speed studies cannot be performed during Heavy Rain or Snow.',
        },
    },
};

/**
 * Validates if the current time fits the team's allowed hours
 */
export function isTimeAllowed(team: string, date: Date = new Date()): boolean {
    const rule = TEAM_RULES[team];
    if (!rule || !rule.timeWindow) return true;

    const currentMinutes = date.getHours() * 60 + date.getMinutes();
    const startMinutes = rule.timeWindow.startHour * 60 + rule.timeWindow.startMinute;
    const endMinutes = rule.timeWindow.endHour * 60 + rule.timeWindow.endMinute;

    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

/**
 * Validates if the current day of the week is allowed for the team
 */
export function isDayAllowed(team: string, date: Date = new Date()): boolean {
    const rule = TEAM_RULES[team];
    if (!rule || !rule.allowedDays || rule.allowedDays.length === 0) return true;

    const currentDay = date.getDay() as DayOfWeek;
    return rule.allowedDays.includes(currentDay);
}

/**
 * Validates weather restrictions (supports both required and forbidden modes)
 */
export function isWeatherAllowed(team: string, selectedWeather: string): boolean {
    const rule = TEAM_RULES[team];
    if (!rule || !rule.weatherRestriction) return true;

    const { mode, weatherTypes } = rule.weatherRestriction;

    if (mode === 'any') return true;
    if (mode === 'allowed_only') {
        return weatherTypes.includes(selectedWeather);
    }
    if (mode === 'forbidden') {
        return !weatherTypes.includes(selectedWeather);
    }
    return true;
}
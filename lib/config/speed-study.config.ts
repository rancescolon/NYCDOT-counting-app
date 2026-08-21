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
    weatherTypes: string[];
    description: string;
}

export interface CardVisibilityConfig {
    streetInfo?: boolean;
    roadInfo?: boolean;
    weatherInfo?: boolean;
    timingInfo?: boolean;
    notes?: boolean;
    reminderCard?: boolean;
}

export interface TeamRuleConfig {
    timeWindows?: TimeWindow[];
    timeDescription?: string;
    allowedDays?: DayOfWeek[];
    daysDescription?: string;
    weatherRestriction?: WeatherRestriction;

    // Configurable Form Fields
    showSpeedLimit?: boolean;
    showStreetType?: boolean;
    showDirection?: boolean;

    // Card Visibility Configuration
    cards?: CardVisibilityConfig;

    // Active View Layout Route Target
    activePage?: 'default' | 'bike_lanes';
}

export const OBSERVERS_BY_TEAM: Record<string, string[]> = {
    'School Safety': ['R. Colon', 'F. Castro', 'N. Carey', 'R. Gomez', 'K. Graham', 'E. Lunyova', 'N. Adler', 'I. Smith', 'M. Ussery', 'A. Archer', 'M. Oliver', 'T. Wilkins'],
    'Research': ['J. Adams', 'V. Berliner', 'T. Dorsett', 'A. Rashidov', 'D. Willoughby', 'F. Adman'],
    'Vision Zero': ['J. Smith', 'A. Lopez'],
    'Engineering': ['E. Davis', 'K. Wilson'],
    'Micromobility': ['R. Leighton', 'R. Viola'],
};

export const TEAMS = Object.keys(OBSERVERS_BY_TEAM);

export const TEAM_RULES: Record<string, TeamRuleConfig> = {
    'School Safety': {
        timeWindows: [
            { startHour: 10, startMinute: 0, endHour: 14, endMinute: 0 }
        ],
        timeDescription: 'School Safety study hours are 10:00 AM – 2:00 PM.',
        allowedDays: [1, 2, 3, 4, 5],
        daysDescription: 'School Safety studies are only permitted Monday through Friday.',
        showSpeedLimit: true,
        showStreetType: true,
        showDirection: true,
        cards: {
            streetInfo: true,
            roadInfo: true,
            weatherInfo: true,
            timingInfo: true,
            notes: true,
            reminderCard: true,
        },
        activePage: 'default',
        weatherRestriction: {
            mode: 'forbidden',
            weatherTypes: ['Heavy Rain', 'Snowing'],
            description: 'Speed studies cannot be performed during Heavy Rain or Snow.',
        },
    },

    'Research': {
        allowedDays: [0, 1, 2, 3, 4, 5, 6],
        showSpeedLimit: true,
        showStreetType: true,
        showDirection: true,
        cards: {
            streetInfo: true,
            roadInfo: true,
            weatherInfo: true,
            timingInfo: true,
            notes: true,
            reminderCard: true,
        },
        activePage: 'default',
        weatherRestriction: {
            mode: 'any',
            weatherTypes: [],
            description: 'Allowed in any weather.',
        },
    },

    'Vision Zero': {
        timeWindows: [
            { startHour: 7, startMinute: 30, endHour: 9, endMinute: 30 },
            { startHour: 16, startMinute: 0, endHour: 18, endMinute: 0 }
        ],
        timeDescription: 'Vision Zero studies are allowed 7:30 AM – 9:30 AM and 4:00 PM – 6:00 PM.',
        allowedDays: [1, 2, 3, 4, 5],
        daysDescription: 'Vision Zero studies are conducted Monday through Friday.',
        showSpeedLimit: true,
        showStreetType: false,
        showDirection: true,
        cards: {
            streetInfo: true,
            roadInfo: true,
            weatherInfo: true,
            timingInfo: true,
            notes: true,
            reminderCard: true,
        },
        activePage: 'default',
        weatherRestriction: {
            mode: 'allowed_only',
            weatherTypes: ['Rainy', 'Heavy Rain'],
            description: 'This research study requires wet weather conditions (Rainy or Heavy Rain only).',
        },
    },

    'Engineering': {
        allowedDays: [1, 2, 3, 4, 5],
        daysDescription: 'Engineering studies are conducted Monday through Friday.',
        showSpeedLimit: true,
        showStreetType: true,
        showDirection: true,
        cards: {
            streetInfo: true,
            roadInfo: true,
            weatherInfo: true,
            timingInfo: true,
            notes: true,
            reminderCard: true,
        },
        activePage: 'default',
        weatherRestriction: {
            mode: 'forbidden',
            weatherTypes: ['Heavy Rain', 'Snowing'],
            description: 'Engineering speed studies cannot be performed during Heavy Rain or Snow.',
        },
    },

    'Micromobility': {
        timeWindows: [
            { startHour: 12, startMinute: 0, endHour: 13, endMinute: 45 }, // update EOD
            { startHour: 17, startMinute: 0, endHour: 18, endMinute: 45 }
        ],
        timeDescription: 'Micromobility studies are only allowed from Noon - 1 PM and 5:00 PM - 6 PM.',
        allowedDays: [1, 2, 3, 4, 5],
        daysDescription: 'Studies are conducted Monday through Friday.',
        showSpeedLimit: false,
        showStreetType: false,
        showDirection: true,
        cards: {
            streetInfo: true,
            roadInfo: false,
            weatherInfo: true,
            timingInfo: true,
            notes: true,
            reminderCard: false,
        },
        activePage: 'bike_lanes',
        weatherRestriction: {
            mode: 'allowed_only',
            weatherTypes: ['Sunny', 'Cloudy'],
            description: 'This study can only be done when it is Sunny or Cloudy.',
        },
    },
};

/**
 * Validates if current time fits into ANY of the team's allowed disjoint time windows
 */
export function isTimeAllowed(team: string, date: Date = new Date()): boolean {
    const rule = TEAM_RULES[team];
    if (!rule || !rule.timeWindows || rule.timeWindows.length === 0) return true;

    const currentMinutes = date.getHours() * 60 + date.getMinutes();

    return rule.timeWindows.some((window) => {
        const startMinutes = window.startHour * 60 + window.startMinute;
        const endMinutes = window.endHour * 60 + window.endMinute;
        return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    });
}

/**
 * Validates if current day of week is allowed for team
 */
export function isDayAllowed(team: string, date: Date = new Date()): boolean {
    const rule = TEAM_RULES[team];
    if (!rule || !rule.allowedDays || rule.allowedDays.length === 0) return true;

    const currentDay = date.getDay() as DayOfWeek;
    return rule.allowedDays.includes(currentDay);
}

/**
 * Validates weather restrictions
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
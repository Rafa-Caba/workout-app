// src/types/cardio.types.ts

/**
 * Cardio module types.
 *
 * Web manual module today:
 * - create / edit / delete Cardio sessions
 * - read Cardio sessions from WorkoutDay.training.sessions
 *
 * Cardio supports walking/running across indoor and outdoor environments.
 * The form uses user-friendly duration and pace strings, while API payloads
 * continue using the canonical values in seconds.
 */

import type {
    WorkoutActivityType,
    WorkoutCardioActivityType,
    WorkoutCardioEnvironment,
    WorkoutSession,
} from "@/types/workoutDay.types";

export type CardioSupportedActivityType = Extract<
    WorkoutActivityType,
    "walking" | "running"
>;

export type CardioSupportedEnvironment = Exclude<WorkoutCardioEnvironment, null>;

export type CardioFormMode = "create" | "edit";

export type CardioEnvironmentFilter = "all" | CardioSupportedEnvironment;
export type CardioActivityFilter = "all" | WorkoutCardioActivityType;

export type CardioFormValues = {
    activityType: CardioSupportedActivityType;
    cardioEnvironment: CardioSupportedEnvironment;

    startTime: string;
    endTime: string;

    /** Masked right-to-left as ss, mm:ss, or h:mm:ss. */
    durationText: string;

    activeKcal: string;
    totalKcal: string;

    avgHr: string;
    maxHr: string;

    distanceKm: string;
    steps: string;
    elevationGainM: string;

    /** Masked as Apple-style mm'ss" per kilometre. */
    paceText: string;
    cadenceRpm: string;

    avgSpeedKmh: string;
    maxSpeedKmh: string;
    strideLengthM: string;

    hasRoute: boolean;
    routePointCount: string;

    sourceDevice: string;
    notes: string;
};

export type CardioSessionListItem = WorkoutSession;

export type CardioDayStats = {
    sessionsCount: number;
    indoorSessions: number;
    outdoorSessions: number;
    walkingSessions: number;
    runningSessions: number;
    totalDurationSeconds: number | null;
    totalDistanceKm: number | null;
    totalSteps: number | null;
    totalActiveKcal: number | null;
};

export type CardioRangeSummary = {
    totalSessions: number;
    totalDurationSeconds: number | null;
    totalDistanceKm: number | null;
    totalSteps: number | null;
    totalActiveKcal: number | null;
    indoorSessions: number;
    outdoorSessions: number;
    walkingSessions: number;
    runningSessions: number;
};

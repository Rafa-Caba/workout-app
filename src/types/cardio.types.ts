// src/types/cardio.types.ts

/**
 * Cardio module types.
 *
 * Web manual module today:
 * - create / edit / delete Cardio sessions
 * - read Cardio sessions from WorkoutDay.training.sessions
 *
 * Cardio now supports walking/running across indoor and outdoor environments.
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

    durationSeconds: string;

    activeKcal: string;
    totalKcal: string;

    avgHr: string;
    maxHr: string;

    distanceKm: string;
    steps: string;
    elevationGainM: string;

    paceSecPerKm: string;
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

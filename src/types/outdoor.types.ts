// src/types/outdoor.types.ts

/**
 * Outdoor module types
 *
 * Web manual module today:
 * - create / edit / delete outdoor sessions
 * - read outdoor sessions from WorkoutDay.training.sessions
 *
 * Future-ready:
 * - progression
 * - range filters
 * - outdoor-specific summaries / rollups
 */

import type { WorkoutActivityType, WorkoutSession } from "@/types/workoutDay.types";

export type OutdoorSupportedActivityType = Extract<
    WorkoutActivityType,
    "walking" | "running"
>;

export type OutdoorFormMode = "create" | "edit";

export type OutdoorFormValues = {
    activityType: OutdoorSupportedActivityType;

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

export type OutdoorSessionListItem = WorkoutSession;

export type OutdoorDayStats = {
    sessionsCount: number;
    totalDurationSeconds: number | null;
    totalDistanceKm: number | null;
    totalSteps: number | null;
    totalActiveKcal: number | null;
};

export type OutdoorRangeSummary = {
    totalSessions: number;
    totalDurationSeconds: number | null;
    totalDistanceKm: number | null;
    totalSteps: number | null;
    totalActiveKcal: number | null;
    walkingSessions: number;
    runningSessions: number;
};
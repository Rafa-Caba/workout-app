// src/types/gymCheck.types.ts

import type { WorkoutExerciseSet } from "@/types/workoutDay.types";

export type GymExerciseState = {
    done: boolean;
    notes?: string;
    durationMin?: string;
    mediaPublicIds?: string[];
    performedSets?: WorkoutExerciseSet[];
};

export type GymDayMetricsState = {
    startAt?: string;
    endAt?: string;

    activeKcal?: string;
    totalKcal?: string;

    avgHr?: string;
    maxHr?: string;

    distanceKm?: string;
    steps?: string;
    elevationGainM?: string;

    paceSecPerKm?: string;
    cadenceRpm?: string;

    effortRpe?: string;

    trainingSource?: string;
    dayEffortRpe?: string;
};

export type GymDayState = {
    durationMin: string;
    notes: string;
    metrics?: GymDayMetricsState;
    exercises: Record<string, GymExerciseState>;
};

export type GymCheckExercisePatch = {
    done?: boolean | null;
    notes?: string | null;
    durationMin?: number | null;
    mediaPublicIds?: string[] | null;
    performedSets?: WorkoutExerciseSet[] | null;
};

export type GymCheckMetricsPatch = {
    startAt?: string | null;
    endAt?: string | null;

    activeKcal?: number | null;
    totalKcal?: number | null;

    avgHr?: number | null;
    maxHr?: number | null;

    distanceKm?: number | null;
    steps?: number | null;
    elevationGainM?: number | null;

    paceSecPerKm?: number | null;
    cadenceRpm?: number | null;

    effortRpe?: number | null;

    trainingSource?: string | null;
    dayEffortRpe?: number | null;
};

export type GymCheckDayPatchBody = {
    durationMin?: number | null;
    notes?: string | null;
    metrics?: GymCheckMetricsPatch | null;
    exercises?: Record<string, GymCheckExercisePatch> | null;
};
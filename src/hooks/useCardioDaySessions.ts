// src/hooks/useCardioDaySessions.ts

/**
 * Cardio day sessions hook.
 * Reads the canonical WorkoutDay and extracts walking/running sessions
 * for the selected date, regardless of indoor/outdoor environment.
 */

import React from "react";

import type { ApiError } from "@/api/httpErrors";
import { useWorkoutDay } from "@/hooks/useWorkoutDay";
import { getCardioSessionsFromDay } from "@/services/workout/cardio.service";
import type { WorkoutDay, WorkoutSession } from "@/types/workoutDay.types";

export type CardioDaySessionsResult = {
    day: WorkoutDay | null;
    sessions: WorkoutSession[];
    isLoading: boolean;
    isFetching: boolean;
    isError: boolean;
    error: ApiError | null;
    refetch: () => Promise<unknown>;
};

export function useCardioDaySessions(date: string | null): CardioDaySessionsResult {
    const query = useWorkoutDay(date, Boolean(date));

    const sessions = React.useMemo(() => {
        return getCardioSessionsFromDay(query.data ?? null);
    }, [query.data]);

    return {
        day: query.data ?? null,
        sessions,
        isLoading: query.isLoading,
        isFetching: query.isFetching,
        isError: query.isError,
        error: query.error ?? null,
        refetch: async () => query.refetch(),
    };
}

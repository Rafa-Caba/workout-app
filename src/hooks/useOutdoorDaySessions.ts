// src/hooks/useOutdoorDaySessions.ts

/**
 * Outdoor day sessions hook
 *
 * Reads the canonical WorkoutDay and extracts only outdoor sessions
 * (walking / running) for the selected date.
 */

import React from "react";

import type { ApiError } from "@/api/httpErrors";
import { useWorkoutDay } from "@/hooks/useWorkoutDay";
import { getOutdoorSessionsFromDay } from "@/services/workout/outdoor.service";
import type { WorkoutDay, WorkoutSession } from "@/types/workoutDay.types";

export type OutdoorDaySessionsResult = {
    day: WorkoutDay | null;
    sessions: WorkoutSession[];
    isLoading: boolean;
    isFetching: boolean;
    isError: boolean;
    error: ApiError | null;
    refetch: () => Promise<unknown>;
};

export function useOutdoorDaySessions(date: string | null): OutdoorDaySessionsResult {
    const query = useWorkoutDay(date, Boolean(date));

    const sessions = React.useMemo(() => {
        return getOutdoorSessionsFromDay(query.data ?? null);
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
// src/hooks/useRoutineWeek.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ApiError } from "@/api/httpErrors";

import {
    getRoutineWeek,
    initRoutineWeek,
    updateRoutineWeek,
    setRoutineArchived,
    listRoutineWeeks,
} from "@/services/workout/routines.service";

import type {
    WorkoutRoutineStatus,
    WorkoutRoutineWeek,
    WorkoutRoutineWeekSummary,
} from "@/types/workoutRoutine.types";

export function useRoutineWeek(weekKey: string) {
    return useQuery<WorkoutRoutineWeek | null, ApiError>({
        queryKey: ["routineWeek", weekKey],
        queryFn: () => getRoutineWeek(weekKey),
        enabled: Boolean(weekKey),
        staleTime: 30_000,
    });
}

export function useInitRoutineWeek(weekKey: string) {
    const qc = useQueryClient();

    return useMutation<
        WorkoutRoutineWeek,
        ApiError,
        { title?: string; split?: string; unarchive?: boolean } | undefined
    >({
        mutationFn: (args) => initRoutineWeek(weekKey, args),
        onSuccess: (data) => {
            qc.setQueryData(["routineWeek", weekKey], data);
            qc.invalidateQueries({ queryKey: ["routineWeek", weekKey] });
            qc.invalidateQueries({ queryKey: ["planVsActual", weekKey] });
        },
    });
}

export function useUpdateRoutineWeek(weekKey: string) {
    const qc = useQueryClient();

    return useMutation<WorkoutRoutineWeek, ApiError, unknown>({
        mutationFn: (payload) => updateRoutineWeek(weekKey, payload),
        onSuccess: (data) => {
            qc.setQueryData(["routineWeek", weekKey], data);
            qc.invalidateQueries({ queryKey: ["routineWeek", weekKey] });
            qc.invalidateQueries({ queryKey: ["planVsActual", weekKey] });
        },
    });
}

export function useSetRoutineArchived(weekKey: string) {
    const qc = useQueryClient();

    return useMutation<WorkoutRoutineWeek, ApiError, { archived: boolean }>({
        mutationFn: ({ archived }) => setRoutineArchived(weekKey, archived),
        onSuccess: (data) => {
            qc.setQueryData(["routineWeek", weekKey], data);
            qc.invalidateQueries({ queryKey: ["routineWeek", weekKey] });
            qc.invalidateQueries({ queryKey: ["planVsActual", weekKey] });
        },
    });
}

export function useRoutineWeeksList(status: WorkoutRoutineStatus) {
    return useQuery<WorkoutRoutineWeekSummary[], ApiError>({
        queryKey: ["routineWeeksList", status],
        queryFn: () => listRoutineWeeks(status),
        staleTime: 30_000,
    });
}

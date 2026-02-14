import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ApiError } from "@/api/httpErrors";
import {
    getRoutineWeek,
    initRoutineWeek,
    updateRoutineWeek,
    setRoutineArchived,
    type RoutineWeek,
} from "@/services/workout/routines.service";

export function useRoutineWeek(weekKey: string) {
    return useQuery<RoutineWeek | null, ApiError>({
        queryKey: ["routineWeek", weekKey],
        queryFn: () => getRoutineWeek(weekKey),
        enabled: Boolean(weekKey),
        staleTime: 30_000,
    });
}

export function useInitRoutineWeek(weekKey: string) {
    const qc = useQueryClient();
    return useMutation<RoutineWeek, ApiError, { title?: string; split?: string; unarchive?: boolean } | undefined>({
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
    return useMutation<RoutineWeek, ApiError, unknown>({
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
    return useMutation<RoutineWeek, ApiError, { archived: boolean }>({
        mutationFn: ({ archived }) => setRoutineArchived(weekKey, archived),
        onSuccess: (data) => {
            qc.setQueryData(["routineWeek", weekKey], data);
            qc.invalidateQueries({ queryKey: ["routineWeek", weekKey] });
            qc.invalidateQueries({ queryKey: ["planVsActual", weekKey] });
        },
    });
}

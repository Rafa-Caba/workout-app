import { useQuery } from "@tanstack/react-query";
import type { ApiError } from "@/api/httpErrors";
import { getDaySummary } from "@/services/workout/days.service";
import type { DaySummary } from "@/types/workout.types";

export function useDaySummary(date: string) {
    return useQuery<DaySummary, ApiError>({
        queryKey: ["daySummary", date],
        queryFn: () => getDaySummary(date),
        enabled: Boolean(date),
        staleTime: 30_000,
    });
}

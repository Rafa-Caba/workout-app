import { useQuery } from "@tanstack/react-query";
import type { ApiError } from "@/api/httpErrors";
import { getWeekSummary } from "@/services/workout/weeks.service";
import { WeekSummaryResponse } from "@/types/workoutSummary.types";

export function useWeekSummary(weekKey: string) {
    return useQuery<WeekSummaryResponse, ApiError>({
        queryKey: ["weekSummary", weekKey],
        queryFn: () => getWeekSummary(weekKey),
        enabled: Boolean(weekKey),
        staleTime: 30_000,
    });
}

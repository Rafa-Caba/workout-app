import { useQuery } from "@tanstack/react-query";
import type { ApiError } from "@/api/httpErrors";
import { getWeeklyTrends } from "@/services/workout/trends.service";
import type { WeeksTrendResponse, WeekKey } from "@/types/workoutSummary.types";

export function useWeeklyTrends(fromWeek: WeekKey | "", toWeek: WeekKey | "") {
    return useQuery<WeeksTrendResponse, ApiError>({
        queryKey: ["weeklyTrends", fromWeek, toWeek],
        queryFn: () => getWeeklyTrends(fromWeek as WeekKey, toWeek as WeekKey),
        enabled: Boolean(fromWeek) && Boolean(toWeek),
        staleTime: 30_000,
    });
}

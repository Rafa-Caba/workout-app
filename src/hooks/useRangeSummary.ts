import { useQuery } from "@tanstack/react-query";
import type { ApiError } from "@/api/httpErrors";
import { getRangeSummary } from "@/services/workout/weeks.service";
import { RangeSummaryResponse } from "@/types/workoutSummary.types";

export function useRangeSummary(from: string, to: string) {
    return useQuery<RangeSummaryResponse, ApiError>({
        queryKey: ["rangeSummary", from, to],
        queryFn: () => getRangeSummary(from, to),
        enabled: Boolean(from) && Boolean(to),
        staleTime: 30_000,
    });
}

// src/hooks/useLatestBodyMetric.ts

import { useQuery } from "@tanstack/react-query";
import type { ApiError } from "@/api/httpErrors";
import { getMyLatestBodyMetric } from "@/services/bodyMetrics.service";
import type { UserMetricLatestResponse } from "@/types/bodyMetrics.types";

export function useLatestBodyMetric() {
    return useQuery<UserMetricLatestResponse, ApiError>({
        queryKey: ["bodyMetrics", "latest"],
        queryFn: getMyLatestBodyMetric,
        staleTime: 30_000,
    });
}
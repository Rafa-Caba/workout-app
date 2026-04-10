// src/hooks/useBodyMetrics.ts

import { useQuery } from "@tanstack/react-query";
import type { ApiError } from "@/api/httpErrors";
import { getMyBodyMetrics } from "@/services/bodyMetrics.service";
import type {
    UserMetricListQuery,
    UserMetricListResponse,
} from "@/types/bodyMetrics.types";

export function useBodyMetrics(query: UserMetricListQuery = {}) {
    return useQuery<UserMetricListResponse, ApiError>({
        queryKey: ["bodyMetrics", "list", query.from ?? null, query.to ?? null],
        queryFn: () => getMyBodyMetrics(query),
        staleTime: 30_000,
    });
}
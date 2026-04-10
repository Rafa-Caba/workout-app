// src/hooks/useUpsertBodyMetric.ts

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ApiError } from "@/api/httpErrors";
import { upsertMyBodyMetricByDate } from "@/services/bodyMetrics.service";
import { useUserStore } from "@/state/user.store";
import type {
    UpsertUserMetricRequest,
    UserMetricEntry,
} from "@/types/bodyMetrics.types";

export function useUpsertBodyMetric() {
    const qc = useQueryClient();

    return useMutation<
        UserMetricEntry,
        ApiError,
        { date: string; payload: UpsertUserMetricRequest }
    >({
        mutationFn: ({ date, payload }) => upsertMyBodyMetricByDate(date, payload),
        onSuccess: async () => {
            await Promise.allSettled([
                qc.invalidateQueries({ queryKey: ["bodyMetrics"] }),
                qc.invalidateQueries({ queryKey: ["bodyProgress"] }),
                qc.invalidateQueries({ queryKey: ["workoutProgressOverview"] }),
            ]);

            await useUserStore.getState().fetchMe();
        },
    });
}
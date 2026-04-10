// src/hooks/useDeleteBodyMetric.ts

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ApiError } from "@/api/httpErrors";
import { deleteMyBodyMetricByDate } from "@/services/bodyMetrics.service";
import { useUserStore } from "@/state/user.store";

export function useDeleteBodyMetric() {
    const qc = useQueryClient();

    return useMutation<
        { ok: true },
        ApiError,
        { date: string }
    >({
        mutationFn: ({ date }) => deleteMyBodyMetricByDate(date),
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
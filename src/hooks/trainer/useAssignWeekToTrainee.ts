import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ApiError } from "@/api/httpErrors";
import type { WeekKey } from "@/types/workoutDay.types";
import type { WeeklyAssignBody, WeeklyAssignResponse } from "@/types/trainer.types";
import { assignWeekToTrainee } from "@/services/workout/trainer.service";

export function useAssignWeekToTrainee() {
    const qc = useQueryClient();

    return useMutation<
        WeeklyAssignResponse,
        ApiError,
        { traineeId: string; weekKey: WeekKey; body: WeeklyAssignBody }
    >({
        mutationFn: ({ traineeId, weekKey, body }) => assignWeekToTrainee(traineeId, weekKey, body),
        onSuccess: (_data, vars) => {
            // Invalidate week summary and any related views.
            qc.invalidateQueries({ queryKey: ["trainer", "weekSummary", vars.traineeId, vars.weekKey] });
            qc.invalidateQueries({ queryKey: ["trainer", "recovery", vars.traineeId] });
            qc.invalidateQueries({ queryKey: ["trainer", "day", vars.traineeId] });
        },
    });
}
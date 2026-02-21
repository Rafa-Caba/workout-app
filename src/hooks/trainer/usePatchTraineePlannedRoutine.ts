import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ApiError } from "@/api/httpErrors";
import type { ISODate, WeekKey } from "@/types/workoutDay.types";
import type { PatchPlannedRoutineBody, PatchPlannedRoutineResponse } from "@/types/trainer.types";
import { patchTraineePlannedRoutine } from "@/services/workout/trainer.service";

export function usePatchTraineePlannedRoutine() {
    const qc = useQueryClient();

    return useMutation<
        PatchPlannedRoutineResponse,
        ApiError,
        { traineeId: string; date: ISODate; body: PatchPlannedRoutineBody; weekKey?: WeekKey }
    >({
        mutationFn: ({ traineeId, date, body }) => patchTraineePlannedRoutine(traineeId, date, body),
        onSuccess: (_data, vars) => {
            // Refresh day + recovery; week summary may also change depending on BE rollups.
            qc.invalidateQueries({ queryKey: ["trainer", "day", vars.traineeId, vars.date] });
            qc.invalidateQueries({ queryKey: ["trainer", "recovery", vars.traineeId] });

            if (vars.weekKey) {
                qc.invalidateQueries({ queryKey: ["trainer", "weekSummary", vars.traineeId, vars.weekKey] });
            } else {
                qc.invalidateQueries({ queryKey: ["trainer", "weekSummary", vars.traineeId] });
            }
        },
    });
}
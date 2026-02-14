import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ApiError } from "@/api/httpErrors";
import type { SleepBlock, WorkoutDay } from "@/types/workoutDay.types";
import { updateSleepForDay } from "@/services/workout/days.service";

export function useUpdateSleep() {
    const qc = useQueryClient();

    return useMutation<WorkoutDay, ApiError, { date: string; sleep: Partial<SleepBlock> | null }>({
        mutationFn: (args) => updateSleepForDay(args.date, args.sleep, "merge"),
        onSuccess: (day, vars) => {
            qc.setQueryData(["workoutDay", vars.date], day);
            // Optional: if you have calendar/week queries, you can invalidate them here.
            // qc.invalidateQueries({ queryKey: ["calendar"] });
            // qc.invalidateQueries({ queryKey: ["weekView"] });
        },
    });
}

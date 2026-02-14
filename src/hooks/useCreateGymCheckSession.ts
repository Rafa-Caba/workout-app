import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ApiError } from "@/api/httpErrors";
import type { DayKey } from "@/utils/routines/plan";
import { createWorkoutSessionForDay } from "@/services/workout/daySessions.service";
import { buildGymCheckSessionFromRoutine } from "@/utils/gymCheck/buildGymCheckSession";

export function useCreateGymCheckSession() {
    const qc = useQueryClient();

    return useMutation<
        unknown,
        ApiError,
        { date: string; routine: unknown; weekKey: string; dayKey: DayKey }
    >({
        mutationFn: async ({ date, routine, weekKey, dayKey }) => {
            const built = buildGymCheckSessionFromRoutine({
                routine,
                weekKey,
                dayKey,
                includeOnlyDone: true,
            });

            if (!built.ok) {
                const err = new Error(built.reason) as any;
                err.status = 400;
                throw err;
            }

            return createWorkoutSessionForDay(date, built.body);
        },
        onSuccess: async (_data, vars) => {
            // refresh Days + DaySummary views
            await Promise.allSettled([
                qc.invalidateQueries({ queryKey: ["workoutDay", vars.date] }),
                qc.invalidateQueries({ queryKey: ["daySummary", vars.date] }),

                // refresh PVA for that week
                qc.invalidateQueries({ queryKey: ["planVsActual", vars.weekKey] }),
            ]);
        },
    });
}

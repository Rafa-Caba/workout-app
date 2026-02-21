import { useQuery } from "@tanstack/react-query";
import type { ApiError } from "@/api/httpErrors";

import type { WeekViewResponse, WeekKey } from "@/types/workoutDay.types";
import {
    getWorkoutWeekView,
    defaultTraineeWeekViewParams,
    type GetWorkoutWeekArgs,
} from "@/services/workout/workoutWeek.service";

export function useWorkoutWeekView(weekKey: WeekKey | null | undefined, args?: Partial<GetWorkoutWeekArgs>) {
    const enabled = Boolean(weekKey);

    return useQuery<WeekViewResponse, ApiError>({
        queryKey: ["workoutWeekView", weekKey, args ?? null],
        queryFn: () => {
            const wk = String(weekKey);
            const base = defaultTraineeWeekViewParams(wk as WeekKey);
            return getWorkoutWeekView({ ...base, ...(args ?? {}), weekKey: wk as WeekKey });
        },
        enabled,
        staleTime: 30_000,
    });
}
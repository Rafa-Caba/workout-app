// src/hooks/useWorkoutCalendar.ts
// React Query wrapper for a WorkoutDay calendar range.

import { useQuery } from "@tanstack/react-query";

import type { ApiError } from "@/api/httpErrors";
import {
    getWorkoutCalendar,
    type GetWorkoutCalendarArgs,
} from "@/services/workout/calendar.service";
import type { CalendarViewResponse } from "@/types/workoutDay.types";

export function useWorkoutCalendar(args: GetWorkoutCalendarArgs) {
    return useQuery<CalendarViewResponse, ApiError>({
        queryKey: ["workoutCalendar", args],
        queryFn: () => getWorkoutCalendar(args),
        enabled: Boolean(args.from && args.to),
        staleTime: 30_000,
    });
}

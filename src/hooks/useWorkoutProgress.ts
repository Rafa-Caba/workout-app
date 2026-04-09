// src/hooks/useWorkoutProgress.ts
import { useQuery } from "@tanstack/react-query";
import type { ApiError } from "@/api/httpErrors";
import { getWorkoutProgressOverview } from "@/services/workout/progress.service";
import type {
    WorkoutProgressCompareTo,
    WorkoutProgressMode,
    WorkoutProgressOverviewResponse,
} from "@/types/workoutProgress.types";

type UseWorkoutProgressArgs = {
    mode: WorkoutProgressMode;
    from?: string;
    to?: string;
    compareTo?: WorkoutProgressCompareTo;
    weekKey?: string;
    includeExerciseProgress?: boolean;
};

function isCustomRangeValid(args: UseWorkoutProgressArgs): boolean {
    if (args.mode !== "customRange") {
        return true;
    }

    return Boolean(args.from) && Boolean(args.to);
}

export function useWorkoutProgress(args: UseWorkoutProgressArgs) {
    const enabled = isCustomRangeValid(args);

    return useQuery<WorkoutProgressOverviewResponse, ApiError>({
        queryKey: [
            "workoutProgressOverview",
            args.mode,
            args.from ?? null,
            args.to ?? null,
            args.compareTo ?? "previous_period",
            args.weekKey ?? null,
            args.includeExerciseProgress ?? true,
        ],
        queryFn: () =>
            getWorkoutProgressOverview({
                mode: args.mode,
                from: args.from,
                to: args.to,
                compareTo: args.compareTo ?? "previous_period",
                weekKey: args.weekKey,
                includeExerciseProgress: args.includeExerciseProgress ?? true,
            }),
        enabled,
        staleTime: 30_000,
    });
}
// src/hooks/useBodyProgress.ts

import { useQuery } from "@tanstack/react-query";
import type { ApiError } from "@/api/httpErrors";
import { getBodyProgressOverview } from "@/services/workout/bodyProgress.service";
import type { BodyProgressOverviewResponse } from "@/types/bodyProgress.types";
import type {
    WorkoutProgressCompareTo,
    WorkoutProgressMode,
} from "@/types/workoutProgress.types";

type UseBodyProgressArgs = {
    mode: WorkoutProgressMode;
    from?: string;
    to?: string;
    compareTo?: WorkoutProgressCompareTo;
};

function isCustomRangeValid(args: UseBodyProgressArgs): boolean {
    if (args.mode !== "customRange") {
        return true;
    }

    return Boolean(args.from) && Boolean(args.to);
}

export function useBodyProgress(args: UseBodyProgressArgs) {
    const enabled = isCustomRangeValid(args);

    return useQuery<BodyProgressOverviewResponse, ApiError>({
        queryKey: [
            "bodyProgress",
            "overview",
            args.mode,
            args.from ?? null,
            args.to ?? null,
            args.compareTo ?? "previous_period",
        ],
        queryFn: () =>
            getBodyProgressOverview({
                mode: args.mode,
                from: args.from,
                to: args.to,
                compareTo: args.compareTo ?? "previous_period",
            }),
        enabled,
        staleTime: 30_000,
    });
}
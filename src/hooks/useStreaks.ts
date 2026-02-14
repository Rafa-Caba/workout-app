import { useQuery } from "@tanstack/react-query";
import type { ApiError } from "@/api/httpErrors";
import { getStreaks } from "@/services/workout/insights.service";
import type { StreaksMode, StreaksResponse } from "@/services/workout/insights.service";

export function useStreaks(args: { mode: StreaksMode; gapDays?: number; asOf?: string }, enabled: boolean) {
    return useQuery<StreaksResponse, ApiError>({
        queryKey: ["streaks", args.mode, args.gapDays ?? null, args.asOf ?? null],
        queryFn: () => getStreaks(args),
        enabled,
        staleTime: 30_000,
    });
}

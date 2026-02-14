import { useQuery } from "@tanstack/react-query";
import type { ApiError } from "@/api/httpErrors";
import { getRecovery } from "@/services/workout/insights.service";
import type { RecoveryResponse } from "@/services/workout/insights.service";

export function useRecovery(args: { from?: string; to?: string }, enabled: boolean) {
    return useQuery<RecoveryResponse, ApiError>({
        queryKey: ["recovery", args.from ?? null, args.to ?? null],
        queryFn: () => getRecovery(args),
        enabled,
        staleTime: 30_000,
    });
}

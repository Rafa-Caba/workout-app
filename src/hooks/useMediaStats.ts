import { useQuery } from "@tanstack/react-query";
import type { ApiError } from "@/api/httpErrors";
import { getMediaStats } from "@/services/workout/media.service";
import type { MediaStatsResponse } from "@/types/media.types";

export function useMediaStats(
    from: string,
    to: string,
    enabled: boolean,
    source: "day" | "routine" | "all" = "all"
) {
    return useQuery<MediaStatsResponse, ApiError>({
        queryKey: ["mediaStats", { from, to, source }],
        queryFn: () => getMediaStats(from, to, source),
        enabled,
        staleTime: 60_000,
    });
}

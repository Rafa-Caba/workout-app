import { useQuery } from "@tanstack/react-query";
import type { ApiError } from "@/api/httpErrors";
import { getMedia, type GetMediaParams } from "@/services/workout/media.service";
import type { MediaFeedResponse } from "@/types/media.types";

export function useMedia(params?: GetMediaParams) {
    return useQuery<MediaFeedResponse, ApiError>({
        queryKey: ["media", params ?? {}],
        queryFn: () => getMedia(params),
        staleTime: 30_000,
    });
}

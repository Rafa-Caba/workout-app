// src/services/workout/bodyProgress.service.ts

import { api } from "@/api/axios";
import type {
    BodyProgressOverviewQuery,
    BodyProgressOverviewResponse,
} from "@/types/bodyProgress.types";

type ProgressRequestParams = {
    mode: BodyProgressOverviewQuery["mode"];
    from?: string;
    to?: string;
    compareTo?: BodyProgressOverviewQuery["compareTo"];
};

export async function getBodyProgressOverview(
    args: ProgressRequestParams
): Promise<BodyProgressOverviewResponse> {
    const params: Record<string, string | undefined> = {
        mode: args.mode,
        from: args.from,
        to: args.to,
        compareTo: args.compareTo ?? "previous_period",
    };

    const res = await api.get("/workout/progress/body", { params });
    return res.data as BodyProgressOverviewResponse;
}
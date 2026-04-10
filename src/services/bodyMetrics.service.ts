// src/services/bodyMetrics.service.ts

import { api } from "@/api/axios";
import type {
    UpsertUserMetricRequest,
    UserMetricEntry,
    UserMetricLatestResponse,
    UserMetricListQuery,
    UserMetricListResponse,
} from "@/types/bodyMetrics.types";

export async function getMyBodyMetrics(
    query: UserMetricListQuery = {}
): Promise<UserMetricListResponse> {
    const res = await api.get("/users/me/body-metrics", {
        params: {
            from: query.from,
            to: query.to,
        },
    });

    return res.data as UserMetricListResponse;
}

export async function getMyLatestBodyMetric(): Promise<UserMetricLatestResponse> {
    const res = await api.get("/users/me/body-metrics/latest");
    return res.data as UserMetricLatestResponse;
}

export async function upsertMyBodyMetricByDate(
    date: string,
    body: UpsertUserMetricRequest
): Promise<UserMetricEntry> {
    const res = await api.put(`/users/me/body-metrics/${encodeURIComponent(date)}`, body);
    return res.data as UserMetricEntry;
}

export async function deleteMyBodyMetricByDate(
    date: string
): Promise<{ ok: true }> {
    const res = await api.delete(`/users/me/body-metrics/${encodeURIComponent(date)}`);
    return res.data as { ok: true };
}
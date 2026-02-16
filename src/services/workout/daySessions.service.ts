import { api } from "@/api/axios";
import { ensureWorkoutDayExistsDays } from "@/services/workout/days.service";
import type { CreateWorkoutSessionBody } from "@/utils/gymCheck/buildGymCheckSession";

export type CreatedSessionResponse = {
    // backend might return different shape; keep unknown-safe
    sessionId?: string;
    id?: string;
    created?: boolean;
    data?: unknown;
} & Record<string, unknown>;

export async function createWorkoutSessionForDay(date: string, body: CreateWorkoutSessionBody): Promise<CreatedSessionResponse> {
    // Required because your backend returns 404 if day doc doesn't exist
    await ensureWorkoutDayExistsDays(date);

    const res = await api.post(`/workout/days/${encodeURIComponent(date)}/sessions`, body);
    return res.data as CreatedSessionResponse;
}

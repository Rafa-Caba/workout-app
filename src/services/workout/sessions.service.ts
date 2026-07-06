// src/services/workout/sessions.service.ts

import { api } from "@/api/axios";
import type {
    WorkoutActivityType,
    WorkoutDay,
    WorkoutExercise,
    WorkoutCardioMetrics,
    WorkoutRoutePoint,
    WorkoutRouteSummary,
    WorkoutSession,
} from "@/types/workoutDay.types";

export type SessionReturnMode = "day" | "session";

export type CreateSessionExerciseInput = Omit<WorkoutExercise, "id">;

export type CreateSessionBody = {
    type: string;

    activityType?: WorkoutActivityType;
    cardioEnvironment?: "outdoor" | "indoor" | null;

    startAt?: string | null;
    endAt?: string | null;

    durationSeconds?: number | null;

    activeKcal?: number | null;
    totalKcal?: number | null;

    avgHr?: number | null;
    maxHr?: number | null;

    distanceKm?: number | null;
    steps?: number | null;
    elevationGainM?: number | null;

    paceSecPerKm?: number | null;
    cadenceRpm?: number | null;

    hasRoute?: boolean;
    routeSummary?: WorkoutRouteSummary | null;
    routePoints?: WorkoutRoutePoint[] | null;
    cardioMetrics?: WorkoutCardioMetrics | null;

    effortRpe?: number | null;

    notes?: string | null;
    exercises?: CreateSessionExerciseInput[] | null;

    meta?: Record<string, unknown> | null;
};

export type PatchSessionBody = Partial<CreateSessionBody> & {
    deleteMedia?: boolean;
};

export type AttachMediaItem = {
    publicId: string;
    url: string;
    resourceType: "image" | "video";
    format?: string | null;
    createdAt?: string | null;
    meta?: Record<string, unknown> | null;
};

export type AttachSessionMediaBody = {
    items: AttachMediaItem[];
};

export type ReturnDay = WorkoutDay;
export type ReturnSession = { session: WorkoutSession | null; day?: WorkoutDay | null };

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

class SessionIdMissingError extends Error {
    status = 500;

    constructor() {
        super("Session created but response did not include session.id");
        this.name = "SessionIdMissingError";
    }
}

function extractSessionIdFromReturn(payload: ReturnDay | ReturnSession): string | null {
    if (payload && typeof payload === "object" && "session" in payload) {
        const session = payload.session;
        return typeof session?.id === "string" ? session.id : null;
    }

    return null;
}

function findGymCheckSessionIdFromDay(day: WorkoutDay): string | null {
    const sessions = Array.isArray(day.training?.sessions) ? day.training.sessions : [];
    const hit =
        sessions.find((session) => String(session.meta?.sessionKey ?? "") === "gym_check") ?? null;

    return hit?.id ?? null;
}

function throwSessionIdMissingError(): never {
    throw new SessionIdMissingError();
}

export async function ensureWorkoutDayExists(date: string): Promise<void> {
    await api.put(`/workout/days/${encodeURIComponent(date)}`, {});
}

export async function getWorkoutDay(date: string): Promise<WorkoutDay> {
    const res = await api.get<WorkoutDay>(`/workout/days/${encodeURIComponent(date)}`);
    return res.data;
}

export async function createSession(
    date: string,
    payload: CreateSessionBody,
    opts?: { returnMode?: SessionReturnMode }
): Promise<ReturnDay | ReturnSession> {
    const res = await api.post<ReturnDay | ReturnSession>(`/workout/days/${encodeURIComponent(date)}/sessions`, payload, {
        params: opts?.returnMode ? { returnMode: opts.returnMode } : undefined,
    });

    return res.data;
}

export async function patchSession(
    date: string,
    sessionId: string,
    payload: PatchSessionBody,
    opts?: { returnMode?: SessionReturnMode }
): Promise<ReturnDay | ReturnSession> {
    const res = await api.patch<ReturnDay | ReturnSession>(
        `/workout/days/${encodeURIComponent(date)}/sessions/${encodeURIComponent(sessionId)}`,
        payload,
        {
            params: opts?.returnMode ? { returnMode: opts.returnMode } : undefined,
        }
    );

    return res.data;
}

export async function deleteSession(
    date: string,
    sessionId: string,
    opts?: { returnMode?: SessionReturnMode; deleteMedia?: boolean }
): Promise<ReturnDay | ReturnSession> {
    const res = await api.delete<ReturnDay | ReturnSession>(
        `/workout/days/${encodeURIComponent(date)}/sessions/${encodeURIComponent(sessionId)}`,
        {
            params: {
                ...(opts?.returnMode ? { returnMode: opts.returnMode } : {}),
                ...(typeof opts?.deleteMedia === "boolean"
                    ? { deleteMedia: opts.deleteMedia }
                    : {}),
            },
        }
    );

    return res.data;
}

export async function attachSessionMedia(
    date: string,
    sessionId: string,
    payload: AttachSessionMediaBody,
    opts?: { returnMode?: SessionReturnMode }
): Promise<ReturnDay | ReturnSession> {
    const res = await api.post<ReturnDay | ReturnSession>(
        `/workout/days/${encodeURIComponent(date)}/sessions/${encodeURIComponent(sessionId)}/media/attach`,
        payload,
        {
            params: opts?.returnMode ? { returnMode: opts.returnMode } : undefined,
        }
    );

    return res.data;
}

export async function upsertGymCheckSession(
    date: string,
    payload: CreateSessionBody,
    opts?: { returnMode?: SessionReturnMode }
): Promise<{ mode: "created" | "patched"; data: ReturnDay | ReturnSession; sessionId: string }> {
    await ensureWorkoutDayExists(date);

    const day = await getWorkoutDay(date);
    const existingId = findGymCheckSessionIdFromDay(day);

    const returnMode: SessionReturnMode = opts?.returnMode ?? "day";

    if (existingId) {
        const data = await patchSession(date, existingId, payload, { returnMode });
        return { mode: "patched", data, sessionId: existingId };
    }

    const created = await createSession(date, payload, { returnMode: "session" });
    const sessionId = extractSessionIdFromReturn(created);

    if (!sessionId) {
        throwSessionIdMissingError();
    }

    return { mode: "created", data: created, sessionId };
}

/**
 * Utility used by create + optional attach flows.
 * Kept exported in case other manual outdoor flows want to reuse it later.
 */
export function extractSessionIdFromCreateResponse(data: unknown): string | null {
    if (!data || typeof data !== "object") return null;

    if (!isRecord(data)) return null;

    const session = data.session;
    if (!isRecord(session)) return null;

    const id = session.id;

    return typeof id === "string" && id.trim() ? id.trim() : null;
}
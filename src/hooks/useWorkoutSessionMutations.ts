// src/hooks/useWorkoutSessionMutations.ts

/**
 * Workout session mutations hook layer
 *
 * This file keeps Web aligned with the same idea used across the project:
 * components/sections do not call services directly when a reusable hook
 * is better for consistency.
 *
 * Important:
 * - create receives payload only
 * - patch receives sessionId + payload
 * - delete receives sessionId + optional deleteMedia
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { ApiError } from "@/api/httpErrors";
import {
    attachSessionMedia,
    createSession,
    deleteSession,
    ensureWorkoutDayExists,
    patchSession,
    type AttachMediaItem,
    type CreateSessionBody,
    type PatchSessionBody,
    type SessionReturnMode,
} from "@/services/workout/sessions.service";

type CreatedSessionResponse = {
    session?: { id?: string } | null;
};

function extractSessionIdFromCreateResponse(data: unknown): string | null {
    if (!data || typeof data !== "object") return null;

    const maybe = data as CreatedSessionResponse;
    const id = maybe.session?.id;

    if (typeof id === "string" && id.trim()) {
        return id.trim();
    }

    return null;
}

function createSessionIdMissingError(): ApiError {
    return {
        status: 500,
        message: "Session created but response did not include session.id (cannot attach media).",
    };
}

export function useCreateWorkoutSession(args: {
    date: string;
    weekKey?: string;
    returnMode?: SessionReturnMode;
    attachMediaItems?: AttachMediaItem[];
}) {
    const qc = useQueryClient();

    return useMutation<unknown, ApiError, CreateSessionBody>({
        mutationFn: async (payload) => {
            await ensureWorkoutDayExists(args.date);

            const hasAttach =
                Array.isArray(args.attachMediaItems) && args.attachMediaItems.length > 0;

            const createReturnMode: SessionReturnMode = hasAttach
                ? "session"
                : (args.returnMode ?? "day");

            const created = await createSession(args.date, payload, {
                returnMode: createReturnMode,
            });

            if (!hasAttach) {
                return created;
            }

            const sessionId = extractSessionIdFromCreateResponse(created);

            if (!sessionId) {
                throw createSessionIdMissingError();
            }

            return attachSessionMedia(
                args.date,
                sessionId,
                { items: args.attachMediaItems ?? [] },
                { returnMode: args.returnMode ?? "day" }
            );
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["workoutDay", args.date] });

            if (args.weekKey) {
                qc.invalidateQueries({ queryKey: ["planVsActual", args.weekKey] });
            }
        },
    });
}

export function usePatchWorkoutSession(args: {
    date: string;
    weekKey?: string;
    returnMode?: SessionReturnMode;
}) {
    const qc = useQueryClient();

    return useMutation<
        unknown,
        ApiError,
        { sessionId: string; payload: PatchSessionBody }
    >({
        mutationFn: ({ sessionId, payload }) =>
            patchSession(args.date, sessionId, payload, {
                returnMode: args.returnMode ?? "day",
            }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["workoutDay", args.date] });

            if (args.weekKey) {
                qc.invalidateQueries({ queryKey: ["planVsActual", args.weekKey] });
            }
        },
    });
}

export function useDeleteWorkoutSession(args: {
    date: string;
    weekKey?: string;
    returnMode?: SessionReturnMode;
}) {
    const qc = useQueryClient();

    return useMutation<
        unknown,
        ApiError,
        { sessionId: string; deleteMedia?: boolean }
    >({
        mutationFn: ({ sessionId, deleteMedia }) =>
            deleteSession(args.date, sessionId, {
                returnMode: args.returnMode ?? "day",
                deleteMedia,
            }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["workoutDay", args.date] });

            if (args.weekKey) {
                qc.invalidateQueries({ queryKey: ["planVsActual", args.weekKey] });
            }
        },
    });
}
// src/services/workout/days.service.ts

import { api } from "@/api/axios";
import type { DaySummary } from "@/types/workout.types";
import type {
    SleepBlock,
    WorkoutDay,
    WorkoutDayUpsertBody,
    WorkoutSession,
} from "@/types/workoutDay.types";

function isFiniteNumber(n: unknown): n is number {
    return typeof n === "number" && Number.isFinite(n);
}

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readNumericStatus(value: unknown): number | null {
    return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function toStatus(error: unknown): number | null {
    if (!isRecord(error)) return null;

    const directStatus = readNumericStatus(error.status);
    if (directStatus !== null) return directStatus;

    const response = error.response;
    if (!isRecord(response)) return null;

    return readNumericStatus(response.status);
}

function sumNullable(nums: Array<number | null | undefined>): number {
    let total = 0;
    for (const n of nums) {
        if (isFiniteNumber(n)) total += n;
    }
    return total;
}

function maxNullable(nums: Array<number | null | undefined>): number | null {
    let max: number | null = null;
    for (const n of nums) {
        if (!isFiniteNumber(n)) continue;
        if (max === null || n > max) max = n;
    }
    return max;
}

function avgFromSessionAvgs(sessions: WorkoutSession[]): number | null {
    const values = sessions.map((s) => s.avgHr).filter((v): v is number => isFiniteNumber(v));

    if (!values.length) return null;

    const total = values.reduce((a, b) => a + b, 0);
    return Math.round(total / values.length);
}

function countMedia(sessions: WorkoutSession[]): number {
    let count = 0;

    for (const s of sessions) {
        const media = s.media ?? null;
        if (Array.isArray(media)) count += media.length;
    }

    return count;
}

function emptyDaySummary(date: string): DaySummary {
    return {
        date,
        weekKey: null,
        sleep: null,
        training: {
            sessionsCount: 0,
            durationSeconds: 0,
            activeKcal: null,
            totalKcal: null,
            avgHr: null,
            maxHr: null,
            distanceKm: null,
            steps: null,
            mediaCount: 0,
        },
        notes: null,
        tags: null,
    };
}

function createNotFoundError(date: string): Error & {
    status: number;
    code: "NOT_FOUND";
    details: { date: string };
} {
    const error = new Error("Workout day not found") as Error & {
        status: number;
        code: "NOT_FOUND";
        details: { date: string };
    };

    error.status = 404;
    error.code = "NOT_FOUND";
    error.details = { date };

    return error;
}

export function buildDaySummaryFromWorkoutDay(day: WorkoutDay): DaySummary {
    const sessions: WorkoutSession[] = Array.isArray(day.training?.sessions)
        ? day.training.sessions
        : [];

    const durationSeconds = sumNullable(sessions.map((s) => s.durationSeconds));

    const activeKcalSum = sumNullable(sessions.map((s) => s.activeKcal));
    const totalKcalSum = sumNullable(sessions.map((s) => s.totalKcal));

    const avgHr = avgFromSessionAvgs(sessions);
    const maxHr = maxNullable(sessions.map((s) => s.maxHr));

    const distanceKmSum = sumNullable(sessions.map((s) => s.distanceKm));
    const stepsSum = sumNullable(sessions.map((s) => s.steps));

    const mediaCount = countMedia(sessions);

    return {
        date: day.date,
        weekKey: day.weekKey ?? null,

        sleep: day.sleep
            ? {
                timeAsleepMinutes: day.sleep.timeAsleepMinutes ?? null,
                score: day.sleep.score ?? null,
                awakeMinutes: day.sleep.awakeMinutes ?? null,
                remMinutes: day.sleep.remMinutes ?? null,
                coreMinutes: day.sleep.coreMinutes ?? null,
                deepMinutes: day.sleep.deepMinutes ?? null,
                source: day.sleep.source ?? null,
            }
            : null,

        training: {
            sessionsCount: sessions.length,
            durationSeconds,

            activeKcal: activeKcalSum > 0 ? activeKcalSum : null,
            totalKcal: totalKcalSum > 0 ? totalKcalSum : null,

            avgHr,
            maxHr,

            distanceKm: distanceKmSum > 0 ? distanceKmSum : null,
            steps: stepsSum > 0 ? stepsSum : null,

            mediaCount,
        },

        notes: day.notes ?? null,
        tags: day.tags ?? null,
    };
}

export async function getWorkoutDayServ(date: string): Promise<WorkoutDay> {
    const res = await api.get(`/workout/days/${encodeURIComponent(date)}`);
    const data: unknown = res.data;

    if (!isRecord(data)) {
        throw createNotFoundError(date);
    }

    return data as WorkoutDay;
}

export async function getDaySummary(date: string): Promise<DaySummary> {
    try {
        const day = await getWorkoutDayServ(date);
        return buildDaySummaryFromWorkoutDay(day);
    } catch (error: unknown) {
        if (toStatus(error) === 404) return emptyDaySummary(date);
        throw error;
    }
}

/**
 * Ensures a workout day exists, because some endpoints may 404 if the day doc doesn't exist yet.
 * NOTE: PUT /days/:date already upserts, so this is mostly useful for older endpoints.
 */
export async function ensureWorkoutDayExistsDays(date: string): Promise<void> {
    try {
        const day = await getWorkoutDayServ(date);

        if (day) {
            return;
        }
    } catch (error: unknown) {
        const status = toStatus(error);
        if (status !== 404) throw error;
    }

    const minimalBody: WorkoutDayUpsertBody = {
        sleep: null,
        training: null,
        notes: null,
        tags: null,
        meta: null,
    };

    await api.put(`/workout/days/${encodeURIComponent(date)}`, minimalBody);
}

/** =========================================================
 * Upsert helpers
 * ========================================================= */

export async function upsertWorkoutDay(
    date: string,
    body: WorkoutDayUpsertBody,
    mode: "merge" | "replace" = "merge"
): Promise<WorkoutDay> {
    const res = await api.put(`/workout/days/${encodeURIComponent(date)}`, body, {
        params: { mode },
    });

    return res.data as WorkoutDay;
}

function coerceNullableInt(v: unknown): number | null {
    if (v === "" || v === null || v === undefined) return null;

    const n = Number(v);
    if (!Number.isFinite(n)) return null;

    return Math.max(0, Math.trunc(n));
}

function coerceNullableScore(v: unknown): number | null {
    const n = coerceNullableInt(v);
    if (n === null) return null;

    return Math.max(0, Math.min(100, n));
}

function coerceNullableIsoDateTime(value: unknown): string | null {
    if (typeof value !== "string") return null;

    const trimmed = value.trim();
    return trimmed ? trimmed : null;
}

function coerceNullableString(value: unknown): string | null {
    if (typeof value !== "string") return null;

    const trimmed = value.trim();
    return trimmed ? trimmed : null;
}

/**
 * Sleep-specific upsert:
 * - merge mode by default (only updates sleep block)
 * - supports clearing sleep by passing null
 */
export async function updateSleepForDay(
    date: string,
    sleep: Partial<SleepBlock> | null,
    mode: "merge" | "replace" = "merge"
): Promise<WorkoutDay> {
    if (sleep === null) {
        return upsertWorkoutDay(date, { sleep: null }, mode);
    }

    const normalized: SleepBlock = {
        timeAsleepMinutes: coerceNullableInt(sleep.timeAsleepMinutes),
        timeInBedMinutes: coerceNullableInt(sleep.timeInBedMinutes),
        score: coerceNullableScore(sleep.score),

        awakeMinutes: coerceNullableInt(sleep.awakeMinutes),
        remMinutes: coerceNullableInt(sleep.remMinutes),
        coreMinutes: coerceNullableInt(sleep.coreMinutes),
        deepMinutes: coerceNullableInt(sleep.deepMinutes),

        source:
            sleep.source === "manual" ||
                sleep.source === "healthkit" ||
                sleep.source === "health-connect"
                ? sleep.source
                : null,
        sourceDevice: coerceNullableString(sleep.sourceDevice),
        importedAt: coerceNullableIsoDateTime(sleep.importedAt),
        lastSyncedAt: coerceNullableIsoDateTime(sleep.lastSyncedAt),

        raw: sleep.raw ?? null,
    };

    return upsertWorkoutDay(date, { sleep: normalized }, mode);
}
// src/services/outdoor.service.ts

/**
 * Outdoor service helpers
 *
 * IMPORTANT:
 * - This file does NOT replace sessions.service.ts or days.service.ts
 * - It builds on top of the canonical WorkoutDay model and existing session CRUD
 * - It centralizes outdoor-specific parsing, filtering and payload builders
 */

import type {
    CreateSessionBody,
    PatchSessionBody,
} from "@/services/workout/sessions.service";
import type {
    WorkoutActivityType,
    WorkoutDay,
    WorkoutRouteSummary,
    WorkoutSession,
} from "@/types/workoutDay.types";
import type {
    OutdoorDayStats,
    OutdoorFormValues,
    OutdoorRangeSummary,
    OutdoorSupportedActivityType,
} from "@/types/outdoor.types";

function isFiniteNumber(value: unknown): value is number {
    return typeof value === "number" && Number.isFinite(value);
}

export function isOutdoorActivityType(
    value: WorkoutActivityType
): value is OutdoorSupportedActivityType {
    return value === "walking" || value === "running";
}

export function cleanString(value: string): string | null {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}

export function parseNullableNumber(value: string): number | null {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
}

export function parseNullableInt(value: string): number | null {
    const parsed = parseNullableNumber(value);
    if (parsed === null) return null;

    return Math.trunc(parsed);
}

export function buildIsoDateTime(date: string, time: string): string | null {
    const cleanDate = cleanString(date);
    const cleanTime = cleanString(time);

    if (!cleanDate || !cleanTime) return null;

    const built = new Date(`${cleanDate}T${cleanTime}:00`);
    if (Number.isNaN(built.getTime())) return null;

    return built.toISOString();
}

export function deriveDurationSeconds(
    explicitDuration: string,
    startAt: string | null,
    endAt: string | null
): number | null {
    const parsedExplicit = parseNullableInt(explicitDuration);
    if (parsedExplicit !== null) return parsedExplicit;

    if (!startAt || !endAt) return null;

    const startMs = new Date(startAt).getTime();
    const endMs = new Date(endAt).getTime();

    if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
        return null;
    }

    return Math.trunc((endMs - startMs) / 1000);
}

export function buildRouteSummary(
    hasRoute: boolean,
    pointCountDraft: string
): WorkoutRouteSummary | null {
    if (!hasRoute) return null;

    const pointCount = parseNullableInt(pointCountDraft) ?? 0;

    return {
        pointCount,
        startLatitude: null,
        startLongitude: null,
        endLatitude: null,
        endLongitude: null,
        minLatitude: null,
        maxLatitude: null,
        minLongitude: null,
        maxLongitude: null,
    };
}

export function createEmptyOutdoorFormValues(): OutdoorFormValues {
    return {
        activityType: "walking",

        startTime: "",
        endTime: "",

        durationSeconds: "",

        activeKcal: "",
        totalKcal: "",

        avgHr: "",
        maxHr: "",

        distanceKm: "",
        steps: "",
        elevationGainM: "",

        paceSecPerKm: "",
        cadenceRpm: "",

        avgSpeedKmh: "",
        maxSpeedKmh: "",
        strideLengthM: "",

        hasRoute: false,
        routePointCount: "",

        sourceDevice: "",
        notes: "",
    };
}

export function mapOutdoorSessionToFormValues(
    session: WorkoutSession
): OutdoorFormValues {
    const startDate = session.startAt ? new Date(session.startAt) : null;
    const endDate = session.endAt ? new Date(session.endAt) : null;

    const startTime =
        startDate && !Number.isNaN(startDate.getTime())
            ? `${String(startDate.getHours()).padStart(2, "0")}:${String(
                startDate.getMinutes()
            ).padStart(2, "0")}`
            : "";

    const endTime =
        endDate && !Number.isNaN(endDate.getTime())
            ? `${String(endDate.getHours()).padStart(2, "0")}:${String(
                endDate.getMinutes()
            ).padStart(2, "0")}`
            : "";

    return {
        activityType: session.activityType === "running" ? "running" : "walking",

        startTime,
        endTime,

        durationSeconds:
            session.durationSeconds !== null ? String(session.durationSeconds) : "",

        activeKcal: session.activeKcal !== null ? String(session.activeKcal) : "",
        totalKcal: session.totalKcal !== null ? String(session.totalKcal) : "",

        avgHr: session.avgHr !== null ? String(session.avgHr) : "",
        maxHr: session.maxHr !== null ? String(session.maxHr) : "",

        distanceKm: session.distanceKm !== null ? String(session.distanceKm) : "",
        steps: session.steps !== null ? String(session.steps) : "",
        elevationGainM:
            session.elevationGainM !== null ? String(session.elevationGainM) : "",

        paceSecPerKm:
            session.paceSecPerKm !== null ? String(session.paceSecPerKm) : "",
        cadenceRpm: session.cadenceRpm !== null ? String(session.cadenceRpm) : "",

        avgSpeedKmh:
            session.outdoorMetrics?.avgSpeedKmh !== null &&
                session.outdoorMetrics?.avgSpeedKmh !== undefined
                ? String(session.outdoorMetrics.avgSpeedKmh)
                : "",
        maxSpeedKmh:
            session.outdoorMetrics?.maxSpeedKmh !== null &&
                session.outdoorMetrics?.maxSpeedKmh !== undefined
                ? String(session.outdoorMetrics.maxSpeedKmh)
                : "",
        strideLengthM:
            session.outdoorMetrics?.strideLengthM !== null &&
                session.outdoorMetrics?.strideLengthM !== undefined
                ? String(session.outdoorMetrics.strideLengthM)
                : "",

        hasRoute: session.hasRoute === true,
        routePointCount:
            session.routeSummary?.pointCount !== null &&
                session.routeSummary?.pointCount !== undefined
                ? String(session.routeSummary.pointCount)
                : "",

        sourceDevice:
            typeof session.meta?.sourceDevice === "string"
                ? session.meta.sourceDevice
                : "",
        notes: session.notes ?? "",
    };
}

export function buildOutdoorCreatePayload(
    date: string,
    values: OutdoorFormValues
): CreateSessionBody {
    const startAt = buildIsoDateTime(date, values.startTime);
    const endAt = buildIsoDateTime(date, values.endTime);
    const durationSeconds = deriveDurationSeconds(
        values.durationSeconds,
        startAt,
        endAt
    );

    return {
        type: values.activityType === "walking" ? "Walking" : "Running",
        activityType: values.activityType,
        startAt,
        endAt,
        durationSeconds,

        activeKcal: parseNullableInt(values.activeKcal),
        totalKcal: parseNullableInt(values.totalKcal),

        avgHr: parseNullableInt(values.avgHr),
        maxHr: parseNullableInt(values.maxHr),

        distanceKm: parseNullableNumber(values.distanceKm),
        steps: parseNullableInt(values.steps),
        elevationGainM: parseNullableNumber(values.elevationGainM),

        paceSecPerKm: parseNullableInt(values.paceSecPerKm),
        cadenceRpm: parseNullableInt(values.cadenceRpm),

        hasRoute: values.hasRoute,
        routeSummary: buildRouteSummary(values.hasRoute, values.routePointCount),
        outdoorMetrics: {
            distanceKm: parseNullableNumber(values.distanceKm),
            steps: parseNullableInt(values.steps),
            elevationGainM: parseNullableNumber(values.elevationGainM),
            paceSecPerKm: parseNullableInt(values.paceSecPerKm),
            avgSpeedKmh: parseNullableNumber(values.avgSpeedKmh),
            maxSpeedKmh: parseNullableNumber(values.maxSpeedKmh),
            cadenceRpm: parseNullableInt(values.cadenceRpm),
            strideLengthM: parseNullableNumber(values.strideLengthM),
        },

        effortRpe: null,
        notes: cleanString(values.notes),
        exercises: null,
        meta: {
            source: "manual",
            sourceDevice: cleanString(values.sourceDevice),
            sessionKind: "manual-outdoor",
            importedAt: null,
            lastSyncedAt: null,
        },
    };
}

export function buildOutdoorPatchPayload(
    date: string,
    values: OutdoorFormValues
): PatchSessionBody {
    return buildOutdoorCreatePayload(date, values);
}

export function dedupeSessionsById(sessions: WorkoutSession[]): WorkoutSession[] {
    const seen = new Set<string>();
    const out: WorkoutSession[] = [];

    for (const session of sessions) {
        const id = typeof session.id === "string" ? session.id.trim() : "";

        if (!id) {
            out.push(session);
            continue;
        }

        if (seen.has(id)) {
            continue;
        }

        seen.add(id);
        out.push(session);
    }

    return out;
}

export function sortSessionsDesc(sessions: WorkoutSession[]): WorkoutSession[] {
    return [...sessions].sort((a, b) => {
        const aTime = a.startAt ? new Date(a.startAt).getTime() : 0;
        const bTime = b.startAt ? new Date(b.startAt).getTime() : 0;
        return bTime - aTime;
    });
}

export function getOutdoorSessionsFromDay(day: WorkoutDay | null): WorkoutSession[] {
    const rawSessions = Array.isArray(day?.training?.sessions)
        ? day.training.sessions
        : [];

    const outdoorOnly = rawSessions.filter((session) =>
        isOutdoorActivityType(session.activityType)
    );

    return sortSessionsDesc(dedupeSessionsById(outdoorOnly));
}

export function buildOutdoorDayStats(sessions: WorkoutSession[]): OutdoorDayStats {
    let totalDurationSeconds = 0;
    let totalDistanceKm = 0;
    let totalSteps = 0;
    let totalActiveKcal = 0;

    let hasDuration = false;
    let hasDistance = false;
    let hasSteps = false;
    let hasActiveKcal = false;

    for (const session of sessions) {
        if (isFiniteNumber(session.durationSeconds)) {
            totalDurationSeconds += session.durationSeconds;
            hasDuration = true;
        }

        if (isFiniteNumber(session.distanceKm)) {
            totalDistanceKm += session.distanceKm;
            hasDistance = true;
        }

        if (isFiniteNumber(session.steps)) {
            totalSteps += session.steps;
            hasSteps = true;
        }

        if (isFiniteNumber(session.activeKcal)) {
            totalActiveKcal += session.activeKcal;
            hasActiveKcal = true;
        }
    }

    return {
        sessionsCount: sessions.length,
        totalDurationSeconds: hasDuration ? totalDurationSeconds : null,
        totalDistanceKm: hasDistance ? totalDistanceKm : null,
        totalSteps: hasSteps ? totalSteps : null,
        totalActiveKcal: hasActiveKcal ? totalActiveKcal : null,
    };
}

export function buildOutdoorRangeSummary(days: WorkoutDay[]): OutdoorRangeSummary {
    const sessions = days.flatMap((day) => getOutdoorSessionsFromDay(day));

    const stats = buildOutdoorDayStats(sessions);

    const walkingSessions = sessions.filter(
        (session) => session.activityType === "walking"
    ).length;

    const runningSessions = sessions.filter(
        (session) => session.activityType === "running"
    ).length;

    return {
        totalSessions: stats.sessionsCount,
        totalDurationSeconds: stats.totalDurationSeconds,
        totalDistanceKm: stats.totalDistanceKm,
        totalSteps: stats.totalSteps,
        totalActiveKcal: stats.totalActiveKcal,
        walkingSessions,
        runningSessions,
    };
}
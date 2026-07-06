// src/services/workout/cardio.service.ts

/**
 * Cardio service helpers.
 *
 * IMPORTANT:
 * - This file does NOT replace sessions.service.ts or days.service.ts
 * - It builds on top of the canonical WorkoutDay model and existing session CRUD
 * - It centralizes Cardio parsing, filtering and payload builders
 */

import type {
    CreateSessionBody,
    PatchSessionBody,
} from "@/services/workout/sessions.service";
import type {
    WorkoutActivityType,
    WorkoutCardioEnvironment,
    WorkoutDay,
    WorkoutRouteSummary,
    WorkoutSession,
} from "@/types/workoutDay.types";
import type {
    CardioActivityFilter,
    CardioDayStats,
    CardioEnvironmentFilter,
    CardioFormValues,
    CardioRangeSummary,
    CardioSupportedActivityType,
    CardioSupportedEnvironment,
} from "@/types/cardio.types";

function isFiniteNumber(value: unknown): value is number {
    return typeof value === "number" && Number.isFinite(value);
}

export function isCardioActivityType(
    value: WorkoutActivityType
): value is CardioSupportedActivityType {
    return value === "walking" || value === "running";
}

export function isCardioEnvironment(
    value: WorkoutCardioEnvironment
): value is CardioSupportedEnvironment {
    return value === "outdoor" || value === "indoor";
}

export function getCanonicalCardioEnvironment(
    session: WorkoutSession
): CardioSupportedEnvironment | null {
    if (isCardioEnvironment(session.cardioEnvironment)) {
        return session.cardioEnvironment;
    }

    if (session.hasRoute === true || session.routeSummary !== null) {
        return "outdoor";
    }

    return null;
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
    environment: CardioSupportedEnvironment,
    hasRoute: boolean,
    pointCountDraft: string
): WorkoutRouteSummary | null {
    if (environment !== "outdoor" || !hasRoute) return null;

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

export function createEmptyCardioFormValues(): CardioFormValues {
    return {
        activityType: "walking",
        cardioEnvironment: "outdoor",

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

function getSessionCardioMetrics(session: WorkoutSession) {
    return session.cardioMetrics ?? null;
}

export function mapCardioSessionToFormValues(
    session: WorkoutSession
): CardioFormValues {
    const startDate = session.startAt ? new Date(session.startAt) : null;
    const endDate = session.endAt ? new Date(session.endAt) : null;
    const metrics = getSessionCardioMetrics(session);
    const environment = getCanonicalCardioEnvironment(session) ?? "outdoor";

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
        cardioEnvironment: environment,

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
            metrics?.avgSpeedKmh !== null && metrics?.avgSpeedKmh !== undefined
                ? String(metrics.avgSpeedKmh)
                : "",
        maxSpeedKmh:
            metrics?.maxSpeedKmh !== null && metrics?.maxSpeedKmh !== undefined
                ? String(metrics.maxSpeedKmh)
                : "",
        strideLengthM:
            metrics?.strideLengthM !== null && metrics?.strideLengthM !== undefined
                ? String(metrics.strideLengthM)
                : "",

        hasRoute: environment === "outdoor" && session.hasRoute === true,
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

function getCardioTypeLabel(values: Pick<CardioFormValues, "activityType" | "cardioEnvironment">): string {
    const environmentLabel = values.cardioEnvironment === "indoor" ? "Indoor" : "Outdoor";
    const activityLabel = values.activityType === "walking" ? "Walking" : "Running";

    return `${environmentLabel} ${activityLabel}`;
}

export function buildCardioCreatePayload(
    date: string,
    values: CardioFormValues
): CreateSessionBody {
    const startAt = buildIsoDateTime(date, values.startTime);
    const endAt = buildIsoDateTime(date, values.endTime);
    const durationSeconds = deriveDurationSeconds(
        values.durationSeconds,
        startAt,
        endAt
    );

    const hasRoute = values.cardioEnvironment === "outdoor" && values.hasRoute;
    const routeSummary = buildRouteSummary(
        values.cardioEnvironment,
        hasRoute,
        values.routePointCount
    );

    const distanceKm = parseNullableNumber(values.distanceKm);
    const steps = parseNullableInt(values.steps);
    const elevationGainM =
        values.cardioEnvironment === "outdoor"
            ? parseNullableNumber(values.elevationGainM)
            : null;
    const paceSecPerKm = parseNullableInt(values.paceSecPerKm);
    const cadenceRpm = parseNullableInt(values.cadenceRpm);

    return {
        type: getCardioTypeLabel(values),
        activityType: values.activityType,
        cardioEnvironment: values.cardioEnvironment,
        startAt,
        endAt,
        durationSeconds,

        activeKcal: parseNullableInt(values.activeKcal),
        totalKcal: parseNullableInt(values.totalKcal),

        avgHr: parseNullableInt(values.avgHr),
        maxHr: parseNullableInt(values.maxHr),

        distanceKm,
        steps,
        elevationGainM,

        paceSecPerKm,
        cadenceRpm,

        hasRoute,
        routeSummary,
        routePoints: null,
        cardioMetrics: {
            distanceKm,
            steps,
            elevationGainM,
            paceSecPerKm,
            avgSpeedKmh: parseNullableNumber(values.avgSpeedKmh),
            maxSpeedKmh: parseNullableNumber(values.maxSpeedKmh),
            cadenceRpm,
            strideLengthM: parseNullableNumber(values.strideLengthM),
        },

        effortRpe: null,
        notes: cleanString(values.notes),
        exercises: null,
        meta: {
            source: "manual",
            sourceDevice: cleanString(values.sourceDevice),
            sessionKind: "manual-cardio",
            importedAt: null,
            lastSyncedAt: null,
            healthWriteStatus: null,
            healthExternalId: null,
            healthWrittenAt: null,
        },
    };
}

export function buildCardioPatchPayload(
    date: string,
    values: CardioFormValues
): PatchSessionBody {
    return buildCardioCreatePayload(date, values);
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

export function getCardioSessionsFromDay(day: WorkoutDay | null): WorkoutSession[] {
    const rawSessions = Array.isArray(day?.training?.sessions)
        ? day.training.sessions
        : [];

    const cardioOnly = rawSessions.filter((session) =>
        isCardioActivityType(session.activityType)
    );

    return sortSessionsDesc(dedupeSessionsById(cardioOnly));
}

export function filterCardioSessions(
    sessions: WorkoutSession[],
    environmentFilter: CardioEnvironmentFilter,
    activityFilter: CardioActivityFilter
): WorkoutSession[] {
    return sessions.filter((session) => {
        const environment = getCanonicalCardioEnvironment(session);
        const environmentMatches =
            environmentFilter === "all" || environment === environmentFilter;
        const activityMatches =
            activityFilter === "all" || session.activityType === activityFilter;

        return environmentMatches && activityMatches;
    });
}

export function buildCardioDayStats(sessions: WorkoutSession[]): CardioDayStats {
    let totalDurationSeconds = 0;
    let totalDistanceKm = 0;
    let totalSteps = 0;
    let totalActiveKcal = 0;

    let hasDuration = false;
    let hasDistance = false;
    let hasSteps = false;
    let hasActiveKcal = false;

    let indoorSessions = 0;
    let outdoorSessions = 0;
    let walkingSessions = 0;
    let runningSessions = 0;

    for (const session of sessions) {
        const environment = getCanonicalCardioEnvironment(session);

        if (environment === "indoor") indoorSessions += 1;
        if (environment === "outdoor") outdoorSessions += 1;
        if (session.activityType === "walking") walkingSessions += 1;
        if (session.activityType === "running") runningSessions += 1;

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
        indoorSessions,
        outdoorSessions,
        walkingSessions,
        runningSessions,
        totalDurationSeconds: hasDuration ? totalDurationSeconds : null,
        totalDistanceKm: hasDistance ? totalDistanceKm : null,
        totalSteps: hasSteps ? totalSteps : null,
        totalActiveKcal: hasActiveKcal ? totalActiveKcal : null,
    };
}

export function buildCardioRangeSummary(days: WorkoutDay[]): CardioRangeSummary {
    const sessions = days.flatMap((day) => getCardioSessionsFromDay(day));

    const stats = buildCardioDayStats(sessions);

    return {
        totalSessions: stats.sessionsCount,
        totalDurationSeconds: stats.totalDurationSeconds,
        totalDistanceKm: stats.totalDistanceKm,
        totalSteps: stats.totalSteps,
        totalActiveKcal: stats.totalActiveKcal,
        indoorSessions: stats.indoorSessions,
        outdoorSessions: stats.outdoorSessions,
        walkingSessions: stats.walkingSessions,
        runningSessions: stats.runningSessions,
    };
}

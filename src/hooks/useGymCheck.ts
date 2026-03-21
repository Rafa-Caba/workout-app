// src/hooks/useGymCheck.ts

import * as React from "react";
import type { DayKey, ExerciseItem } from "@/utils/routines/plan";
import type { WeightUnit, WorkoutDay, WorkoutExercise, WorkoutExerciseSet, WorkoutSession } from "@/types/workoutDay.types";

export type GymExerciseState = {
    done: boolean;

    // Optional per-exercise additions (stored as strings for input UX)
    notes?: string;
    durationMin?: string;

    // attachments uploaded during gym check (publicIds)
    mediaPublicIds: string[];

    // Real executed sets captured during Gym Check.
    // These are later sent as exercise.sets when creating the real session.
    performedSets: WorkoutExerciseSet[];
};

export type GymDayMetricsState = {
    // Keep as strings for input UX. Convert to number/null only when sending to API.
    startAt: string; // ISO datetime or ""
    endAt: string; // ISO datetime or ""
    activeKcal: string;
    totalKcal: string;
    avgHr: string;
    maxHr: string;
    distanceKm: string;
    steps: string;
    elevationGainM: string;
    paceSecPerKm: string;
    cadenceRpm: string;
    effortRpe: string;

    // TrainingBlock-like day fields
    trainingSource: string;
    dayEffortRpe: string;
};

export type GymDayState = {
    durationMin: string; // keep as string for input UX
    notes: string;
    metrics: GymDayMetricsState;

    exercises: Record<string, GymExerciseState>; // key = exerciseId
};

export type GymWeekState = {
    version: 4; // bumped because we added performedSets
    weekKey: string;
    days: Record<DayKey, GymDayState>;
    updatedAt: string;
};

const STORAGE_PREFIX = "workout-gymcheck";

const EMPTY_EXERCISE: GymExerciseState = { done: false, mediaPublicIds: [], performedSets: [] };

function isBrowser() {
    return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function makeEmptyMetrics(): GymDayMetricsState {
    return {
        startAt: "",
        endAt: "",
        activeKcal: "",
        totalKcal: "",
        avgHr: "",
        maxHr: "",
        distanceKm: "",
        steps: "",
        elevationGainM: "",
        paceSecPerKm: "",
        cadenceRpm: "",
        effortRpe: "",
        trainingSource: "",
        dayEffortRpe: "",
    };
}

function makeEmptyDay(): GymDayState {
    return {
        durationMin: "",
        notes: "",
        metrics: makeEmptyMetrics(),
        exercises: {},
    };
}

function makeEmptyWeek(weekKey: string): GymWeekState {
    return {
        version: 4,
        weekKey,
        days: {
            Mon: makeEmptyDay(),
            Tue: makeEmptyDay(),
            Wed: makeEmptyDay(),
            Thu: makeEmptyDay(),
            Fri: makeEmptyDay(),
            Sat: makeEmptyDay(),
            Sun: makeEmptyDay(),
        },
        updatedAt: new Date().toISOString(),
    };
}

function storageKey(weekKey: string) {
    return `${STORAGE_PREFIX}:${weekKey}`;
}

function toFiniteNumberOrNull(value: unknown): number | null {
    if (typeof value === "number") {
        return Number.isFinite(value) ? value : null;
    }

    if (typeof value !== "string") return null;

    const trimmed = value.trim();
    if (!trimmed) return null;

    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
}

function toIntOrNull(value: unknown): number | null {
    const parsed = toFiniteNumberOrNull(value);
    return parsed === null ? null : Math.trunc(parsed);
}

function safeWeightUnit(value: unknown): WeightUnit {
    return value === "kg" ? "kg" : "lb";
}

function cleanString(value: unknown): string | null {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}

function normalizeTextKey(value: unknown): string {
    const base = cleanString(value) ?? "";
    return base.toLowerCase();
}

function normalizeWorkoutExerciseSet(value: unknown, fallbackIndex: number): WorkoutExerciseSet | null {
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;

    const raw = value as Partial<WorkoutExerciseSet>;

    return {
        setIndex: typeof raw.setIndex === "number" && Number.isFinite(raw.setIndex) && raw.setIndex > 0
            ? Math.trunc(raw.setIndex)
            : fallbackIndex,
        reps: toIntOrNull(raw.reps),
        weight: toFiniteNumberOrNull(raw.weight),
        unit: safeWeightUnit(raw.unit),
        rpe: toFiniteNumberOrNull(raw.rpe),
        isWarmup: raw.isWarmup === true,
        isDropSet: raw.isDropSet === true,
        tempo: typeof raw.tempo === "string" ? raw.tempo : null,
        restSec: toIntOrNull(raw.restSec),
        tags: Array.isArray(raw.tags) ? raw.tags.map((item) => String(item).trim()).filter(Boolean) : null,
        meta: raw.meta && typeof raw.meta === "object" && !Array.isArray(raw.meta)
            ? (raw.meta as Record<string, unknown>)
            : null,
    };
}

function safeWorkoutExerciseSetArray(value: unknown): WorkoutExerciseSet[] {
    if (!Array.isArray(value)) return [];

    return value
        .map((item, index) => normalizeWorkoutExerciseSet(item, index + 1))
        .filter((item): item is WorkoutExerciseSet => item !== null)
        .sort((a, b) => a.setIndex - b.setIndex)
        .map((item, index) => ({ ...item, setIndex: index + 1 }));
}

function safeParse(json: string | null): GymWeekState | null {
    if (!json) return null;

    try {
        const obj = JSON.parse(json);
        if (!obj || typeof obj !== "object") return null;

        // Accept v1/v2/v3/v4 and upgrade to v4
        const version = (obj as any).version;
        if (version !== 1 && version !== 2 && version !== 3 && version !== 4) return null;

        const wk = (obj as any).weekKey;
        if (typeof wk !== "string") return null;

        const days = (obj as any).days;
        if (!days || typeof days !== "object") return null;

        const upgraded: GymWeekState = {
            version: 4,
            weekKey: wk,
            days: days as any,
            updatedAt: typeof (obj as any).updatedAt === "string" ? (obj as any).updatedAt : new Date().toISOString(),
        };

        const dayKeys: DayKey[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

        for (const dk of dayKeys) {
            const d = (upgraded.days as any)[dk];

            if (!d || typeof d !== "object") {
                (upgraded.days as any)[dk] = makeEmptyDay();
                continue;
            }

            const metrics =
                (d as any).metrics && typeof (d as any).metrics === "object"
                    ? { ...makeEmptyMetrics(), ...(d as any).metrics }
                    : makeEmptyMetrics();

            const rawExercises =
                (d as any).exercises && typeof (d as any).exercises === "object" && !Array.isArray((d as any).exercises)
                    ? (d as any).exercises
                    : {};

            const normalizedExercises: Record<string, GymExerciseState> = {};

            for (const [exerciseId, rawEx] of Object.entries(rawExercises)) {
                if (!exerciseId || !rawEx || typeof rawEx !== "object" || Array.isArray(rawEx)) continue;

                normalizedExercises[exerciseId] = {
                    done: (rawEx as any).done === true,
                    ...(typeof (rawEx as any).notes === "string" ? { notes: (rawEx as any).notes } : {}),
                    ...(typeof (rawEx as any).durationMin === "string"
                        ? { durationMin: (rawEx as any).durationMin }
                        : typeof (rawEx as any).durationMin === "number"
                            ? { durationMin: String((rawEx as any).durationMin) }
                            : {}),
                    mediaPublicIds: safeStringArray((rawEx as any).mediaPublicIds),
                    performedSets: safeWorkoutExerciseSetArray((rawEx as any).performedSets),
                };
            }

            (upgraded.days as any)[dk] = {
                ...d,
                metrics,
                exercises: normalizedExercises,
            };
        }

        return upgraded;
    } catch {
        return null;
    }
}

function ensureExercise(day: GymDayState, exerciseId: string): GymExerciseState {
    return day.exercises[exerciseId] ?? EMPTY_EXERCISE;
}

function safeStringArray(v: unknown): string[] {
    if (!Array.isArray(v)) return [];
    return v.map((x) => String(x).trim()).filter(Boolean);
}

// ---------- remote helpers ----------
function numToUiString(v: unknown): string | null {
    if (v === null || v === undefined) return null;
    if (typeof v !== "number" || !Number.isFinite(v)) return null;
    return String(v);
}

function strToUiString(v: unknown): string | null {
    if (typeof v !== "string") return null;
    const s = v.trim();
    return s ? s : null;
}

function parsePlannedSetsCount(input: unknown): number {
    if (typeof input === "number" && Number.isFinite(input) && input > 0) {
        return Math.max(1, Math.trunc(input));
    }

    if (typeof input !== "string") return 1;

    const trimmed = input.trim();
    if (!trimmed) return 1;

    const matched = trimmed.match(/\d+/);
    if (!matched) return 1;

    const parsed = Number(matched[0]);
    if (!Number.isFinite(parsed) || parsed <= 0) return 1;

    return Math.max(1, Math.trunc(parsed));
}

function buildPrefilledPerformedSets(exercise: ExerciseItem, unit: WeightUnit): WorkoutExerciseSet[] {
    const totalSets = parsePlannedSetsCount((exercise as any).sets);
    const plannedLoad = toFiniteNumberOrNull((exercise as any).load);
    const plannedRpe = toFiniteNumberOrNull((exercise as any).rpe);

    return Array.from({ length: totalSets }, (_, index) => ({
        setIndex: index + 1,
        reps: null,
        weight: plannedLoad,
        unit,
        rpe: plannedRpe,
        isWarmup: false,
        isDropSet: false,
        tempo: null,
        restSec: null,
        tags: null,
        meta: null,
    }));
}

type RemoteGymMetrics = Partial<{
    startAt: string | null;
    endAt: string | null;

    activeKcal: number | null;
    totalKcal: number | null;

    avgHr: number | null;
    maxHr: number | null;

    distanceKm: number | null;
    steps: number | null;
    elevationGainM: number | null;

    paceSecPerKm: number | null;
    cadenceRpm: number | null;

    effortRpe: number | null;

    trainingSource: string | null;
    dayEffortRpe: number | null;
}>;

/**
 * ========= Remote Routine meta.gymCheck shape =========
 * Backend stores (extended):
 * meta.gymCheck = {
 *   Mon: {
 *     durationMin: number | null,
 *     notes: string | null,
 *     metrics?: { ... } | null,
 *     trainingSource?: string|null,
 *     dayEffortRpe?: number|null,
 *     exercises: {
 *       [exerciseId]: {
 *         done: boolean | null,
 *         notes: string | null,
 *         durationMin: number | null,
 *         mediaPublicIds: string[] | null,
 *         performedSets?: WorkoutExerciseSet[] | null,
 *         updatedAt: string
 *       }
 *     }
 *   }
 * }
 */
type RemoteGymCheck = Record<
    DayKey,
    {
        durationMin?: number | null;
        notes?: string | null;

        metrics?: RemoteGymMetrics | null;

        // allow BE to store these at day-root too
        trainingSource?: string | null;
        dayEffortRpe?: number | null;

        exercises?:
        | Record<
            string,
            {
                done?: boolean | null;
                notes?: string | null;
                durationMin?: number | null;
                mediaPublicIds?: string[] | null;
                performedSets?: WorkoutExerciseSet[] | null;
                updatedAt?: string | null;
            }
        >
        | null;
        updatedAt?: string | null;
    }
>;

function extractRemoteGymCheck(routine: unknown): RemoteGymCheck | null {
    if (!routine || typeof routine !== "object") return null;

    const meta = (routine as any).meta;
    if (!meta || typeof meta !== "object") return null;

    const gymCheck = (meta as any).gymCheck;
    if (!gymCheck || typeof gymCheck !== "object") return null;

    return gymCheck as RemoteGymCheck;
}

function mergeRemoteMetricsIntoLocal(local: GymDayMetricsState, remoteMetrics: RemoteGymMetrics | null | undefined, remoteDay: any) {
    const base = { ...makeEmptyMetrics(), ...(local ?? makeEmptyMetrics()) };

    const m = remoteMetrics ?? null;

    // Prefer metrics object when present
    const startAt = m ? strToUiString(m.startAt) : null;
    const endAt = m ? strToUiString(m.endAt) : null;

    const activeKcal = m ? numToUiString(m.activeKcal) : null;
    const totalKcal = m ? numToUiString(m.totalKcal) : null;

    const avgHr = m ? numToUiString(m.avgHr) : null;
    const maxHr = m ? numToUiString(m.maxHr) : null;

    const distanceKm = m ? numToUiString(m.distanceKm) : null;
    const steps = m ? numToUiString(m.steps) : null;
    const elevationGainM = m ? numToUiString(m.elevationGainM) : null;

    const paceSecPerKm = m ? numToUiString(m.paceSecPerKm) : null;
    const cadenceRpm = m ? numToUiString(m.cadenceRpm) : null;

    const effortRpe = m ? numToUiString(m.effortRpe) : null;

    // Training source + dayRpe can be stored either inside metrics OR at day root
    const trainingSource =
        (m ? strToUiString(m.trainingSource) : null) ?? strToUiString(remoteDay?.trainingSource);

    const dayEffortRpe =
        (m ? numToUiString(m.dayEffortRpe) : null) ?? numToUiString(remoteDay?.dayEffortRpe);

    return {
        ...base,
        ...(startAt !== null ? { startAt } : {}),
        ...(endAt !== null ? { endAt } : {}),

        ...(activeKcal !== null ? { activeKcal } : {}),
        ...(totalKcal !== null ? { totalKcal } : {}),

        ...(avgHr !== null ? { avgHr } : {}),
        ...(maxHr !== null ? { maxHr } : {}),

        ...(distanceKm !== null ? { distanceKm } : {}),
        ...(steps !== null ? { steps } : {}),

        ...(elevationGainM !== null ? { elevationGainM } : {}),

        ...(paceSecPerKm !== null ? { paceSecPerKm } : {}),
        ...(cadenceRpm !== null ? { cadenceRpm } : {}),

        ...(effortRpe !== null ? { effortRpe } : {}),

        ...(trainingSource !== null ? { trainingSource } : {}),
        ...(dayEffortRpe !== null ? { dayEffortRpe } : {}),
    };
}

function mergeRemoteIntoLocal(prev: GymWeekState, remote: RemoteGymCheck): GymWeekState {
    const next: GymWeekState = { ...prev, days: { ...prev.days } };
    const dayKeys: DayKey[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    for (const dayKey of dayKeys) {
        const rDay = (remote as any)[dayKey];
        if (!rDay || typeof rDay !== "object") continue;

        const localDay = next.days[dayKey] ?? makeEmptyDay();

        const mergedDay: GymDayState = {
            ...localDay,
            durationMin:
                rDay.durationMin === null || rDay.durationMin === undefined ? localDay.durationMin : String(rDay.durationMin),
            notes: typeof rDay.notes === "string" ? rDay.notes : localDay.notes,

            // ✅ THIS WAS MISSING: hydrate metrics from DB
            metrics: mergeRemoteMetricsIntoLocal(localDay.metrics ?? makeEmptyMetrics(), rDay.metrics, rDay),

            exercises: { ...(localDay.exercises ?? {}) },
        };

        const rExercises = rDay.exercises;
        if (rExercises && typeof rExercises === "object" && !Array.isArray(rExercises)) {
            for (const [exerciseId, rEx] of Object.entries(rExercises)) {
                if (!exerciseId) continue;
                const prevEx = mergedDay.exercises[exerciseId] ?? EMPTY_EXERCISE;

                const done =
                    typeof (rEx as any)?.done === "boolean"
                        ? (rEx as any).done
                        : (rEx as any)?.done === null
                            ? prevEx.done
                            : prevEx.done;

                const notes = typeof (rEx as any)?.notes === "string" ? (rEx as any).notes : prevEx.notes;

                const durationMin =
                    typeof (rEx as any)?.durationMin === "number"
                        ? String((rEx as any).durationMin)
                        : (rEx as any)?.durationMin === null
                            ? prevEx.durationMin
                            : prevEx.durationMin;

                const mediaPublicIds =
                    Array.isArray((rEx as any)?.mediaPublicIds)
                        ? safeStringArray((rEx as any).mediaPublicIds)
                        : (rEx as any)?.mediaPublicIds === null
                            ? prevEx.mediaPublicIds
                            : prevEx.mediaPublicIds;

                const performedSets =
                    Array.isArray((rEx as any)?.performedSets)
                        ? safeWorkoutExerciseSetArray((rEx as any).performedSets)
                        : Array.isArray(prevEx.performedSets)
                            ? prevEx.performedSets
                            : [];

                mergedDay.exercises[exerciseId] = {
                    ...prevEx,
                    done,
                    ...(notes !== undefined ? { notes } : {}),
                    ...(durationMin !== undefined ? { durationMin } : {}),
                    mediaPublicIds,
                    performedSets,
                };
            }
        }

        next.days[dayKey] = mergedDay;
    }

    return next;
}

function getLatestGymCheckSession(day: WorkoutDay | null | undefined): WorkoutSession | null {
    const sessions = Array.isArray(day?.training?.sessions) ? day.training.sessions : [];
    const matches = sessions.filter((session) => String(session.meta?.sessionKey ?? "") === "gym_check");
    if (matches.length === 0) return null;
    return matches[matches.length - 1] ?? null;
}

function buildPlannedExerciseMaps(plannedExercises: ExerciseItem[]) {
    const byId = new Map<string, ExerciseItem>();
    const byMovementId = new Map<string, ExerciseItem[]>();
    const byName = new Map<string, ExerciseItem[]>();

    for (const exercise of plannedExercises) {
        const exerciseId = cleanString((exercise as any).id);
        const movementId = cleanString((exercise as any).movementId);
        const name = normalizeTextKey((exercise as any).movementName ?? (exercise as any).name);

        if (exerciseId) {
            byId.set(exerciseId, exercise);
        }

        if (movementId) {
            const list = byMovementId.get(movementId) ?? [];
            list.push(exercise);
            byMovementId.set(movementId, list);
        }

        if (name) {
            const list = byName.get(name) ?? [];
            list.push(exercise);
            byName.set(name, list);
        }
    }

    return { byId, byMovementId, byName };
}

function resolvePlannedExerciseIdForSessionExercise(
    sessionExercise: WorkoutExercise,
    plannedExercises: ExerciseItem[]
): string | null {
    const maps = buildPlannedExerciseMaps(plannedExercises);

    const explicitExerciseId = cleanString((sessionExercise.meta as any)?.gymCheck?.exerciseId);
    if (explicitExerciseId && maps.byId.has(explicitExerciseId)) {
        return explicitExerciseId;
    }

    const movementId = cleanString(sessionExercise.movementId);
    if (movementId) {
        const movementMatches = maps.byMovementId.get(movementId) ?? [];
        if (movementMatches.length === 1) {
            return cleanString((movementMatches[0] as any).id);
        }
    }

    const nameKey = normalizeTextKey(sessionExercise.movementName ?? sessionExercise.name);
    if (nameKey) {
        const nameMatches = maps.byName.get(nameKey) ?? [];
        if (nameMatches.length === 1) {
            return cleanString((nameMatches[0] as any).id);
        }
    }

    return null;
}

export function useGymCheck(weekKey: string) {
    const [state, setState] = React.useState<GymWeekState>(() => {
        const key = storageKey(weekKey);
        const existing = safeParse(isBrowser() ? localStorage.getItem(key) : null);
        return existing?.weekKey === weekKey ? existing : makeEmptyWeek(weekKey);
    });

    React.useEffect(() => {
        const key = storageKey(weekKey);
        const existing = safeParse(isBrowser() ? localStorage.getItem(key) : null);
        setState(existing?.weekKey === weekKey ? existing : makeEmptyWeek(weekKey));
    }, [weekKey]);

    const persist = React.useCallback((next: GymWeekState) => {
        if (!isBrowser()) return;
        const key = storageKey(next.weekKey);
        try {
            localStorage.setItem(key, JSON.stringify(next));
        } catch {
            // ignore
        }
    }, []);

    const update = React.useCallback(
        (fn: (prev: GymWeekState) => GymWeekState) => {
            setState((prev) => {
                const next = fn(prev);
                const stamped: GymWeekState = { ...next, version: 4, updatedAt: new Date().toISOString() };
                persist(stamped);
                return stamped;
            });
        },
        [persist]
    );

    const getDay = React.useCallback(
        (dayKey: DayKey): GymDayState => {
            return state.days[dayKey] ?? makeEmptyDay();
        },
        [state.days]
    );

    const toggleExerciseDone = React.useCallback(
        (dayKey: DayKey, exerciseId: string) => {
            update((prev) => {
                const day = prev.days[dayKey] ?? makeEmptyDay();
                const ex = ensureExercise(day, exerciseId);
                const nextEx: GymExerciseState = { ...ex, done: !ex.done };

                return {
                    ...prev,
                    days: {
                        ...prev.days,
                        [dayKey]: {
                            ...day,
                            exercises: {
                                ...day.exercises,
                                [exerciseId]: nextEx,
                            },
                        },
                    },
                };
            });
        },
        [update]
    );

    const ensureExercisePrefilledFromPlan = React.useCallback(
        (args: {
            dayKey: DayKey;
            exerciseId: string;
            exercise: ExerciseItem;
            unit: WeightUnit;
        }) => {
            update((prev) => {
                const day = prev.days[args.dayKey] ?? makeEmptyDay();
                const ex = ensureExercise(day, args.exerciseId);

                if (Array.isArray(ex.performedSets) && ex.performedSets.length > 0) {
                    return prev;
                }

                const performedSets = buildPrefilledPerformedSets(args.exercise, args.unit);

                return {
                    ...prev,
                    days: {
                        ...prev.days,
                        [args.dayKey]: {
                            ...day,
                            exercises: {
                                ...day.exercises,
                                [args.exerciseId]: {
                                    ...ex,
                                    performedSets,
                                },
                            },
                        },
                    },
                };
            });
        },
        [update]
    );

    const updateExercisePerformedSet = React.useCallback(
        (
            dayKey: DayKey,
            exerciseId: string,
            setIndex: number,
            patch: Partial<WorkoutExerciseSet>
        ) => {
            update((prev) => {
                const day = prev.days[dayKey] ?? makeEmptyDay();
                const ex = ensureExercise(day, exerciseId);
                const currentSets = Array.isArray(ex.performedSets) ? ex.performedSets : [];

                if (setIndex < 0 || setIndex >= currentSets.length) return prev;

                const nextSets = currentSets.map((set, index) =>
                    index === setIndex
                        ? {
                            ...set,
                            ...patch,
                            setIndex: index + 1,
                        }
                        : {
                            ...set,
                            setIndex: index + 1,
                        }
                );

                return {
                    ...prev,
                    days: {
                        ...prev.days,
                        [dayKey]: {
                            ...day,
                            exercises: {
                                ...day.exercises,
                                [exerciseId]: {
                                    ...ex,
                                    performedSets: nextSets,
                                },
                            },
                        },
                    },
                };
            });
        },
        [update]
    );

    const addExercisePerformedSet = React.useCallback(
        (dayKey: DayKey, exerciseId: string, unit: WeightUnit) => {
            update((prev) => {
                const day = prev.days[dayKey] ?? makeEmptyDay();
                const ex = ensureExercise(day, exerciseId);
                const currentSets = Array.isArray(ex.performedSets) ? ex.performedSets : [];
                const lastSet = currentSets[currentSets.length - 1] ?? null;

                const nextSet: WorkoutExerciseSet = {
                    setIndex: currentSets.length + 1,
                    reps: null,
                    weight: lastSet?.weight ?? null,
                    unit: lastSet?.unit ?? unit,
                    rpe: lastSet?.rpe ?? null,
                    isWarmup: false,
                    isDropSet: false,
                    tempo: null,
                    restSec: null,
                    tags: null,
                    meta: null,
                };

                return {
                    ...prev,
                    days: {
                        ...prev.days,
                        [dayKey]: {
                            ...day,
                            exercises: {
                                ...day.exercises,
                                [exerciseId]: {
                                    ...ex,
                                    performedSets: [...currentSets, nextSet],
                                },
                            },
                        },
                    },
                };
            });
        },
        [update]
    );

    const removeExercisePerformedSet = React.useCallback(
        (dayKey: DayKey, exerciseId: string, setIndex: number) => {
            update((prev) => {
                const day = prev.days[dayKey] ?? makeEmptyDay();
                const ex = ensureExercise(day, exerciseId);
                const currentSets = Array.isArray(ex.performedSets) ? ex.performedSets : [];

                if (currentSets.length <= 1) return prev;
                if (setIndex < 0 || setIndex >= currentSets.length) return prev;

                const nextSets = currentSets
                    .filter((_, index) => index !== setIndex)
                    .map((set, index) => ({
                        ...set,
                        setIndex: index + 1,
                    }));

                return {
                    ...prev,
                    days: {
                        ...prev.days,
                        [dayKey]: {
                            ...day,
                            exercises: {
                                ...day.exercises,
                                [exerciseId]: {
                                    ...ex,
                                    performedSets: nextSets,
                                },
                            },
                        },
                    },
                };
            });
        },
        [update]
    );

    const setDayDuration = React.useCallback(
        (dayKey: DayKey, durationMin: string) => {
            update((prev) => {
                const day = prev.days[dayKey] ?? makeEmptyDay();
                return {
                    ...prev,
                    days: {
                        ...prev.days,
                        [dayKey]: { ...day, durationMin },
                    },
                };
            });
        },
        [update]
    );

    const setDayNotes = React.useCallback(
        (dayKey: DayKey, notes: string) => {
            update((prev) => {
                const day = prev.days[dayKey] ?? makeEmptyDay();
                return {
                    ...prev,
                    days: {
                        ...prev.days,
                        [dayKey]: { ...day, notes },
                    },
                };
            });
        },
        [update]
    );

    const setDayMetrics = React.useCallback(
        (dayKey: DayKey, patch: Partial<GymDayMetricsState>) => {
            update((prev) => {
                const day = prev.days[dayKey] ?? makeEmptyDay();
                return {
                    ...prev,
                    days: {
                        ...prev.days,
                        [dayKey]: {
                            ...day,
                            metrics: { ...(day.metrics ?? makeEmptyMetrics()), ...patch },
                        },
                    },
                };
            });
        },
        [update]
    );

    const setExerciseNotes = React.useCallback(
        (dayKey: DayKey, exerciseId: string, notes: string) => {
            update((prev) => {
                const day = prev.days[dayKey] ?? makeEmptyDay();
                const ex = ensureExercise(day, exerciseId);
                return {
                    ...prev,
                    days: {
                        ...prev.days,
                        [dayKey]: {
                            ...day,
                            exercises: {
                                ...day.exercises,
                                [exerciseId]: { ...ex, notes },
                            },
                        },
                    },
                };
            });
        },
        [update]
    );

    const setExerciseDuration = React.useCallback(
        (dayKey: DayKey, exerciseId: string, durationMin: string) => {
            update((prev) => {
                const day = prev.days[dayKey] ?? makeEmptyDay();
                const ex = ensureExercise(day, exerciseId);
                return {
                    ...prev,
                    days: {
                        ...prev.days,
                        [dayKey]: {
                            ...day,
                            exercises: {
                                ...day.exercises,
                                [exerciseId]: { ...ex, durationMin },
                            },
                        },
                    },
                };
            });
        },
        [update]
    );

    const addExerciseMediaPublicId = React.useCallback(
        (dayKey: DayKey, exerciseId: string, publicId: string) => {
            const id = publicId.trim();
            if (!id) return;

            update((prev) => {
                const day = prev.days[dayKey] ?? makeEmptyDay();
                const ex = ensureExercise(day, exerciseId);
                const current = Array.isArray(ex.mediaPublicIds) ? ex.mediaPublicIds : [];
                const nextIds = current.includes(id) ? current : [...current, id];

                return {
                    ...prev,
                    days: {
                        ...prev.days,
                        [dayKey]: {
                            ...day,
                            exercises: {
                                ...day.exercises,
                                [exerciseId]: { ...ex, mediaPublicIds: nextIds },
                            },
                        },
                    },
                };
            });
        },
        [update]
    );

    const removeExerciseMediaAt = React.useCallback(
        (dayKey: DayKey, exerciseId: string, index: number) => {
            update((prev) => {
                const day = prev.days[dayKey] ?? makeEmptyDay();
                const ex = ensureExercise(day, exerciseId);
                const list = Array.isArray(ex.mediaPublicIds) ? ex.mediaPublicIds : [];
                if (index < 0 || index >= list.length) return prev;

                const nextList = list.filter((_, i) => i !== index);
                return {
                    ...prev,
                    days: {
                        ...prev.days,
                        [dayKey]: {
                            ...day,
                            exercises: {
                                ...day.exercises,
                                [exerciseId]: { ...ex, mediaPublicIds: nextList },
                            },
                        },
                    },
                };
            });
        },
        [update]
    );

    const hydrateDayFromWorkoutDay = React.useCallback(
        (args: {
            dayKey: DayKey;
            workoutDay: WorkoutDay | null | undefined;
            plannedExercises: ExerciseItem[];
        }) => {
            const session = getLatestGymCheckSession(args.workoutDay);
            if (!session || !Array.isArray(session.exercises) || session.exercises.length === 0) {
                return;
            }

            update((prev) => {
                const day = prev.days[args.dayKey] ?? makeEmptyDay();
                const nextExercises = { ...(day.exercises ?? {}) };
                let changed = false;

                for (const sessionExercise of session.exercises ?? []) {
                    const plannedExerciseId = resolvePlannedExerciseIdForSessionExercise(sessionExercise, args.plannedExercises);
                    if (!plannedExerciseId) continue;

                    const performedSets = safeWorkoutExerciseSetArray(sessionExercise.sets);
                    if (performedSets.length === 0) continue;

                    const currentExercise = nextExercises[plannedExerciseId] ?? EMPTY_EXERCISE;
                    const currentSerialized = JSON.stringify(currentExercise.performedSets ?? []);
                    const nextSerialized = JSON.stringify(performedSets);

                    if (currentSerialized === nextSerialized && currentExercise.done === true) {
                        continue;
                    }

                    nextExercises[plannedExerciseId] = {
                        ...currentExercise,
                        done: true,
                        performedSets,
                    };

                    changed = true;
                }

                if (!changed) return prev;

                return {
                    ...prev,
                    days: {
                        ...prev.days,
                        [args.dayKey]: {
                            ...day,
                            exercises: nextExercises,
                        },
                    },
                };
            });
        },
        [update]
    );

    const resetWeek = React.useCallback(() => {
        update(() => makeEmptyWeek(weekKey));
    }, [update, weekKey]);

    const clearLocalWeek = React.useCallback((wk: string) => {
        if (!isBrowser()) return;
        try {
            localStorage.removeItem(storageKey(wk));
        } catch {
            // ignore
        }
    }, []);

    /**
     * Hydrate local state from backend routine.meta.gymCheck
     * - merges remote into local (does NOT wipe local)
     * - persists to storage
     */
    const hydrateFromRemote = React.useCallback(
        (routine: unknown) => {
            const remote = extractRemoteGymCheck(routine);
            if (!remote) return;
            update((prev) => mergeRemoteIntoLocal(prev, remote));
        },
        [update]
    );

    return {
        state,
        getDay,

        // exercises
        toggleExerciseDone,
        ensureExercisePrefilledFromPlan,
        updateExercisePerformedSet,
        addExercisePerformedSet,
        removeExercisePerformedSet,
        setExerciseNotes,
        setExerciseDuration,
        addExerciseMediaPublicId,
        removeExerciseMediaAt,

        // day
        setDayDuration,
        setDayNotes,
        setDayMetrics,

        // hydrate
        hydrateFromRemote,
        hydrateDayFromWorkoutDay,

        // misc
        resetWeek,
        clearLocalWeek,
    };
}
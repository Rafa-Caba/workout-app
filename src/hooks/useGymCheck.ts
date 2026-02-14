import * as React from "react";
import type { DayKey } from "@/utils/routines/plan";

export type GymExerciseState = {
    done: boolean;

    // Optional per-exercise additions (stored as strings for input UX)
    notes?: string;
    durationMin?: string;

    // attachments uploaded during gym check (publicIds)
    mediaPublicIds: string[];
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
    version: 3; // bumped because we added day metrics
    weekKey: string;
    days: Record<DayKey, GymDayState>;
    updatedAt: string;
};

const STORAGE_PREFIX = "workout-gymcheck";

const EMPTY_EXERCISE: GymExerciseState = { done: false, mediaPublicIds: [] };

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
        version: 3,
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

function safeParse(json: string | null): GymWeekState | null {
    if (!json) return null;

    try {
        const obj = JSON.parse(json);
        if (!obj || typeof obj !== "object") return null;

        // Accept v1/v2/v3 and upgrade to v3
        const version = (obj as any).version;
        if (version !== 1 && version !== 2 && version !== 3) return null;

        const wk = (obj as any).weekKey;
        if (typeof wk !== "string") return null;

        const days = (obj as any).days;
        if (!days || typeof days !== "object") return null;

        // Upgrade v1/v2 -> v3
        if (version === 1 || version === 2) {
            const upgraded: GymWeekState = {
                version: 3,
                weekKey: wk,
                days: days as any,
                updatedAt: typeof (obj as any).updatedAt === "string" ? (obj as any).updatedAt : new Date().toISOString(),
            };

            // Ensure metrics exists per day (backfill)
            const dayKeys: DayKey[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
            for (const dk of dayKeys) {
                const d = (upgraded.days as any)[dk];
                if (!d || typeof d !== "object") {
                    (upgraded.days as any)[dk] = makeEmptyDay();
                    continue;
                }
                if (!(d as any).metrics || typeof (d as any).metrics !== "object") {
                    (upgraded.days as any)[dk] = { ...d, metrics: makeEmptyMetrics() };
                } else {
                    (upgraded.days as any)[dk] = { ...d, metrics: { ...makeEmptyMetrics(), ...(d as any).metrics } };
                }
            }

            return upgraded;
        }

        // version === 3
        // Backfill metrics if missing (defensive)
        const out = obj as GymWeekState;
        const dayKeys: DayKey[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        for (const dk of dayKeys) {
            const d = (out.days as any)[dk];
            if (!d || typeof d !== "object") {
                (out.days as any)[dk] = makeEmptyDay();
                continue;
            }
            if (!(d as any).metrics || typeof (d as any).metrics !== "object") {
                (out.days as any)[dk] = { ...d, metrics: makeEmptyMetrics() };
            } else {
                (out.days as any)[dk] = { ...d, metrics: { ...makeEmptyMetrics(), ...(d as any).metrics } };
            }
        }

        return out;
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

                mergedDay.exercises[exerciseId] = {
                    ...prevEx,
                    done,
                    ...(notes !== undefined ? { notes } : {}),
                    ...(durationMin !== undefined ? { durationMin } : {}),
                    mediaPublicIds,
                };
            }
        }

        next.days[dayKey] = mergedDay;
    }

    return next;
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
                const stamped: GymWeekState = { ...next, version: 3, updatedAt: new Date().toISOString() };
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
        setExerciseNotes,
        setExerciseDuration,
        addExerciseMediaPublicId,
        removeExerciseMediaAt,

        // day
        setDayDuration,
        setDayNotes,
        setDayMetrics,

        // misc
        resetWeek,
        hydrateFromRemote,
        clearLocalWeek,
    };
}

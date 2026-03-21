// src/hooks/useSyncGymCheckDay.ts

import { useMutation } from "@tanstack/react-query";
import type { ApiError } from "@/api/httpErrors";
import type { DayKey } from "@/utils/routines/plan";
import { syncGymCheckDay } from "@/services/workout/gymCheck.service";
import type { WorkoutExerciseSet } from "@/types/workoutDay.types";

type GymExerciseState = {
    done: boolean;
    notes?: string;
    durationMin?: string;
    mediaPublicIds: string[];
    performedSets?: WorkoutExerciseSet[];
};

type GymDayMetricsState = {
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

    trainingSource: string;
    dayEffortRpe: string;
};

type GymDayState = {
    durationMin: string;
    notes: string;
    metrics: GymDayMetricsState;
    exercises: Record<string, GymExerciseState>;
};

// ---------- helpers ----------
function strOrNull(v: unknown): string | null {
    if (typeof v !== "string") return null;
    const s = v.trim();
    return s.length ? s : null;
}

function isoOrNull(v: unknown): string | null {
    // "" -> null, otherwise string trimmed.
    return strOrNull(v);
}

function numOrNull(v: unknown): number | null {
    if (v === null || v === undefined) return null;
    if (typeof v === "number") {
        return Number.isFinite(v) ? v : null;
    }
    if (typeof v !== "string") return null;
    const s = v.trim();
    if (!s) return null;

    const n = Number(s);
    if (!Number.isFinite(n)) return null;
    return n;
}

function intOrNull(v: unknown): number | null {
    const n = numOrNull(v);
    if (n === null) return null;
    return Math.trunc(n);
}

function arrayOrNull(v: unknown): string[] | null {
    if (!Array.isArray(v)) return null;
    const out = v.map((x) => String(x).trim()).filter(Boolean);
    return out.length ? out : null;
}

function normalizePerformedSets(value: unknown): WorkoutExerciseSet[] | null {
    if (!Array.isArray(value)) return null;

    const items = value
        .map((item, index) => {
            if (!item || typeof item !== "object" || Array.isArray(item)) return null;

            const raw = item as Partial<WorkoutExerciseSet>;

            return {
                setIndex:
                    typeof raw.setIndex === "number" && Number.isFinite(raw.setIndex) && raw.setIndex > 0
                        ? Math.trunc(raw.setIndex)
                        : index + 1,
                reps: typeof raw.reps === "number" && Number.isFinite(raw.reps) ? Math.trunc(raw.reps) : null,
                weight: typeof raw.weight === "number" && Number.isFinite(raw.weight) ? raw.weight : null,
                unit: raw.unit === "kg" ? "kg" : "lb",
                rpe: typeof raw.rpe === "number" && Number.isFinite(raw.rpe) ? raw.rpe : null,
                isWarmup: raw.isWarmup === true,
                isDropSet: raw.isDropSet === true,
                tempo: typeof raw.tempo === "string" ? raw.tempo : null,
                restSec: typeof raw.restSec === "number" && Number.isFinite(raw.restSec) ? Math.trunc(raw.restSec) : null,
                tags: Array.isArray(raw.tags) ? raw.tags.map((tag) => String(tag).trim()).filter(Boolean) : null,
                meta: raw.meta && typeof raw.meta === "object" && !Array.isArray(raw.meta)
                    ? (raw.meta as Record<string, unknown>)
                    : null,
            } satisfies WorkoutExerciseSet;
        })
        .filter((item): item is WorkoutExerciseSet => item !== null)
        .map((item, index) => ({
            ...item,
            setIndex: index + 1,
        }));

    return items.length > 0 ? items : null;
}

/**
 * Convert local GymDayState (string-based inputs) into BE patch payload.
 */
function toPatchPayload(gymDay: GymDayState) {
    const durationMin = numOrNull(gymDay.durationMin);
    const notes = strOrNull(gymDay.notes);

    const m = gymDay.metrics ?? ({} as GymDayMetricsState);

    const metrics = {
        startAt: isoOrNull(m.startAt),
        endAt: isoOrNull(m.endAt),

        activeKcal: numOrNull(m.activeKcal),
        totalKcal: numOrNull(m.totalKcal),

        avgHr: intOrNull(m.avgHr),
        maxHr: intOrNull(m.maxHr),

        distanceKm: numOrNull(m.distanceKm),
        steps: intOrNull(m.steps),
        elevationGainM: numOrNull(m.elevationGainM),

        paceSecPerKm: intOrNull(m.paceSecPerKm),
        cadenceRpm: intOrNull(m.cadenceRpm),

        effortRpe: numOrNull(m.effortRpe),

        trainingSource: strOrNull(m.trainingSource),
        dayEffortRpe: numOrNull(m.dayEffortRpe),
    };

    const exercises: Record<
        string,
        {
            done?: boolean | null;
            notes?: string | null;
            durationMin?: number | null;
            mediaPublicIds?: string[] | null;
            performedSets?: WorkoutExerciseSet[] | null;
        }
    > = {};

    for (const [exerciseId, ex] of Object.entries(gymDay.exercises ?? {})) {
        if (!exerciseId) continue;

        exercises[exerciseId] = {
            done: typeof ex.done === "boolean" ? ex.done : null,
            notes: strOrNull(ex.notes),
            durationMin: numOrNull(ex.durationMin),
            mediaPublicIds: arrayOrNull(ex.mediaPublicIds) ?? null,
            performedSets: normalizePerformedSets(ex.performedSets),
        };
    }

    return {
        durationMin,
        notes,
        metrics,
        exercises,
    };
}

/**
 * IMPORTANT UX RULE:
 * - This mutation must NOT invalidate/refetch routineWeek automatically.
 * - The page decides when to refetch (only on explicit Save / Create Session).
 */
export function useSyncGymCheckDay(weekKey: string) {
    return useMutation<unknown, ApiError, { routine: unknown; dayKey: DayKey; gymDay: GymDayState }>({
        mutationFn: async ({ dayKey, gymDay }) => {
            const payload = toPatchPayload(gymDay);
            return syncGymCheckDay(weekKey, dayKey, payload as any);
        },
    });
}
// src/services/workout/gymCheck.service.ts

import { api } from "@/api/axios";
import type {
    GymCheckDayPatchBody,
    GymCheckExercisePatch,
    GymCheckMetricsPatch,
    GymDayState,
} from "@/types/gymCheck.types";
import type { WorkoutExerciseSet } from "@/types/workoutDay.types";
import type { DayKey, WorkoutRoutineWeek } from "@/types/workoutRoutine.types";

/**
 * We support two caller styles:
 * 1) Old: GymDayState with strings (UX inputs)
 * 2) New: Already-clean patch payload (numbers/null) from useSyncGymCheckDay
 */

// -------------------- Helpers --------------------

function isPlainObject(v: unknown): v is Record<string, unknown> {
    return typeof v === "object" && v !== null && !Array.isArray(v);
}

function toNumberOrNull(v: unknown): number | null {
    const s = String(v ?? "").trim();
    if (!s) return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
}

function toIntOrNull(v: unknown): number | null {
    const n = toNumberOrNull(v);
    if (n === null) return null;
    return Math.trunc(n);
}

function toStringOrNull(v: unknown): string | null {
    if (v === null || v === undefined) return null;
    const s = String(v).trim();
    return s.length ? s : null;
}

function toStringArrayOrNull(v: unknown): string[] | null {
    if (v === null) return null;
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
 * If caller already sends the "clean" payload (numbers/null + metrics),
 * we should pass it through without stripping fields.
 */
function looksLikeCleanPatch(input: unknown): input is GymCheckDayPatchBody {
    if (!isPlainObject(input)) return false;

    // Heuristic: if it has "metrics" as object/null OR durationMin as number/null.
    const hasMetrics = "metrics" in input;
    const dm = (input as any).durationMin;
    const hasNumberDuration = typeof dm === "number" || dm === null;

    return hasMetrics || hasNumberDuration;
}

/**
 * Convert old GymDayState (string inputs) into new GymCheckDayPatchBody
 * that BE accepts (numbers/null + metrics).
 */
function buildPatchFromGymDayState(gymDay: GymDayState): GymCheckDayPatchBody {
    const exercises: Record<string, GymCheckExercisePatch> = {};

    for (const [exerciseId, st] of Object.entries(gymDay.exercises ?? {})) {
        if (!exerciseId) continue;

        exercises[exerciseId] = {
            done: typeof st?.done === "boolean" ? Boolean(st.done) : null,
            notes: toStringOrNull((st as any)?.notes),
            durationMin: toNumberOrNull((st as any)?.durationMin),
            mediaPublicIds: toStringArrayOrNull((st as any)?.mediaPublicIds) ?? null,
            performedSets: normalizePerformedSets((st as any)?.performedSets),
        };
    }

    const m = gymDay.metrics ?? {};

    const metrics: GymCheckMetricsPatch = {
        startAt: toStringOrNull((m as any).startAt),
        endAt: toStringOrNull((m as any).endAt),

        activeKcal: toNumberOrNull((m as any).activeKcal),
        totalKcal: toNumberOrNull((m as any).totalKcal),

        avgHr: toIntOrNull((m as any).avgHr),
        maxHr: toIntOrNull((m as any).maxHr),

        distanceKm: toNumberOrNull((m as any).distanceKm),
        steps: toIntOrNull((m as any).steps),
        elevationGainM: toNumberOrNull((m as any).elevationGainM),

        paceSecPerKm: toIntOrNull((m as any).paceSecPerKm),
        cadenceRpm: toIntOrNull((m as any).cadenceRpm),

        effortRpe: toNumberOrNull((m as any).effortRpe),

        trainingSource: toStringOrNull((m as any).trainingSource),
        dayEffortRpe: toNumberOrNull((m as any).dayEffortRpe),
    };

    return {
        durationMin: toNumberOrNull(gymDay.durationMin),
        notes: toStringOrNull(gymDay.notes),
        metrics,
        exercises,
    };
}

// -------------------- API --------------------

export async function syncGymCheckDay(
    weekKey: string,
    dayKey: DayKey,
    input: GymDayState | GymCheckDayPatchBody
): Promise<WorkoutRoutineWeek> {
    const payload: GymCheckDayPatchBody = looksLikeCleanPatch(input)
        ? (input as GymCheckDayPatchBody)
        : buildPatchFromGymDayState(input as GymDayState);

    const res = await api.patch(
        `/workout/routines/weeks/${encodeURIComponent(weekKey)}/gym-check/${encodeURIComponent(dayKey)}`,
        payload
    );

    return res.data as WorkoutRoutineWeek;
}
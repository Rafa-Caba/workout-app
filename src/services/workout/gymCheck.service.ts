import { api } from "@/api/axios";
import type { DayKey } from "@/utils/routines/plan";

/**
 * We support two caller styles:
 * 1) Old: GymDayState with strings (UX inputs)
 * 2) New: Already-clean patch payload (numbers/null) from useSyncGymCheckDay
 */

// -------------------- Types --------------------

type GymExerciseState = {
    done: boolean;
    notes?: string;
    durationMin?: string;
    mediaPublicIds: string[];
};

type GymDayMetricsState = {
    startAt?: string;
    endAt?: string;

    activeKcal?: string;
    totalKcal?: string;

    avgHr?: string;
    maxHr?: string;

    distanceKm?: string;
    steps?: string;
    elevationGainM?: string;

    paceSecPerKm?: string;
    cadenceRpm?: string;

    effortRpe?: string;

    trainingSource?: string;
    dayEffortRpe?: string;
};

type GymDayState = {
    durationMin: string;
    notes: string;
    metrics?: GymDayMetricsState;
    exercises: Record<string, GymExerciseState>;
};

// Clean patch payload (what BE expects after our upgrades)
export type GymCheckExercisePatch = {
    done?: boolean | null;
    notes?: string | null;
    durationMin?: number | null;
    mediaPublicIds?: string[] | null;
};

export type GymCheckMetricsPatch = {
    startAt?: string | null;
    endAt?: string | null;

    activeKcal?: number | null;
    totalKcal?: number | null;

    avgHr?: number | null;
    maxHr?: number | null;

    distanceKm?: number | null;
    steps?: number | null;
    elevationGainM?: number | null;

    paceSecPerKm?: number | null;
    cadenceRpm?: number | null;

    effortRpe?: number | null;

    trainingSource?: string | null;
    dayEffortRpe?: number | null;
};

export type GymCheckDayPatchBody = {
    durationMin?: number | null;
    notes?: string | null;
    metrics?: GymCheckMetricsPatch | null;
    exercises?: Record<string, GymCheckExercisePatch> | null;
};

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
): Promise<unknown> {
    const payload: GymCheckDayPatchBody = looksLikeCleanPatch(input)
        ? (input as GymCheckDayPatchBody)
        : buildPatchFromGymDayState(input as GymDayState);

    const res = await api.patch(
        `/workout/routines/weeks/${encodeURIComponent(weekKey)}/gym-check/${encodeURIComponent(dayKey)}`,
        payload
    );

    return res.data;
}

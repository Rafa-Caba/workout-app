import type { DayKey, DayPlan, ExerciseItem } from "@/utils/routines/plan";
import { getPlanFromMeta, DAY_KEYS } from "@/utils/routines/plan";

type AnyRecord = Record<string, unknown>;

function isRecord(v: unknown): v is AnyRecord {
    return typeof v === "object" && v !== null && !Array.isArray(v);
}

function cleanStrOrNull(v: unknown): string | null {
    if (typeof v !== "string") return null;
    const s = v.trim();
    return s.length ? s : null;
}

function toIntOrNull(v: unknown): number | null {
    if (v === null || v === undefined || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? Math.trunc(n) : null;
}

function getRoutineMeta(routine: unknown): AnyRecord | null {
    if (!isRecord(routine)) return null;
    const meta = (routine as any).meta;
    return isRecord(meta) ? meta : null;
}

function getGymCheckDay(meta: AnyRecord | null, dayKey: DayKey): AnyRecord | null {
    if (!meta) return null;
    const gc = (meta as any).gymCheck;
    if (!isRecord(gc)) return null;
    const day = (gc as any)[dayKey];
    return isRecord(day) ? day : null;
}

function getGymCheckExercisesMap(gymDay: AnyRecord | null): Record<string, AnyRecord> {
    if (!gymDay) return {};
    const ex = (gymDay as any).exercises;
    if (!isRecord(ex)) return {};
    const out: Record<string, AnyRecord> = {};
    for (const [k, v] of Object.entries(ex)) {
        if (isRecord(v)) out[k] = v;
    }
    return out;
}

export type CreateWorkoutSessionExercise = {
    name: string;
    sets: number | null;
    reps: string | null;
    load: string | null;
    notes: string | null;
    mediaPublicIds: string[] | null;
};

export type CreateWorkoutSessionBody = {
    type: string; // session type shown in Days + PVA actual
    durationSeconds: number | null;
    notes: string | null;
    exercises: CreateWorkoutSessionExercise[]; // ONLY done exercises
    meta: {
        source: "gymCheck";
        weekKey: string;
        dayKey: DayKey;
        routineWeekKey: string;
    };
};

export function buildGymCheckSessionFromRoutine(args: {
    routine: unknown;
    weekKey: string;
    dayKey: DayKey;
    includeOnlyDone: true; // locked for now
}): { ok: true; body: CreateWorkoutSessionBody } | { ok: false; reason: string } {
    const { routine, weekKey, dayKey } = args;

    if (!DAY_KEYS.includes(dayKey)) return { ok: false, reason: "Invalid dayKey." };

    const meta = getRoutineMeta(routine);
    const plans: DayPlan[] = getPlanFromMeta(meta);

    const plan = plans.find((p) => p.dayKey === dayKey) ?? ({ dayKey } as DayPlan);
    const plannedExercises: ExerciseItem[] = Array.isArray(plan.exercises) ? plan.exercises : [];

    const gymDay = getGymCheckDay(meta, dayKey);
    const gymExercises = getGymCheckExercisesMap(gymDay);

    const durationMin = toIntOrNull((gymDay as any)?.durationMin);
    const dayNotes = cleanStrOrNull((gymDay as any)?.notes);

    const doneExercises: CreateWorkoutSessionExercise[] = plannedExercises
        .map((ex) => {
            const id = typeof ex?.id === "string" ? ex.id : "";
            if (!id) return null;

            const st = gymExercises[id];
            const done = st?.done === true;
            if (!done) return null;

            const mediaPublicIdsRaw = st?.mediaPublicIds;
            const mediaPublicIds =
                Array.isArray(mediaPublicIdsRaw) && mediaPublicIdsRaw.length
                    ? mediaPublicIdsRaw.map((x) => String(x).trim()).filter(Boolean)
                    : null;

            const exNotes = cleanStrOrNull(st?.notes) ?? cleanStrOrNull(ex?.notes) ?? null;

            return {
                name: String(ex?.name ?? "").trim() || "Exercise",
                sets: ex?.sets ? Number(ex.sets) : null,
                reps: cleanStrOrNull(ex?.reps) ?? null,
                load: cleanStrOrNull(ex?.load) ?? null,
                notes: exNotes,
                mediaPublicIds,
            };
        })
        .filter((x): x is CreateWorkoutSessionExercise => Boolean(x));

    if (doneExercises.length === 0) {
        return { ok: false, reason: "No done exercises found in Gym Check for this day." };
    }

    const sessionType = cleanStrOrNull(plan.sessionType) ?? "Gym Check";
    const durationSeconds = durationMin !== null ? durationMin * 60 : null;

    const body: CreateWorkoutSessionBody = {
        type: sessionType,
        durationSeconds,
        notes: dayNotes,
        exercises: doneExercises,
        meta: {
            source: "gymCheck",
            weekKey,
            dayKey,
            routineWeekKey: weekKey,
        },
    };

    return { ok: true, body };
}

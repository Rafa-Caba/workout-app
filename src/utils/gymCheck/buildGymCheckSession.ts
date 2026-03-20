import type { DayKey, DayPlan, ExerciseItem } from "@/utils/routines/plan";
import { DAY_KEYS, getPlanFromMeta } from "@/utils/routines/plan";
import type {
    CreateSessionBody,
    CreateSessionExerciseInput,
} from "@/services/workout/sessions.service";

type JsonRecord = Record<string, unknown>;

type RoutineWithMeta = {
    meta?: JsonRecord | null;
};

type GymCheckExerciseRemote = {
    done?: boolean | null;
    notes?: string | null;
    durationMin?: number | null;
    mediaPublicIds?: string[] | null;
};

type GymCheckDayRemote = {
    durationMin?: number | null;
    notes?: string | null;
    exercises?: Record<string, GymCheckExerciseRemote> | null;
};

function isRecord(value: unknown): value is JsonRecord {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cleanString(value: unknown): string | null {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}

function toIntOrNull(value: unknown): number | null {
    if (typeof value !== "number" || !Number.isFinite(value)) return null;
    return Math.trunc(value);
}

function getRoutineMeta(routine: unknown): JsonRecord | null {
    if (!isRecord(routine)) return null;

    const routineWithMeta = routine as RoutineWithMeta;
    return isRecord(routineWithMeta.meta) ? routineWithMeta.meta : null;
}

function getGymCheckDay(meta: JsonRecord | null, dayKey: DayKey): GymCheckDayRemote | null {
    if (!meta) return null;

    const gymCheck = meta.gymCheck;
    if (!isRecord(gymCheck)) return null;

    const day = gymCheck[dayKey];
    return isRecord(day) ? (day as GymCheckDayRemote) : null;
}

function getExerciseStateMap(
    gymDay: GymCheckDayRemote | null
): Record<string, GymCheckExerciseRemote> {
    if (!gymDay?.exercises || !isRecord(gymDay.exercises)) {
        return {};
    }

    return gymDay.exercises;
}

function buildExerciseMeta(args: {
    exercise: ExerciseItem;
    remoteState: GymCheckExerciseRemote;
}): Record<string, unknown> {
    const { exercise, remoteState } = args;

    return {
        gymCheck: {
            done: true,
            durationMin: toIntOrNull(remoteState.durationMin),
            mediaPublicIds: Array.isArray(remoteState.mediaPublicIds)
                ? remoteState.mediaPublicIds.map((item) => String(item).trim()).filter(Boolean)
                : null,
        },
        plan: {
            sets: cleanString(exercise.sets) ?? null,
            reps: cleanString(exercise.reps) ?? null,
            load: cleanString(exercise.load) ?? null,
            rpe: cleanString(exercise.rpe) ?? null,
            attachmentPublicIds: Array.isArray(exercise.attachmentPublicIds)
                ? exercise.attachmentPublicIds.map((item) => String(item).trim()).filter(Boolean)
                : null,
        },
    };
}

function buildDoneExercise(args: {
    exercise: ExerciseItem;
    remoteState: GymCheckExerciseRemote | undefined;
}): CreateSessionExerciseInput | null {
    const { exercise, remoteState } = args;

    const exerciseId = typeof exercise.id === "string" ? exercise.id.trim() : "";
    if (!exerciseId) return null;

    if (!remoteState?.done) return null;

    return {
        name: cleanString(exercise.name) ?? "Exercise",
        movementId: cleanString(exercise.movementId) ?? null,
        movementName: cleanString(exercise.movementName) ?? null,
        notes: cleanString(remoteState.notes) ?? cleanString(exercise.notes) ?? null,
        sets: null,
        meta: buildExerciseMeta({
            exercise,
            remoteState,
        }),
    };
}

export function buildGymCheckSessionFromRoutine(args: {
    routine: unknown;
    weekKey: string;
    dayKey: DayKey;
    includeOnlyDone: true;
}): { ok: true; body: CreateSessionBody } | { ok: false; reason: string } {
    const { routine, weekKey, dayKey } = args;

    if (!DAY_KEYS.includes(dayKey)) {
        return { ok: false, reason: "Invalid dayKey." };
    }

    const meta = getRoutineMeta(routine);
    const plans: DayPlan[] = getPlanFromMeta(meta);
    const plan = plans.find((item) => item.dayKey === dayKey) ?? ({ dayKey } as DayPlan);

    const plannedExercises: ExerciseItem[] = Array.isArray(plan.exercises) ? plan.exercises : [];
    const gymDay = getGymCheckDay(meta, dayKey);
    const exerciseStateMap = getExerciseStateMap(gymDay);

    const exercises = plannedExercises.reduce<CreateSessionExerciseInput[]>((acc, exercise) => {
        const exerciseId = typeof exercise.id === "string" ? exercise.id.trim() : "";
        const remoteState = exerciseId ? exerciseStateMap[exerciseId] : undefined;

        const built = buildDoneExercise({
            exercise,
            remoteState,
        });

        if (built) {
            acc.push(built);
        }

        return acc;
    }, []);

    if (exercises.length === 0) {
        return { ok: false, reason: "No done exercises found in Gym Check for this day." };
    }

    const durationSeconds = toIntOrNull(gymDay?.durationMin);
    const body: CreateSessionBody = {
        type: cleanString(plan.sessionType) ?? "Gym Check",
        durationSeconds: durationSeconds !== null ? durationSeconds * 60 : null,
        notes: cleanString(gymDay?.notes) ?? null,
        exercises,
        meta: {
            source: "gymCheck",
            weekKey,
            dayKey,
            routineWeekKey: weekKey,
            sessionKey: "gym_check",
        },
    };

    return { ok: true, body };
}
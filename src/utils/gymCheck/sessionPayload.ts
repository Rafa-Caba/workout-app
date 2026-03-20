import { addDays, format } from "date-fns";
import type { GymDayState, GymExerciseState } from "@/hooks/useGymCheck";
import type { AttachmentOption } from "@/utils/routines/attachments";
import type { DayKey, DayPlan, ExerciseItem } from "@/utils/routines/plan";
import { DAY_KEYS } from "@/utils/routines/plan";
import type {
    AttachMediaItem,
    CreateSessionBody,
    CreateSessionExerciseInput,
} from "@/services/workout/sessions.service";
import { weekKeyToStartDate } from "@/utils/weekKey";

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cleanString(value: unknown): string | null {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}

function toNumberOrNull(value: unknown): number | null {
    if (value === null || value === undefined) return null;

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
    const parsed = toNumberOrNull(value);
    return parsed === null ? null : Math.trunc(parsed);
}

function toStringArrayOrNull(value: unknown): string[] | null {
    if (!Array.isArray(value)) return null;

    const items = value
        .map((item) => String(item).trim())
        .filter((item) => item.length > 0);

    return items.length > 0 ? items : null;
}

function getOptionalStringField(source: unknown, key: string): string | null {
    if (!isRecord(source)) return null;
    return cleanString(source[key]);
}

function getAttachmentResourceType(source: unknown): "image" | "video" {
    if (!isRecord(source)) return "image";
    return source["resourceType"] === "video" ? "video" : "image";
}

function getExerciseState(
    gymDay: GymDayState | null | undefined,
    exerciseId: string
): GymExerciseState | null {
    if (!gymDay) return null;
    return gymDay.exercises[exerciseId] ?? null;
}

function buildExerciseMeta(args: {
    exercise: ExerciseItem;
    exerciseState: GymExerciseState;
}): Record<string, unknown> | null {
    const { exercise, exerciseState } = args;

    const plannedSets = cleanString(exercise.sets) ?? null;
    const plannedReps = cleanString(exercise.reps) ?? null;
    const plannedLoad = cleanString(exercise.load) ?? null;
    const plannedRpe = cleanString(exercise.rpe) ?? null;
    const plannedAttachmentPublicIds = toStringArrayOrNull(exercise.attachmentPublicIds);
    const mediaPublicIds = toStringArrayOrNull(exerciseState.mediaPublicIds);
    const durationMin = toIntOrNull(exerciseState.durationMin);

    return {
        gymCheck: {
            done: true,
            durationMin,
            mediaPublicIds,
        },
        plan: {
            sets: plannedSets,
            reps: plannedReps,
            load: plannedLoad,
            rpe: plannedRpe,
            attachmentPublicIds: plannedAttachmentPublicIds,
        },
    };
}

function buildDoneExercise(args: {
    exercise: ExerciseItem;
    gymDay: GymDayState;
}): CreateSessionExerciseInput | null {
    const { exercise, gymDay } = args;

    const exerciseId = typeof exercise.id === "string" ? exercise.id.trim() : "";
    if (!exerciseId) return null;

    const exerciseState = getExerciseState(gymDay, exerciseId);
    if (!exerciseState?.done) return null;

    const notes = cleanString(exerciseState.notes) ?? cleanString(exercise.notes) ?? null;

    return {
        name: cleanString(exercise.name) ?? "Exercise",
        movementId: cleanString(exercise.movementId) ?? null,
        movementName: cleanString(exercise.movementName) ?? null,
        notes,
        sets: null,
        meta: buildExerciseMeta({ exercise, exerciseState }),
    };
}

function buildDoneExercises(
    plan: DayPlan | null | undefined,
    gymDay: GymDayState
): CreateSessionExerciseInput[] {
    const plannedExercises = Array.isArray(plan?.exercises) ? plan.exercises : [];

    return plannedExercises.reduce<CreateSessionExerciseInput[]>((acc, exercise) => {
        const built = buildDoneExercise({ exercise, gymDay });
        if (built) {
            acc.push(built);
        }
        return acc;
    }, []);
}

export function dayKeyToDateIso(weekKey: string, dayKey: DayKey): string | null {
    const start = weekKeyToStartDate(weekKey);
    if (!start) return null;

    const idx = DAY_KEYS.indexOf(dayKey);
    if (idx < 0) return null;

    return format(addDays(start, idx), "yyyy-MM-dd");
}

export function parseDurationMinutesToSeconds(input: unknown): number | undefined {
    const minutes = toNumberOrNull(input);
    if (minutes === null || minutes <= 0) return undefined;

    return Math.round(minutes) * 60;
}

export function buildAttachMediaItemsFromGymDay(args: {
    gymDay: GymDayState;
    attachmentByPublicId: Map<string, AttachMediaItem>;
}): AttachMediaItem[] {
    const out: AttachMediaItem[] = [];
    const seen = new Set<string>();

    const exerciseStates = Object.values(args.gymDay.exercises);

    for (const exerciseState of exerciseStates) {
        if (!exerciseState.done) continue;

        for (const publicIdRaw of exerciseState.mediaPublicIds) {
            const publicId = publicIdRaw.trim();
            if (!publicId || seen.has(publicId)) continue;

            const attachment = args.attachmentByPublicId.get(publicId);
            if (!attachment) continue;

            const url = cleanString(attachment.url);
            if (!url) continue;

            seen.add(publicId);

            const mediaItem: AttachMediaItem = {
                publicId,
                url,
                resourceType: getAttachmentResourceType(attachment),
            };

            const formatValue = getOptionalStringField(attachment, "format");
            if (formatValue !== null) {
                mediaItem.format = formatValue;
            }

            const createdAtValue = getOptionalStringField(attachment, "createdAt");
            if (createdAtValue !== null) {
                mediaItem.createdAt = createdAtValue;
            }

            if (isRecord(attachment)) {
                const metaValue = attachment["meta"];
                if (isRecord(metaValue) || metaValue === null) {
                    mediaItem.meta = metaValue;
                }
            }

            out.push(mediaItem);
        }
    }

    return out;
}

export function buildGymCheckSessionPayload(args: {
    gymDay: GymDayState;
    plan: DayPlan | null | undefined;
    fallbackType: string;
}): CreateSessionBody | null {
    const { gymDay, plan, fallbackType } = args;

    const exercises = buildDoneExercises(plan, gymDay);
    if (exercises.length === 0) {
        return null;
    }

    const metrics = gymDay.metrics;
    const durationSeconds = parseDurationMinutesToSeconds(gymDay.durationMin);

    return {
        type: cleanString(plan?.sessionType) ?? fallbackType,
        durationSeconds: typeof durationSeconds === "number" ? durationSeconds : null,
        notes: cleanString(gymDay.notes) ?? null,
        startAt: cleanString(metrics.startAt) ?? null,
        endAt: cleanString(metrics.endAt) ?? null,
        activeKcal: toNumberOrNull(metrics.activeKcal),
        totalKcal: toNumberOrNull(metrics.totalKcal),
        avgHr: toIntOrNull(metrics.avgHr),
        maxHr: toIntOrNull(metrics.maxHr),
        distanceKm: toNumberOrNull(metrics.distanceKm),
        steps: toIntOrNull(metrics.steps),
        elevationGainM: toNumberOrNull(metrics.elevationGainM),
        paceSecPerKm: toIntOrNull(metrics.paceSecPerKm),
        cadenceRpm: toIntOrNull(metrics.cadenceRpm),
        effortRpe: toNumberOrNull(metrics.effortRpe),
        exercises,
        meta: {
            sessionKey: "gym_check",
            trainingSource: cleanString(metrics.trainingSource) ?? null,
            dayEffortRpe: toNumberOrNull(metrics.dayEffortRpe),
        },
    };
}
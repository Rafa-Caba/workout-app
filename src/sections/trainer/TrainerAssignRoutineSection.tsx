// src/sections/trainer/TrainerAssignRoutineSection.tsx
// MUI routine assignment section for trainer flow.
// Form mode edits one trainee day. JSON mode edits a trainee week payload and saves it by merging day-by-day.

import React from "react";
import { addDays, format, getISODay, parseISO } from "date-fns";
import { toast } from "sonner";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { AppActionRow, AppCard, AppEmptyState, AppMetricCard, AppResponsiveTabs } from "@/components/mui";
import { RoutinesDayEditor } from "@/components/routines/RoutinesDayEditor";
import { RoutinesModeToggle } from "@/components/routines/RoutinesModeToggle";
import { useI18n } from "@/i18n/I18nProvider";
import { usePatchTraineePlannedRoutine } from "@/hooks/trainer/usePatchTraineePlannedRoutine";
import { useTrainerDay } from "@/hooks/trainer/useTrainerDay";
import { weekKeyToStartDate } from "@/utils/weekKey";
import type { AttachmentOption } from "@/utils/routines/attachments";
import { safeParseJson, safeStringify } from "@/utils/routines/json";
import { normalizeRoutineJsonExerciseIds } from "@/utils/routines/jsonIds";
import { DAY_KEYS, normalizePlans, plansToRoutineDays, type DayKey, type DayPlan, type ExerciseItem } from "@/utils/routines/plan";
import type { ISODate, PlannedRoutine, PlannedRoutineExercise, PlannedRoutineSource } from "@/types/workoutDay.types";
import type { PatchPlannedRoutineBody } from "@/types/trainer.types";
import type { WorkoutRoutineDay } from "@/types/workoutRoutine.types";

type EditorMode = "form" | "json";

type WeekSaveReport = {
    savedPlanned: number;
    savedRest: number;
    skippedEmpty: number;
    skippedLockedOrFailed: number;
};

type JsonWeekParseResult = {
    plans: DayPlan[];
    providedDayKeys: DayKey[];
};

type ActionRenderOptions = {
    includeBackToTop?: boolean;
    onBackToTop?: () => void;
};

function makeId(): string {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
    return `ex_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isDayKey(value: unknown): value is DayKey {
    return typeof value === "string" && DAY_KEYS.some((dayKey) => dayKey === value);
}

function dayKeyLabel(dayKey: DayKey, lang: string): string {
    const mapEs: Record<DayKey, string> = {
        Mon: "Lun",
        Tue: "Mar",
        Wed: "Mié",
        Thu: "Jue",
        Fri: "Vie",
        Sat: "Sáb",
        Sun: "Dom",
    };

    return lang === "es" ? mapEs[dayKey] : dayKey;
}

function getDayKeyFromIsoDate(dateIso: string): DayKey {
    const n = getISODay(parseISO(dateIso));
    return DAY_KEYS[n - 1] ?? "Mon";
}

function getDateForDayKey(weekKey: string, dayKey: DayKey): ISODate {
    const start = weekKeyToStartDate(weekKey);
    const idx = DAY_KEYS.indexOf(dayKey);
    return format(addDays(start, Math.max(0, idx)), "yyyy-MM-dd") as ISODate;
}

function cleanString(value: string | null | undefined): string | undefined {
    const trimmed = (value ?? "").trim();
    return trimmed.length > 0 ? trimmed : undefined;
}

function cleanNullableString(value: unknown): string | null {
    if (typeof value === "string") {
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : null;
    }

    if (typeof value === "number" && Number.isFinite(value)) {
        return String(value);
    }

    return null;
}

function cleanNullableNumber(value: unknown): number | null {
    if (typeof value === "number" && Number.isFinite(value)) return value;

    if (typeof value === "string") {
        const parsed = Number(value.trim());
        return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
}

function cleanNullableStringArray(value: unknown): string[] | null {
    if (!Array.isArray(value)) return null;
    const items = value.map((item) => (typeof item === "string" ? item.trim() : "")).filter(Boolean);
    return items.length > 0 ? items : null;
}

function cleanStringArrayOrUndefined(value: unknown): string[] | undefined {
    return cleanNullableStringArray(value) ?? undefined;
}

function cleanStringOrUndefined(value: unknown): string | undefined {
    return cleanNullableString(value) ?? undefined;
}

function cleanNumberStringOrUndefined(value: unknown): string | undefined {
    const normalized = cleanNullableString(value);
    return normalized ?? undefined;
}

function plannedRoutineToDayPlan(dayKey: DayKey, planned: PlannedRoutine): DayPlan {
    return {
        dayKey,
        sessionType: cleanString(planned.sessionType),
        focus: cleanString(planned.focus),
        tags: planned.tags ?? undefined,
        notes: cleanString(planned.notes),
        exercises: planned.exercises?.map((exercise) => ({
            id: exercise.id || makeId(),
            name: exercise.name ?? "",
            sets: exercise.sets !== null && exercise.sets !== undefined ? String(exercise.sets) : undefined,
            reps: cleanString(exercise.reps),
            rpe: exercise.rpe !== null && exercise.rpe !== undefined ? String(exercise.rpe) : undefined,
            load: cleanString(exercise.load),
            notes: cleanString(exercise.notes),
            attachmentPublicIds: exercise.attachmentPublicIds ?? undefined,
            movementId: cleanString(exercise.movementId),
            movementName: cleanString(exercise.movementName),
        })),
    };
}

function routineDayToPlannedRoutine(day: WorkoutRoutineDay): PlannedRoutine {
    const exercises: PlannedRoutineExercise[] | null = day.exercises
        ? day.exercises.map((exercise) => ({
            id: exercise.id || makeId(),
            name: exercise.name,
            movementId: exercise.movementId,
            movementName: exercise.movementName,
            sets: exercise.sets,
            reps: exercise.reps,
            rpe: exercise.rpe,
            load: exercise.load,
            notes: exercise.notes,
            attachmentPublicIds: exercise.attachmentPublicIds,
        }))
        : null;

    return {
        sessionType: day.sessionType,
        focus: day.focus,
        exercises,
        notes: day.notes,
        tags: day.tags,
    };
}

function hasPlannedRoutineContent(day: WorkoutRoutineDay | DayPlan | PlannedRoutine | null | undefined): boolean {
    if (!day) return false;

    const sessionType = "sessionType" in day ? day.sessionType : null;
    const focus = "focus" in day ? day.focus : null;
    const notes = "notes" in day ? day.notes : null;
    const tags = "tags" in day ? day.tags : null;
    const exercises = "exercises" in day ? day.exercises : null;

    return Boolean(
        cleanNullableString(sessionType) ||
        cleanNullableString(focus) ||
        cleanNullableString(notes) ||
        (Array.isArray(tags) && tags.length > 0) ||
        (Array.isArray(exercises) && exercises.some((exercise) => isRecord(exercise) && cleanNullableString(exercise.name)))
    );
}

function activePlanToPatchBody(args: { weekKey: string; activeDayKey: DayKey; activePlan: DayPlan }): PatchPlannedRoutineBody {
    const routineDay = plansToRoutineDays(args.weekKey, [args.activePlan]).find((day) => day.dayKey === args.activeDayKey);

    if (!routineDay || !hasPlannedRoutineContent(routineDay)) {
        return {
            plannedRoutine: null,
            plannedMeta: { plannedAt: new Date().toISOString(), source: "trainer" },
        };
    }

    return {
        plannedRoutine: routineDayToPlannedRoutine(routineDay),
        plannedMeta: { plannedAt: new Date().toISOString(), source: "trainer" },
    };
}

function normalizePlannedRoutineExercise(input: unknown): PlannedRoutineExercise | null {
    if (!isRecord(input)) return null;

    return {
        id: cleanNullableString(input.id) ?? makeId(),
        name: cleanNullableString(input.name) ?? "",
        movementId: cleanNullableString(input.movementId),
        movementName: cleanNullableString(input.movementName),
        sets: cleanNullableNumber(input.sets),
        reps: cleanNullableString(input.reps),
        rpe: cleanNullableNumber(input.rpe),
        load: cleanNullableString(input.load),
        notes: cleanNullableString(input.notes),
        attachmentPublicIds: cleanNullableStringArray(input.attachmentPublicIds),
    };
}

function normalizePlannedRoutine(input: unknown): PlannedRoutine | null {
    if (input === null) return null;
    if (!isRecord(input)) return null;

    const exercises = Array.isArray(input.exercises)
        ? input.exercises.map(normalizePlannedRoutineExercise).filter((item): item is PlannedRoutineExercise => item !== null)
        : null;

    const plannedRoutine: PlannedRoutine = {
        sessionType: cleanNullableString(input.sessionType),
        focus: cleanNullableString(input.focus),
        exercises: exercises && exercises.length > 0 ? exercises : null,
        notes: cleanNullableString(input.notes),
        tags: cleanNullableStringArray(input.tags),
    };

    return hasPlannedRoutineContent(plannedRoutine) ? plannedRoutine : null;
}

function normalizePlannedMeta(input: unknown): PatchPlannedRoutineBody["plannedMeta"] {
    if (input === null) return null;
    if (!isRecord(input)) return { plannedAt: new Date().toISOString(), source: "trainer" };

    const sourceRaw = input.source;
    const source: PlannedRoutineSource | undefined = sourceRaw === "template" || sourceRaw === "trainer" ? sourceRaw : "trainer";
    const plannedAt = cleanNullableString(input.plannedAt) ?? new Date().toISOString();

    return { plannedAt, source };
}

function normalizePatchBodyFromJson(input: unknown): PatchPlannedRoutineBody | null {
    const normalized = normalizeRoutineJsonExerciseIds(input);

    if (isRecord(normalized) && ("plannedRoutine" in normalized || "plannedMeta" in normalized)) {
        return {
            plannedRoutine: normalizePlannedRoutine(normalized.plannedRoutine),
            plannedMeta: normalizePlannedMeta(normalized.plannedMeta),
        };
    }

    const plannedRoutine = normalizePlannedRoutine(normalized);

    return {
        plannedRoutine,
        plannedMeta: { plannedAt: new Date().toISOString(), source: "trainer" },
    };
}

function normalizeExerciseItemFromJson(input: unknown): ExerciseItem | null {
    if (!isRecord(input)) return null;

    return {
        id: cleanNullableString(input.id) ?? makeId(),
        name: cleanNullableString(input.name) ?? "",
        sets: cleanNumberStringOrUndefined(input.sets),
        reps: cleanStringOrUndefined(input.reps),
        rpe: cleanNumberStringOrUndefined(input.rpe),
        load: cleanStringOrUndefined(input.load),
        notes: cleanStringOrUndefined(input.notes),
        attachmentPublicIds: cleanStringArrayOrUndefined(input.attachmentPublicIds),
        movementId: cleanStringOrUndefined(input.movementId),
        movementName: cleanStringOrUndefined(input.movementName),
    };
}

function normalizeDayPlanFromJson(dayKey: DayKey, input: unknown): DayPlan {
    if (!isRecord(input)) return { dayKey };

    const exercises = Array.isArray(input.exercises)
        ? input.exercises.map(normalizeExerciseItemFromJson).filter((item): item is ExerciseItem => item !== null)
        : undefined;

    return {
        dayKey,
        sessionType: cleanStringOrUndefined(input.sessionType),
        focus: cleanStringOrUndefined(input.focus),
        tags: cleanStringArrayOrUndefined(input.tags),
        notes: cleanStringOrUndefined(input.notes),
        exercises,
    };
}

function mergeDayPlans(current: DayPlan[], incoming: DayPlan[]): DayPlan[] {
    const incomingByDay = new Map<DayKey, DayPlan>(incoming.map((plan) => [plan.dayKey, plan]));
    return normalizePlans(current).map((plan) => incomingByDay.get(plan.dayKey) ?? plan);
}

function getProvidedDayKeysFromRecord(daysRecord: Record<string, unknown>): DayKey[] {
    return DAY_KEYS.filter((dayKey) => Object.prototype.hasOwnProperty.call(daysRecord, dayKey));
}

function parseWeekJsonInput(input: unknown, activeDayKey: DayKey): JsonWeekParseResult | null {
    const normalized = normalizeRoutineJsonExerciseIds(input);

    if (isRecord(normalized) && "days" in normalized) {
        const rawDays = normalized.days;

        if (isRecord(rawDays)) {
            const providedDayKeys = getProvidedDayKeysFromRecord(rawDays);
            const plans = providedDayKeys.map((dayKey) => normalizeDayPlanFromJson(dayKey, rawDays[dayKey]));
            return plans.length > 0 ? { plans, providedDayKeys } : null;
        }

        if (Array.isArray(rawDays)) {
            const plans = rawDays
                .map((item) => {
                    if (!isRecord(item) || !isDayKey(item.dayKey)) return null;
                    return normalizeDayPlanFromJson(item.dayKey, item);
                })
                .filter((item): item is DayPlan => item !== null);

            const providedDayKeys = plans.map((plan) => plan.dayKey);
            return plans.length > 0 ? { plans, providedDayKeys } : null;
        }
    }

    if (isRecord(normalized) && "plannedRoutine" in normalized) {
        const plannedRoutine = normalizePlannedRoutine(normalized.plannedRoutine);
        return { plans: plannedRoutine ? [plannedRoutineToDayPlan(activeDayKey, plannedRoutine)] : [{ dayKey: activeDayKey }], providedDayKeys: [activeDayKey] };
    }

    const plannedRoutine = normalizePlannedRoutine(normalized);
    if (plannedRoutine) {
        return { plans: [plannedRoutineToDayPlan(activeDayKey, plannedRoutine)], providedDayKeys: [activeDayKey] };
    }

    return null;
}

function dayPlanToJson(plan: DayPlan): Record<string, unknown> {
    return {
        sessionType: plan.sessionType ?? "",
        focus: plan.focus ?? "",
        exercises:
            plan.exercises?.map((exercise) => ({
                id: exercise.id || "",
                name: exercise.name ?? "",
                movementId: exercise.movementId ?? null,
                movementName: exercise.movementName ?? null,
                sets: exercise.sets ?? null,
                reps: exercise.reps ?? "",
                rpe: exercise.rpe ?? null,
                load: exercise.load ?? "",
                notes: exercise.notes ?? "",
                attachmentPublicIds: exercise.attachmentPublicIds ?? null,
            })) ?? [],
        notes: plan.notes ?? "",
        tags: plan.tags ?? [],
    };
}

function createEmptyExerciseJsonTemplate(): Record<string, unknown> {
    return {
        id: "",
        name: "",
        movementId: null,
        movementName: null,
        sets: null,
        reps: "",
        rpe: null,
        load: "",
        notes: "",
        attachmentPublicIds: null,
    };
}

function createDayJsonTemplate(): Record<string, unknown> {
    return {
        sessionType: "",
        focus: "",
        exercises: [createEmptyExerciseJsonTemplate()],
        notes: "",
        tags: [],
    };
}

function buildCurrentWeekJson(weekKey: string, plans: DayPlan[]): Record<string, unknown> {
    const normalizedByDay = new Map<DayKey, DayPlan>(normalizePlans(plans).map((plan) => [plan.dayKey, plan]));
    const days = DAY_KEYS.reduce<Record<string, unknown>>((acc, dayKey) => {
        const plan = normalizedByDay.get(dayKey);
        acc[dayKey] = plan && hasPlannedRoutineContent(plan) ? dayPlanToJson(plan) : createDayJsonTemplate();
        return acc;
    }, {});

    return {
        weekKey,
        source: "trainer",
        plannedDays: DAY_KEYS,
        days,
    };
}

function createWeekJsonTemplate(weekKey: string): Record<string, unknown> {
    return buildCurrentWeekJson(weekKey, normalizePlans([]));
}

function WeekSaveReportCard({ report, lang }: { report: WeekSaveReport; lang: string }) {
    return (
        <AppCard title={lang === "es" ? "Reporte de guardado" : "Save report"}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 1.25 }}>
                <AppMetricCard label={lang === "es" ? "Planeados" : "Planned"} value={report.savedPlanned} />
                <AppMetricCard label={lang === "es" ? "Descansos" : "Rest"} value={report.savedRest} />
                <AppMetricCard label={lang === "es" ? "Vacíos omitidos" : "Empty skipped"} value={report.skippedEmpty} />
                <AppMetricCard label={lang === "es" ? "Fallidos" : "Failed"} value={report.skippedLockedOrFailed} />
            </Box>
        </AppCard>
    );
}

export function TrainerAssignRoutineSection({ traineeId, weekKey, date }: { traineeId: string; weekKey: string; date: string }) {
    const { t, lang } = useI18n();
    const patchDayMutation = usePatchTraineePlannedRoutine();

    const [clearEmptyDays, setClearEmptyDays] = React.useState(false);
    const [editorMode, setEditorMode] = React.useState<EditorMode>("form");
    const [activeDayKey, setActiveDayKey] = React.useState<DayKey>(() => getDayKeyFromIsoDate(date));
    const [lastReport, setLastReport] = React.useState<WeekSaveReport | null>(null);
    const [plans, setPlans] = React.useState<DayPlan[]>(() => normalizePlans([]));
    const [weekJsonEditor, setWeekJsonEditor] = React.useState(() => safeStringify(createWeekJsonTemplate(weekKey)));
    const [isSavingWeek, setIsSavingWeek] = React.useState(false);

    const topRef = React.useRef<HTMLDivElement | null>(null);

    const activeDate = React.useMemo(() => getDateForDayKey(weekKey, activeDayKey), [activeDayKey, weekKey]);
    const traineeDayQuery = useTrainerDay({ traineeId, date: activeDate });
    const hasTrainingLock = Boolean(traineeDayQuery.data?.day?.training);
    const attachmentOptions = React.useMemo<AttachmentOption[]>(() => [], []);
    const activePlan = React.useMemo(() => normalizePlans(plans).find((plan) => plan.dayKey === activeDayKey) ?? { dayKey: activeDayKey }, [activeDayKey, plans]);

    React.useEffect(() => {
        setActiveDayKey(getDayKeyFromIsoDate(date));
    }, [date]);

    React.useEffect(() => {
        const nextActiveDayKey = getDayKeyFromIsoDate(date);
        setPlans(normalizePlans([]));
        setLastReport(null);
        setWeekJsonEditor(safeStringify(createWeekJsonTemplate(weekKey)));
    }, [date, traineeId, weekKey]);

    React.useEffect(() => {
        const day = traineeDayQuery.data?.day ?? null;
        if (!day || day.date !== activeDate) return;

        if (!day.plannedRoutine) {
            setPlans((prev) => normalizePlans(prev).map((plan) => (plan.dayKey === activeDayKey ? { dayKey: activeDayKey } : plan)));
            return;
        }

        const fromTrainee = plannedRoutineToDayPlan(activeDayKey, day.plannedRoutine);
        setPlans((prev) => normalizePlans(prev).map((plan) => (plan.dayKey === activeDayKey ? fromTrainee : plan)));
    }, [activeDate, activeDayKey, traineeDayQuery.data?.day]);

    React.useEffect(() => {
        if (editorMode !== "json") return;
        setWeekJsonEditor(safeStringify(buildCurrentWeekJson(weekKey, plans)));
    }, [activeDayKey, editorMode, plans, weekKey]);

    function scrollToTop() {
        topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function updatePlan(dayKey: DayKey, patch: Partial<DayPlan>) {
        setPlans((prev) => normalizePlans(prev).map((plan) => (plan.dayKey === dayKey ? { ...plan, ...patch } : plan)));
    }

    function updateExercise(dayKey: DayKey, index: number, patch: Partial<ExerciseItem>) {
        setPlans((prev) =>
            normalizePlans(prev).map((plan) => {
                if (plan.dayKey !== dayKey) return plan;
                const exercises = [...(plan.exercises ?? [])];
                const current = exercises[index];
                if (!current) return plan;
                exercises[index] = { ...current, ...patch };
                return { ...plan, exercises };
            })
        );
    }

    function addExercise(dayKey: DayKey) {
        setPlans((prev) =>
            normalizePlans(prev).map((plan) => {
                if (plan.dayKey !== dayKey) return plan;

                return {
                    ...plan,
                    exercises: [...(plan.exercises ?? []), { id: makeId(), name: "" }],
                };
            })
        );
    }

    function removeExercise(dayKey: DayKey, index: number) {
        setPlans((prev) =>
            normalizePlans(prev).map((plan) => {
                if (plan.dayKey !== dayKey) return plan;
                return { ...plan, exercises: (plan.exercises ?? []).filter((_exercise, i) => i !== index) };
            })
        );
    }

    function insertWeekTemplate() {
        setWeekJsonEditor(safeStringify(createWeekJsonTemplate(weekKey)));
        toast.success(lang === "es" ? "Template JSON insertado." : "JSON template inserted.");
    }

    async function saveActiveDay() {
        if (hasTrainingLock) return;
        const body = activePlanToPatchBody({ weekKey, activeDayKey, activePlan });

        try {
            await patchDayMutation.mutateAsync({
                traineeId,
                date: activeDate,
                weekKey,
                body,
            });
            toast.success(lang === "es" ? "Día guardado." : "Day saved.");
        } catch {
            toast.error(lang === "es" ? "No se pudo guardar el día." : "Failed to save day.");
        }
    }

    async function saveWeekFromJson() {
        if (isSavingWeek) return;

        const parsed = safeParseJson(weekJsonEditor);
        if (!parsed.ok) {
            toast.error(lang === "es" ? "JSON inválido." : "Invalid JSON.", { description: parsed.error });
            return;
        }

        const parsedWeek = parseWeekJsonInput(parsed.value, activeDayKey);
        if (!parsedWeek) {
            toast.error(lang === "es" ? "El JSON debe contener days o una rutina planeada válida." : "JSON must contain days or a valid planned routine.");
            return;
        }

        const mergedPlans = mergeDayPlans(plans, parsedWeek.plans);
        const routineDays = plansToRoutineDays(weekKey, mergedPlans);
        const providedDayKeys = new Set<DayKey>(parsedWeek.providedDayKeys);
        const report: WeekSaveReport = {
            savedPlanned: 0,
            savedRest: 0,
            skippedEmpty: 0,
            skippedLockedOrFailed: 0,
        };

        setIsSavingWeek(true);

        try {
            for (const dayKey of DAY_KEYS) {
                const routineDay = routineDays.find((day) => day.dayKey === dayKey);
                if (!routineDay) continue;

                const isProvided = providedDayKeys.has(dayKey);
                const hasContent = hasPlannedRoutineContent(routineDay);

                if (!isProvided && !clearEmptyDays) {
                    report.skippedEmpty += 1;
                    continue;
                }

                const dateIso = getDateForDayKey(weekKey, dayKey);
                const body: PatchPlannedRoutineBody = {
                    plannedRoutine: hasContent && isProvided ? routineDayToPlannedRoutine(routineDay) : null,
                    plannedMeta: { plannedAt: new Date().toISOString(), source: "trainer" },
                };

                try {
                    await patchDayMutation.mutateAsync({ traineeId, date: dateIso, weekKey, body });
                    if (body.plannedRoutine) report.savedPlanned += 1;
                    else report.savedRest += 1;
                } catch {
                    report.skippedLockedOrFailed += 1;
                }
            }

            setPlans(clearEmptyDays ? normalizePlans(parsedWeek.plans) : mergedPlans);
            setWeekJsonEditor(safeStringify(buildCurrentWeekJson(weekKey, clearEmptyDays ? parsedWeek.plans : mergedPlans)));
            setLastReport(report);

            if (report.skippedLockedOrFailed > 0) {
                toast.warning(lang === "es" ? "JSON semanal guardado con algunos días fallidos." : "Weekly JSON saved with some failed days.");
            } else {
                toast.success(lang === "es" ? "JSON semanal guardado." : "Weekly JSON saved.");
            }
        } finally {
            setIsSavingWeek(false);
        }
    }

    async function saveWeekFromForm() {
        if (isSavingWeek) return;

        const routineDays = plansToRoutineDays(weekKey, plans);
        const report: WeekSaveReport = {
            savedPlanned: 0,
            savedRest: 0,
            skippedEmpty: 0,
            skippedLockedOrFailed: 0,
        };

        setIsSavingWeek(true);

        try {
            for (const day of routineDays) {
                const dateIso = day.date as ISODate;
                const hasContent = hasPlannedRoutineContent(day);

                if (!hasContent && !clearEmptyDays) {
                    report.skippedEmpty += 1;
                    continue;
                }

                const body: PatchPlannedRoutineBody = {
                    plannedRoutine: hasContent ? routineDayToPlannedRoutine(day) : null,
                    plannedMeta: { plannedAt: new Date().toISOString(), source: "trainer" },
                };

                try {
                    await patchDayMutation.mutateAsync({ traineeId, date: dateIso, weekKey, body });
                    if (hasContent) report.savedPlanned += 1;
                    else report.savedRest += 1;
                } catch {
                    report.skippedLockedOrFailed += 1;
                }
            }

            setLastReport(report);

            if (report.skippedLockedOrFailed > 0) {
                toast.warning(lang === "es" ? "Semana guardada con algunos días fallidos." : "Week saved with some failed days.");
            } else {
                toast.success(lang === "es" ? "Semana guardada." : "Week saved.");
            }
        } finally {
            setIsSavingWeek(false);
        }
    }

    async function markRestActiveDay() {
        if (hasTrainingLock) return;

        try {
            await patchDayMutation.mutateAsync({
                traineeId,
                date: activeDate,
                weekKey,
                body: {
                    plannedRoutine: null,
                    plannedMeta: { plannedAt: new Date().toISOString(), source: "trainer" },
                },
            });
            updatePlan(activeDayKey, { sessionType: undefined, focus: undefined, notes: undefined, tags: undefined, exercises: [] });
            toast.success(lang === "es" ? "Día marcado como descanso." : "Day marked as rest.");
        } catch {
            toast.error(lang === "es" ? "No se pudo marcar descanso." : "Failed to mark rest.");
        }
    }

    const isSavingDay = patchDayMutation.isPending || traineeDayQuery.isLoading || hasTrainingLock;

    function renderJsonActions(options?: ActionRenderOptions) {
        return (
            <AppActionRow
                align="right"
                dense
                sx={{
                    width: "100%",
                    justifyContent: { xs: "stretch", sm: "flex-end" },
                    "& > .MuiButton-root": {
                        flex: { xs: "1 1 calc(50% - 8px)", sm: "0 0 auto" },
                    },
                }}
            >
                <Button type="button" variant="outlined" onClick={insertWeekTemplate} disabled={isSavingDay || isSavingWeek}>
                    {lang === "es" ? "Insertar template" : "Insert template"}
                </Button>
                <Button type="button" variant="contained" onClick={() => void saveWeekFromJson()} disabled={isSavingDay || isSavingWeek}>
                    {isSavingWeek ? (lang === "es" ? "Guardando…" : "Saving…") : lang === "es" ? "Guardar JSON" : "Save JSON"}
                </Button>
                {options?.includeBackToTop ? (
                    <Button type="button" variant="text" onClick={options.onBackToTop} disabled={isSavingDay || isSavingWeek} sx={{ flexBasis: { xs: "100%", sm: "auto" } }}>
                        {lang === "es" ? "Volver arriba" : "Back to top"}
                    </Button>
                ) : null}
            </AppActionRow>
        );
    }

    function renderFormActions(options?: ActionRenderOptions) {
        return (
            <AppActionRow
                align="right"
                dense
                sx={{
                    width: "100%",
                    justifyContent: { xs: "stretch", sm: "flex-end" },
                    "& > .MuiButton-root": {
                        flex: { xs: "1 1 calc(50% - 8px)", sm: "0 0 auto" },
                    },
                }}
            >
                <Button variant="contained" onClick={() => void saveActiveDay()} disabled={isSavingDay || isSavingWeek}>
                    {patchDayMutation.isPending ? (lang === "es" ? "Guardando…" : "Saving…") : lang === "es" ? "Guardar día" : "Save day"}
                </Button>
                <Button variant="contained" color="secondary" onClick={() => void saveWeekFromForm()} disabled={isSavingDay || isSavingWeek}>
                    {isSavingWeek ? (lang === "es" ? "Guardando…" : "Saving…") : lang === "es" ? "Guardar semana" : "Save week"}
                </Button>
                <Button variant="outlined" onClick={() => void markRestActiveDay()} disabled={isSavingDay || isSavingWeek} sx={{ flexBasis: { xs: "100%", sm: "auto" } }}>
                    {lang === "es" ? "Descanso" : "Rest"}
                </Button>
                {options?.includeBackToTop ? (
                    <Button type="button" variant="text" onClick={options.onBackToTop} disabled={isSavingDay || isSavingWeek} sx={{ flexBasis: { xs: "100%", sm: "auto" } }}>
                        {lang === "es" ? "Volver arriba" : "Back to top"}
                    </Button>
                ) : null}
            </AppActionRow>
        );
    }

    return (
        <Box ref={topRef} sx={{ display: "grid", gap: { xs: 1.5, md: 2 } }}>
            <AppCard title={lang === "es" ? "Asignar rutina al trainee" : "Assign trainee routine"}>
                <Box sx={{ display: "grid", gap: 1.5 }}>
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: { xs: "1fr", md: "minmax(260px, 320px) 1fr" },
                            alignItems: "center",
                            gap: 1,
                        }}
                    >
                        <RoutinesModeToggle mode={editorMode} busy={patchDayMutation.isPending || isSavingWeek} t={t} onModeChange={setEditorMode} />
                        {editorMode === "json" ? renderJsonActions() : renderFormActions()}
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ my: 1 }}>
                        {editorMode === "json"
                            ? lang === "es"
                                ? "Pega o edita una semana completa en JSON. Los días omitidos no se tocan; los días presentes pero vacíos se guardan como descanso."
                                : "Paste or edit a full week as JSON. Omitted days are left untouched; provided empty days are saved as rest."
                            : lang === "es"
                                ? "Edita día por día con formulario. Puedes guardar el día activo o guardar toda la semana desde el editor actual."
                                : "Edit day-by-day by form. You can save the active day or save the whole week from the current editor."}
                    </Typography>

                    {editorMode === "form" ? (
                        <FormControlLabel
                            control={<Switch checked={clearEmptyDays} onChange={(event) => setClearEmptyDays(event.target.checked)} />}
                            label={lang === "es" ? "Al guardar semana, marcar días vacíos como descanso" : "When saving week, mark empty days as rest"}
                        />
                    ) : null}

                    {editorMode === "form" ? (
                        <AppResponsiveTabs
                            value={activeDayKey}
                            onChange={(next) => setActiveDayKey(next as DayKey)}
                            ariaLabel={lang === "es" ? "Días de rutina" : "Routine days"}
                            tabs={DAY_KEYS.map((dayKey) => ({ value: dayKey, label: dayKeyLabel(dayKey, lang) }))}
                        />
                    ) : null}

                    <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
                        {editorMode === "form" ? <Chip color="primary" size="small" label={`${activeDayKey} · ${activeDate}`} /> : null}
                        <Chip size="small" label={`${weekKey}`} />
                        {editorMode === "json" ? <Chip color="primary" size="small" label={lang === "es" ? "JSON semanal" : "Weekly JSON"} /> : null}
                        {hasTrainingLock ? <Chip color="warning" size="small" label={lang === "es" ? "Bloqueado por entrenamiento" : "Locked by training"} /> : null}
                    </Box>

                    {editorMode === "form" ? (
                        <RoutinesDayEditor
                            activePlan={activePlan}
                            busy={isSavingDay || isSavingWeek}
                            t={t}
                            lang={lang}
                            ph={{
                                sessionType: lang === "es" ? "Ej: Pull power" : "e.g. Pull power",
                                focus: lang === "es" ? "Ej: Espalda" : "e.g. Back",
                                tags: lang === "es" ? "Ej: power, gym" : "e.g. power, gym",
                                notes: lang === "es" ? "Notas del día" : "Day notes",
                                exNotes: lang === "es" ? "Notas del ejercicio" : "Exercise notes",
                                sets: lang === "es" ? "Ej: 4" : "e.g. 4",
                                reps: lang === "es" ? "Ej: 8-10" : "e.g. 8-10",
                                load: lang === "es" ? "Ej: 70 lb" : "e.g. 70 lb",
                            }}
                            attachmentOptions={attachmentOptions}
                            movementOptions={undefined}
                            exerciseUploadBusy={false}
                            uploadingExercise={null}
                            getPendingFilesForExercise={() => []}
                            onPickFilesForExercise={() => undefined}
                            onRemovePendingForExercise={() => undefined}
                            onAddExercise={addExercise}
                            onRemoveExercise={removeExercise}
                            onUpdatePlan={updatePlan}
                            onUpdateExercise={updateExercise}
                            scrollRootEl={null}
                        />
                    ) : (
                        <Box sx={{ display: "grid", gap: 1.25 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                {lang === "es"
                                    ? "Estructura esperada: weekKey, plannedDays y days.Mon/Tue/Wed/Thu/Fri/Sat/Sun. Puedes dejar días vacíos para descanso o borrar días del JSON si no quieres tocarlos."
                                    : "Expected shape: weekKey, plannedDays and days.Mon/Tue/Wed/Thu/Fri/Sat/Sun. Leave days empty for rest or remove days from JSON if you do not want to touch them."}
                            </Typography>

                            <TextField
                                fullWidth
                                multiline
                                minRows={18}
                                label={lang === "es" ? "JSON semanal" : "Weekly JSON"}
                                value={weekJsonEditor}
                                onChange={(event) => setWeekJsonEditor(event.target.value)}
                                disabled={isSavingDay || isSavingWeek}
                                helperText={
                                    lang === "es"
                                        ? "Los ejercicios sin id o con id vacío reciben UUID automáticamente antes de guardar."
                                        : "Exercises with missing or empty ids receive UUIDs automatically before saving."
                                }
                                sx={{ "& textarea": { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" } }}
                            />
                        </Box>
                    )}

                    {editorMode === "json" ? renderJsonActions({ includeBackToTop: true, onBackToTop: scrollToTop }) : renderFormActions({ includeBackToTop: true, onBackToTop: scrollToTop })}
                </Box>
            </AppCard>

            {lastReport ? <WeekSaveReportCard report={lastReport} lang={lang} /> : null}

            {hasTrainingLock ? (
                <AppEmptyState
                    title={lang === "es" ? "Día bloqueado" : "Day locked"}
                    description={lang === "es" ? "Este día ya tiene entrenamiento real; no se puede sobrescribir desde el trainer." : "This day already has real training and cannot be overwritten from trainer."}
                    variant="inline"
                />
            ) : null}
        </Box>
    );
}

// src/sections/trainer/TrainerAssignRoutineSection.tsx
// MUI routine assignment section for trainer flow.
// Keeps existing trainer hooks/contracts and uses RoutinesDayEditor for the day editor UI.

import React from "react";
import { addDays, format, getISODay, parseISO } from "date-fns";
import { toast } from "sonner";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";

import { AppCard, AppEmptyState, AppMetricCard, AppResponsiveTabs } from "@/components/mui";
import { RoutinesDayEditor } from "@/components/routines/RoutinesDayEditor";
import { useI18n } from "@/i18n/I18nProvider";
import { useAssignWeekToTrainee } from "@/hooks/trainer/useAssignWeekToTrainee";
import { usePatchTraineePlannedRoutine } from "@/hooks/trainer/usePatchTraineePlannedRoutine";
import { useTrainerDay } from "@/hooks/trainer/useTrainerDay";
import { useRoutineWeek } from "@/hooks/useRoutineWeek";
import { weekKeyToStartDate } from "@/utils/weekKey";
import type { AttachmentOption } from "@/utils/routines/attachments";
import { DAY_KEYS, normalizePlans, plansToRoutineDays, type DayKey, type DayPlan, type ExerciseItem } from "@/utils/routines/plan";
import type { ISODate, PlannedRoutine, PlannedRoutineExercise } from "@/types/workoutDay.types";
import type { WeeklyAssignReport } from "@/types/trainer.types";
import type { WorkoutRoutineDay, WorkoutRoutineWeek } from "@/types/workoutRoutine.types";

function makeId(): string {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
    return `ex_${Math.random().toString(16).slice(2)}_${Date.now()}`;
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

function routineDayToDayPlan(day: WorkoutRoutineDay): DayPlan {
    return {
        dayKey: day.dayKey,
        sessionType: cleanString(day.sessionType),
        focus: cleanString(day.focus),
        tags: day.tags ?? undefined,
        notes: cleanString(day.notes),
        exercises: day.exercises?.map((exercise) => ({
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
            id: exercise.id,
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

function ReportCard({ report, lang }: { report: WeeklyAssignReport; lang: string }) {
    return (
        <AppCard title={lang === "es" ? "Reporte de asignación" : "Assign report"}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 1.25 }}>
                <AppMetricCard label={lang === "es" ? "Creados" : "Created"} value={report.createdPlanned} />
                <AppMetricCard label={lang === "es" ? "Descansos" : "Rest"} value={report.createdRest} />
                <AppMetricCard label={lang === "es" ? "Actualizados" : "Updated"} value={report.updatedPlanned} />
                <AppMetricCard label={lang === "es" ? "Saltados" : "Skipped"} value={report.skippedLockedByTraining + report.skippedNoop} />
            </Box>
        </AppCard>
    );
}

export function TrainerAssignRoutineSection({ traineeId, weekKey, date }: { traineeId: string; weekKey: string; date: string }) {
    const { t, lang } = useI18n();
    const templateWeekQuery = useRoutineWeek(weekKey);
    const assignWeekMutation = useAssignWeekToTrainee();
    const patchDayMutation = usePatchTraineePlannedRoutine();

    const [clearEmptyDays, setClearEmptyDays] = React.useState(true);
    const [activeDayKey, setActiveDayKey] = React.useState<DayKey>(() => getDayKeyFromIsoDate(date));
    const [lastReport, setLastReport] = React.useState<WeeklyAssignReport | null>(null);
    const [plans, setPlans] = React.useState<DayPlan[]>(() => normalizePlans([]));

    const activeDate = React.useMemo(() => getDateForDayKey(weekKey, activeDayKey), [activeDayKey, weekKey]);
    const traineeDayQuery = useTrainerDay({ traineeId, date: activeDate });
    const templateWeek: WorkoutRoutineWeek | null = templateWeekQuery.data ?? null;
    const hasTrainingLock = Boolean(traineeDayQuery.data?.day?.training);
    const attachmentOptions = React.useMemo<AttachmentOption[]>(() => [], []);
    const activePlan = React.useMemo(() => normalizePlans(plans).find((plan) => plan.dayKey === activeDayKey) ?? { dayKey: activeDayKey }, [activeDayKey, plans]);

    React.useEffect(() => {
        setActiveDayKey(getDayKeyFromIsoDate(date));
    }, [date]);

    React.useEffect(() => {
        if (!templateWeek) {
            setPlans(normalizePlans([]));
            return;
        }

        setPlans(normalizePlans((templateWeek.days ?? []).map(routineDayToDayPlan)));
    }, [templateWeek, weekKey]);

    React.useEffect(() => {
        const day = traineeDayQuery.data?.day ?? null;
        if (!day || day.date !== activeDate || !day.plannedRoutine) return;

        const fromTrainee = plannedRoutineToDayPlan(activeDayKey, day.plannedRoutine);
        setPlans((prev) => {
            const next = normalizePlans(prev);
            const idx = next.findIndex((plan) => plan.dayKey === activeDayKey);
            if (idx < 0) return normalizePlans([...next, fromTrainee]);
            return normalizePlans(next.map((plan) => (plan.dayKey === activeDayKey ? fromTrainee : plan)));
        });
    }, [activeDate, activeDayKey, traineeDayQuery.data?.day]);

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

    async function assignWeek() {
        try {
            const response = await assignWeekMutation.mutateAsync({
                traineeId,
                weekKey,
                body: {
                    clearEmptyDays,
                    plannedAt: null,
                },
            });
            setLastReport(response.report);
            toast.success(lang === "es" ? "Semana asignada." : "Week assigned.");
        } catch {
            toast.error(lang === "es" ? "No se pudo asignar la semana." : "Failed to assign week.");
        }
    }

    async function saveActiveDay() {
        if (hasTrainingLock) return;
        const routineDay = plansToRoutineDays(weekKey, [activePlan]).find((day) => day.dayKey === activeDayKey);
        if (!routineDay) return;

        try {
            await patchDayMutation.mutateAsync({
                traineeId,
                date: activeDate,
                weekKey,
                body: {
                    plannedRoutine: routineDayToPlannedRoutine(routineDay),
                    plannedMeta: { plannedAt: new Date().toISOString(), source: "trainer" },
                },
            });
            toast.success(lang === "es" ? "Día guardado." : "Day saved.");
        } catch {
            toast.error(lang === "es" ? "No se pudo guardar el día." : "Failed to save day.");
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

    function loadActiveDayFromTemplate() {
        const templateDay = templateWeek?.days?.find((day) => day.dayKey === activeDayKey) ?? null;
        if (!templateDay) return;
        updatePlan(activeDayKey, routineDayToDayPlan(templateDay));
    }

    if (templateWeekQuery.isLoading) {
        return <AppEmptyState title={lang === "es" ? "Cargando template…" : "Loading template…"} variant="inline" />;
    }

    return (
        <Box sx={{ display: "grid", gap: { xs: 1.5, md: 2 } }}>
            <AppCard
                title={lang === "es" ? "Asignar rutina semanal" : "Assign weekly routine"}
                subtitle={
                    templateWeek
                        ? `${templateWeek.weekKey} · ${templateWeek.title ?? "—"}`
                        : lang === "es"
                            ? "No hay rutina template para esta semana."
                            : "No routine template for this week."
                }
                action={
                    <Button variant="contained" onClick={() => void assignWeek()} disabled={!templateWeek || assignWeekMutation.isPending}>
                        {assignWeekMutation.isPending ? (lang === "es" ? "Asignando…" : "Assigning…") : lang === "es" ? "Asignar semana" : "Assign week"}
                    </Button>
                }
            >
                <Box sx={{ display: "grid", gap: 1.25 }}>
                    <FormControlLabel
                        control={<Switch checked={clearEmptyDays} onChange={(event) => setClearEmptyDays(event.target.checked)} />}
                        label={lang === "es" ? "Limpiar días vacíos como descanso" : "Clear empty days as rest"}
                    />
                    <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
                        <Chip size="small" label={`Template: ${templateWeek?.weekKey ?? "—"}`} />
                        <Chip size="small" label={`${templateWeek?.days?.length ?? 0} ${lang === "es" ? "día(s)" : "day(s)"}`} />
                    </Box>
                </Box>
            </AppCard>

            {lastReport ? <ReportCard report={lastReport} lang={lang} /> : null}

            <AppCard
                title={lang === "es" ? "Editar por día" : "Edit per day"}
                subtitle={lang === "es" ? "El editor refleja lo guardado del trainee y permite guardar un día específico." : "Editor reflects trainee data and can save a single day."}
                action={
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "auto auto auto" }, gap: 1 }}>
                        <Button variant="contained" onClick={() => void saveActiveDay()} disabled={patchDayMutation.isPending || traineeDayQuery.isLoading || hasTrainingLock}>
                            {lang === "es" ? "Guardar día" : "Save day"}
                        </Button>
                        <Button variant="outlined" onClick={() => void markRestActiveDay()} disabled={patchDayMutation.isPending || traineeDayQuery.isLoading || hasTrainingLock}>
                            {lang === "es" ? "Descanso" : "Rest"}
                        </Button>
                        <Button variant="outlined" onClick={loadActiveDayFromTemplate} disabled={!templateWeek || patchDayMutation.isPending}>
                            {lang === "es" ? "Template" : "Template"}
                        </Button>
                    </Box>
                }
            >
                <Box sx={{ display: "grid", gap: 1.5 }}>
                    <AppResponsiveTabs
                        value={activeDayKey}
                        onChange={(next) => setActiveDayKey(next as DayKey)}
                        ariaLabel={lang === "es" ? "Días de rutina" : "Routine days"}
                        tabs={DAY_KEYS.map((dayKey) => ({ value: dayKey, label: dayKeyLabel(dayKey, lang) }))}
                    />

                    <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
                        <Chip color="primary" size="small" label={`${activeDayKey} · ${activeDate}`} />
                        {hasTrainingLock ? <Chip color="warning" size="small" label={lang === "es" ? "Bloqueado por entrenamiento" : "Locked by training"} /> : null}
                    </Box>

                    <RoutinesDayEditor
                        activePlan={activePlan}
                        busy={patchDayMutation.isPending || traineeDayQuery.isLoading || hasTrainingLock}
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
                </Box>
            </AppCard>
        </Box>
    );
}

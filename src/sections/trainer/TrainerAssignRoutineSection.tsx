import React from "react";
import { addDays, format, getISODay, parseISO } from "date-fns";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/I18nProvider";

import { weekKeyToStartDate } from "@/utils/weekKey";

import { useRoutineWeek } from "@/hooks/useRoutineWeek";
import { useTrainerDay } from "@/hooks/trainer/useTrainerDay";
import { useAssignWeekToTrainee } from "@/hooks/trainer/useAssignWeekToTrainee";
import { usePatchTraineePlannedRoutine } from "@/hooks/trainer/usePatchTraineePlannedRoutine";

import { RoutinesDayEditor } from "@/components/routines/RoutinesDayEditor";

import type { AttachmentOption } from "@/utils/routines/attachments";
import type { DayPlan, DayKey, ExerciseItem } from "@/utils/routines/plan";
import { DAY_KEYS, normalizePlans, plansToRoutineDays } from "@/utils/routines/plan";

import type { WorkoutRoutineDay, WorkoutRoutineWeek } from "@/types/workoutRoutine.types";
import type { ISODate, PlannedRoutine, PlannedRoutineExercise, PlannedRoutineSource } from "@/types/workoutDay.types";

function makeId(): string {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g: any = globalThis as any;
    if (g?.crypto?.randomUUID) return g.crypto.randomUUID();
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

function tabButton(active: boolean) {
    return cn(
        "h-8 px-3 rounded-full border text-sm transition-colors whitespace-nowrap",
        active
            ? "bg-primary text-primary-foreground border-transparent shadow-sm"
            : "bg-background hover:bg-muted/60"
    );
}

function getDayKeyFromIsoDate(dateIso: string): DayKey {
    const n = getISODay(parseISO(dateIso));
    return DAY_KEYS[n - 1] ?? "Mon";
}

function getDateForDayKey(weekKey: string, dayKey: DayKey): ISODate {
    const start = weekKeyToStartDate(weekKey);
    const idx = DAY_KEYS.indexOf(dayKey);
    const d = addDays(start, Math.max(0, idx));
    return format(d, "yyyy-MM-dd") as ISODate;
}

function routineDayToDayPlan(day: WorkoutRoutineDay): DayPlan {
    const exercises: ExerciseItem[] | undefined = Array.isArray(day.exercises)
        ? day.exercises.map((ex) => ({
            id: ex.id || makeId(),
            name: ex.name ?? "",
            sets: ex.sets != null ? String(ex.sets) : undefined,
            reps: ex.reps ?? undefined,
            rpe: ex.rpe != null ? String(ex.rpe) : undefined,
            load: ex.load ?? undefined,
            notes: ex.notes ?? undefined,
            attachmentPublicIds: ex.attachmentPublicIds ?? undefined,
            movementId: ex.movementId ?? undefined,
            movementName: ex.movementName ?? undefined,
        }))
        : undefined;

    return {
        dayKey: day.dayKey as any,
        sessionType: day.sessionType ?? undefined,
        focus: day.focus ?? undefined,
        tags: Array.isArray(day.tags) ? (day.tags as any) : undefined,
        notes: day.notes ?? undefined,
        exercises,
    };
}

function plannedRoutineToDayPlan(dayKey: DayKey, pr: PlannedRoutine): DayPlan {
    const exercises: ExerciseItem[] | undefined = Array.isArray(pr.exercises)
        ? pr.exercises.map((ex) => ({
            id: ex.id || makeId(),
            name: ex.name ?? "",
            sets: ex.sets != null ? String(ex.sets) : undefined,
            reps: ex.reps ?? undefined,
            rpe: ex.rpe != null ? String(ex.rpe) : undefined,
            load: ex.load ?? undefined,
            notes: ex.notes ?? undefined,
            attachmentPublicIds: ex.attachmentPublicIds ?? undefined,
            movementId: ex.movementId ?? undefined,
            movementName: ex.movementName ?? undefined,
        }))
        : undefined;

    return {
        dayKey,
        sessionType: pr.sessionType ?? undefined,
        focus: pr.focus ?? undefined,
        tags: Array.isArray(pr.tags) ? (pr.tags as any) : undefined,
        notes: pr.notes ?? undefined,
        exercises,
    };
}

function mapRoutineDayToPlannedRoutine(day: WorkoutRoutineDay): PlannedRoutine {
    const exercises: PlannedRoutineExercise[] | null = Array.isArray(day.exercises)
        ? day.exercises.map((ex) => ({
            id: ex.id,
            name: ex.name,
            movementId: ex.movementId ?? null,
            movementName: ex.movementName ?? null,
            sets: ex.sets ?? null,
            reps: ex.reps ?? null,
            rpe: ex.rpe ?? null,
            load: ex.load ?? null,
            notes: ex.notes ?? null,
            attachmentPublicIds: ex.attachmentPublicIds ?? null,
        }))
        : null;

    return {
        sessionType: day.sessionType ?? null,
        focus: day.focus ?? null,
        exercises,
        notes: day.notes ?? null,
        tags: day.tags ?? null,
    };
}

type ReportCardProps = { report: any; lang: string };
function ReportCard({ report, lang }: ReportCardProps) {
    if (!report) return null;
    return (
        <Card>
            <CardHeader>
                <CardTitle>{lang === "es" ? "Reporte de asignación" : "Assign report"}</CardTitle>
                <CardDescription>
                    {lang === "es" ? "Resumen de cambios aplicados por el backend." : "Summary of changes applied by the backend."}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-lg border bg-background p-3">
                        <div className="text-xs text-muted-foreground">{lang === "es" ? "Creados (planned)" : "Created (planned)"}</div>
                        <div className="mt-1 text-lg font-semibold">{report.createdPlanned ?? 0}</div>
                    </div>
                    <div className="rounded-lg border bg-background p-3">
                        <div className="text-xs text-muted-foreground">{lang === "es" ? "Creados (rest)" : "Created (rest)"}</div>
                        <div className="mt-1 text-lg font-semibold">{report.createdRest ?? 0}</div>
                    </div>
                    <div className="rounded-lg border bg-background p-3">
                        <div className="text-xs text-muted-foreground">{lang === "es" ? "Actualizados" : "Updated"}</div>
                        <div className="mt-1 text-lg font-semibold">{report.updatedPlanned ?? 0}</div>
                    </div>
                    <div className="rounded-lg border bg-background p-3">
                        <div className="text-xs text-muted-foreground">{lang === "es" ? "Limpiados a rest" : "Cleared to rest"}</div>
                        <div className="mt-1 text-lg font-semibold">{report.clearedToRest ?? 0}</div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export function TrainerAssignRoutineSection({
    traineeId,
    weekKey,
    date,
}: {
    traineeId: string;
    weekKey: string;
    date: string;
}) {
    const { t, lang } = useI18n();
    const navigate = useNavigate();

    const tplQ = useRoutineWeek(weekKey);
    const assignWeekM = useAssignWeekToTrainee();
    const patchDayM = usePatchTraineePlannedRoutine();

    const [clearEmptyDays, setClearEmptyDays] = React.useState<boolean>(true);
    const [activeDayKey, setActiveDayKey] = React.useState<DayKey>(() => getDayKeyFromIsoDate(date));
    const [lastReport, setLastReport] = React.useState<any>(null);

    const [plans, setPlans] = React.useState<DayPlan[]>(() => normalizePlans([]));

    const attachmentOptions: AttachmentOption[] = React.useMemo(() => [], []);
    const movementOptions = undefined;

    const [pendingFilesByExerciseId, setPendingFilesByExerciseId] = React.useState<Record<string, File[]>>({});
    const [uploadingExercise, setUploadingExercise] = React.useState<{ dayKey: DayKey; exerciseId: string } | null>(null);
    const exerciseUploadBusy = false;

    React.useEffect(() => {
        setActiveDayKey(getDayKeyFromIsoDate(date));
    }, [date]);

    const activeDate = React.useMemo(() => getDateForDayKey(weekKey, activeDayKey), [weekKey, activeDayKey]);

    const traineeDayQ = useTrainerDay({ traineeId, date: activeDate as any });
    const hasTrainingLock = Boolean(traineeDayQ.data?.day?.training);

    const templateWeek: WorkoutRoutineWeek | null = tplQ.data ?? null;

    React.useEffect(() => {
        if (!templateWeek) {
            setPlans(normalizePlans([]));
            return;
        }

        const next: DayPlan[] = normalizePlans(
            (templateWeek.days ?? []).map((d: WorkoutRoutineDay) => routineDayToDayPlan(d))
        );

        setPlans(next);
        setPendingFilesByExerciseId({});
        setUploadingExercise(null);
    }, [templateWeek?.id, weekKey]);

    // ✅ HYDRATE: If trainee has plannedRoutine for this day, reflect it in the editor.
    React.useEffect(() => {
        const day = traineeDayQ.data?.day ?? null;
        if (!day) return;

        // Only hydrate when the trainee day matches the active date in this view.
        if (day.date !== activeDate) return;

        if (day.plannedRoutine) {
            const fromTrainee = plannedRoutineToDayPlan(activeDayKey, day.plannedRoutine);

            setPlans((prev) => {
                const next = normalizePlans(prev);
                const idx = next.findIndex((p) => p.dayKey === activeDayKey);
                if (idx < 0) return next;
                // Overwrite this day plan with trainee plannedRoutine (source of truth).
                next[idx] = fromTrainee;
                return next;
            });
        }
    }, [traineeDayQ.data, activeDate, activeDayKey]);

    const activePlan: DayPlan = React.useMemo(() => {
        const found = plans.find((p) => p.dayKey === activeDayKey);
        return found ?? ({ dayKey: activeDayKey } as DayPlan);
    }, [plans, activeDayKey]);

    const previewRows = React.useMemo(() => {
        const map = new Map<string, WorkoutRoutineDay>();
        if (templateWeek?.days) {
            for (const d of templateWeek.days) map.set(d.dayKey, d);
        }
        return DAY_KEYS.map((dk) => {
            const d = map.get(dk) ?? null;
            const exCount = d?.exercises?.length ?? 0;
            return {
                dayKey: dk,
                exists: Boolean(d),
                sessionType: d?.sessionType ?? null,
                focus: d?.focus ?? null,
                exCount,
            };
        });
    }, [templateWeek]);

    const onAssignWeek = async () => {
        try {
            setLastReport(null);
            const plannedAt = new Date().toISOString();

            const res = await assignWeekM.mutateAsync({
                traineeId,
                weekKey: weekKey as any,
                body: { clearEmptyDays, plannedAt },
            });

            setLastReport(res.report);
            toast.success(lang === "es" ? "Semana asignada ✅" : "Week assigned ✅");
        } catch (e: any) {
            const status = e?.status ?? e?.response?.status ?? null;
            const code = e?.code ?? e?.response?.data?.code ?? null;

            const msg =
                status === 404 && code === "TEMPLATE_WEEK_NOT_FOUND"
                    ? lang === "es"
                        ? "No existe template de rutina para esta semana en tu cuenta (trainer). Crea/edita tu rutina primero."
                        : "Template week not found for trainer. Create/edit your routine first."
                    : status === 403
                        ? lang === "es"
                            ? "No tienes acceso a este trainee."
                            : "You don't have access to this trainee."
                        : lang === "es"
                            ? "No se pudo asignar la semana."
                            : "Failed to assign week.";

            toast.error(msg);
        }
    };

    const onSaveActiveDay = async () => {
        if (hasTrainingLock) {
            toast.error(lang === "es" ? "No se puede modificar: el día ya tiene entrenamiento (bloqueado)." : "Cannot modify: day has training (locked).");
            return;
        }

        try {
            const plannedAt = new Date().toISOString();

            const routineDays = plansToRoutineDays(weekKey, plans);
            const day = routineDays.find((d) => d.dayKey === activeDayKey) ?? null;

            const isEmpty =
                !day ||
                (!day.sessionType && !day.focus && (!day.exercises || day.exercises.length === 0) && !day.notes && (!day.tags || day.tags.length === 0));

            const plannedRoutine: PlannedRoutine | null = isEmpty ? null : mapRoutineDayToPlannedRoutine(day);

            await patchDayM.mutateAsync({
                traineeId,
                date: activeDate as any,
                body: {
                    plannedRoutine,
                    plannedMeta: { plannedAt, source: "trainer" as PlannedRoutineSource },
                },
                weekKey: weekKey as any,
            });

            // ✅ Ensure editor reflects what was saved (even before refetch)
            if (plannedRoutine) {
                const fromSaved = plannedRoutineToDayPlan(activeDayKey, plannedRoutine);
                setPlans((prev) => {
                    const next = normalizePlans(prev);
                    const idx = next.findIndex((p) => p.dayKey === activeDayKey);
                    if (idx >= 0) next[idx] = fromSaved;
                    return next;
                });
            }

            toast.success(lang === "es" ? `Guardado ✅ (${activeDayKey} → ${activeDate})` : `Saved ✅ (${activeDayKey} → ${activeDate})`);
        } catch (e: any) {
            const status = e?.status ?? e?.response?.status ?? null;
            const code = e?.code ?? e?.response?.data?.code ?? null;

            const msg =
                status === 409 || code === "PLANNED_LOCKED_BY_TRAINING"
                    ? lang === "es"
                        ? "No se puede cambiar: el día está bloqueado porque ya tiene entrenamiento."
                        : "Cannot change: day is locked because training exists."
                    : status === 403
                        ? lang === "es"
                            ? "No tienes acceso a este trainee."
                            : "You don't have access to this trainee."
                        : lang === "es"
                            ? "No se pudo guardar el día."
                            : "Failed to save day.";

            toast.error(msg);
        }
    };

    const onMarkRestActiveDay = async () => {
        if (hasTrainingLock) {
            toast.error(lang === "es" ? "No se puede modificar: el día ya tiene entrenamiento (bloqueado)." : "Cannot modify: day has training (locked).");
            return;
        }

        try {
            const plannedAt = new Date().toISOString();

            await patchDayM.mutateAsync({
                traineeId,
                date: activeDate as any,
                body: {
                    plannedRoutine: null,
                    plannedMeta: { plannedAt, source: "trainer" as PlannedRoutineSource },
                },
                weekKey: weekKey as any,
            });

            // Clear local plan for this day to reflect rest.
            setPlans((prev) => {
                const next = normalizePlans(prev);
                const idx = next.findIndex((p) => p.dayKey === activeDayKey);
                if (idx >= 0) next[idx] = { dayKey: activeDayKey } as DayPlan;
                return next;
            });

            toast.success(lang === "es" ? `Día marcado como descanso ✅ (${activeDayKey} → ${activeDate})` : `Day marked as rest ✅ (${activeDayKey} → ${activeDate})`);
        } catch (e: any) {
            const status = e?.status ?? e?.response?.status ?? null;
            const code = e?.code ?? e?.response?.data?.code ?? null;

            const msg =
                status === 409 || code === "PLANNED_LOCKED_BY_TRAINING"
                    ? lang === "es"
                        ? "No se puede cambiar: el día está bloqueado porque ya tiene entrenamiento."
                        : "Cannot change: day is locked because training exists."
                    : status === 403
                        ? lang === "es"
                            ? "No tienes acceso a este trainee."
                            : "You don't have access to this trainee."
                        : lang === "es"
                            ? "No se pudo marcar descanso."
                            : "Failed to mark rest.";

            toast.error(msg);
        }
    };

    const onLoadActiveDayFromTemplate = () => {
        const d = templateWeek?.days?.find((x) => x.dayKey === (activeDayKey as any)) ?? null;
        if (!d) {
            setPlans((prev) => {
                const next = normalizePlans(prev);
                const idx = next.findIndex((p) => p.dayKey === activeDayKey);
                if (idx >= 0) next[idx] = { dayKey: activeDayKey } as DayPlan;
                return next;
            });
            return;
        }

        const fromTpl = routineDayToDayPlan(d as any);
        setPlans((prev) => {
            const next = normalizePlans(prev);
            const idx = next.findIndex((p) => p.dayKey === activeDayKey);
            if (idx >= 0) next[idx] = fromTpl;
            return next;
        });

        toast.message(lang === "es" ? "Cargado desde template." : "Loaded from template.");
    };

    const onAddExercise = (dayKey: DayKey) => {
        setPlans((prev) => {
            const next = normalizePlans(prev);
            const idx = next.findIndex((p) => p.dayKey === dayKey);
            if (idx < 0) return next;

            const p = next[idx];
            const ex: ExerciseItem = { id: makeId(), name: "" };
            const exercises = Array.isArray(p.exercises) ? [...p.exercises, ex] : [ex];
            next[idx] = { ...p, exercises };
            return next;
        });
    };

    const onRemoveExercise = (dayKey: DayKey, idxToRemove: number) => {
        setPlans((prev) => {
            const next = normalizePlans(prev);
            const idx = next.findIndex((p) => p.dayKey === dayKey);
            if (idx < 0) return next;

            const p = next[idx];
            const exercises = Array.isArray(p.exercises) ? [...p.exercises] : [];
            const removed = exercises.splice(idxToRemove, 1);

            const removedId = removed[0]?.id;
            if (removedId) {
                setPendingFilesByExerciseId((m) => {
                    const copy = { ...m };
                    delete copy[removedId];
                    return copy;
                });
            }

            next[idx] = { ...p, exercises: exercises.length ? exercises : undefined };
            return next;
        });
    };

    const onUpdatePlan = (dayKey: DayKey, patch: Partial<DayPlan>) => {
        setPlans((prev) => {
            const next = normalizePlans(prev);
            const idx = next.findIndex((p) => p.dayKey === dayKey);
            if (idx < 0) return next;
            next[idx] = { ...next[idx], ...patch };
            return next;
        });
    };

    const onUpdateExercise = (dayKey: DayKey, idxToUpdate: number, patch: Partial<ExerciseItem>) => {
        setPlans((prev) => {
            const next = normalizePlans(prev);
            const idx = next.findIndex((p) => p.dayKey === dayKey);
            if (idx < 0) return next;

            const p = next[idx];
            const exercises = Array.isArray(p.exercises) ? [...p.exercises] : [];
            const current = exercises[idxToUpdate];
            if (!current) return next;

            exercises[idxToUpdate] = { ...current, ...patch };
            next[idx] = { ...p, exercises };
            return next;
        });
    };

    const getPendingExerciseFiles = (exerciseId: string): File[] => pendingFilesByExerciseId[exerciseId] ?? [];

    const onAddPendingExerciseFiles = (exerciseId: string, files: File[]) => {
        setPendingFilesByExerciseId((prev) => ({
            ...prev,
            [exerciseId]: Array.isArray(files) ? files : [],
        }));
        setUploadingExercise(null);
    };

    const onClearPendingExerciseFiles = (exerciseId: string, fileIndex?: number) => {
        setPendingFilesByExerciseId((prev) => {
            const curr = prev[exerciseId] ?? [];
            if (fileIndex === undefined) {
                const copy = { ...prev };
                delete copy[exerciseId];
                return copy;
            }
            const nextFiles = curr.filter((_, i) => i !== fileIndex);
            return { ...prev, [exerciseId]: nextFiles };
        });
    };

    const ph = React.useMemo(
        () => ({
            sessionType: lang === "es" ? "Ej: Upper Power" : "e.g. Upper Power",
            focus: lang === "es" ? "Ej: Pecho/Espalda" : "e.g. Chest/Back",
            tags: lang === "es" ? "Ej: power, gym" : "e.g. power, gym",
            notes: lang === "es" ? "Notas del día (opcional)" : "Day notes (optional)",
            exNotes: lang === "es" ? "Notas del ejercicio (opcional)" : "Exercise notes (optional)",
            sets: lang === "es" ? "Ej: 4" : "e.g. 4",
            reps: lang === "es" ? "Ej: 8-10" : "e.g. 8-10",
            load: lang === "es" ? "Ej: 70 lb" : "e.g. 70 lb",
        }),
        [lang]
    );

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>{lang === "es" ? "Asignar rutina (semana)" : "Assign routine (week)"}</CardTitle>
                    <CardDescription>
                        {lang === "es"
                            ? "El template se toma de tu rutina (trainer) para el mismo weekKey."
                            : "Template is taken from your (trainer) routine for the same weekKey."}
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    {tplQ.isLoading ? (
                        <EmptyState
                            title={lang === "es" ? "Cargando template…" : "Loading template…"}
                            description={lang === "es" ? "Leyendo tu rutina de esta semana." : "Reading your routine for this week."}
                        />
                    ) : tplQ.isError ? (
                        <EmptyState
                            title={lang === "es" ? "No se pudo cargar tu template" : "Failed to load template"}
                            description={lang === "es" ? "Intenta recargar o revisa tu sesión." : "Try reloading or check your session."}
                        />
                    ) : !templateWeek ? (
                        <div className="space-y-3">
                            <EmptyState
                                title={lang === "es" ? "No existe template para esta semana" : "No template for this week"}
                                description={lang === "es" ? "Crea/edita tu rutina en Rutinas para poder asignarla." : "Create/edit your routine in Routines before assigning."}
                            />
                            <Button type="button" variant="default" onClick={() => navigate("/routines")}>
                                {lang === "es" ? "Ir a Rutinas" : "Go to Routines"}
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className="rounded-xl border bg-background p-3 sm:p-4">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="min-w-0">
                                        <div className="text-sm font-semibold">
                                            {lang === "es" ? "Template cargado" : "Template loaded"}{" "}
                                            <span className="text-muted-foreground">({templateWeek.weekKey})</span>
                                        </div>
                                        <div className="mt-1 text-xs text-muted-foreground">
                                            {lang === "es"
                                                ? `Título: ${templateWeek.title ?? "—"} · Split: ${templateWeek.split ?? "—"}`
                                                : `Title: ${templateWeek.title ?? "—"} · Split: ${templateWeek.split ?? "—"}`}
                                        </div>
                                    </div>

                                    <label className="flex items-center gap-2 text-sm">
                                        <input type="checkbox" checked={clearEmptyDays} onChange={() => setClearEmptyDays((v) => !v)} />
                                        <span>{lang === "es" ? "Limpiar días vacíos (rest)" : "Clear empty days (rest)"}</span>
                                    </label>
                                </div>

                                <div className="mt-3 grid gap-2 sm:flex sm:flex-wrap">
                                    <Button type="button" variant="default" onClick={onAssignWeek} disabled={assignWeekM.isPending}>
                                        {assignWeekM.isPending
                                            ? lang === "es"
                                                ? "Asignando semana…"
                                                : "Assigning week…"
                                            : lang === "es"
                                                ? "Asignar semana al trainee"
                                                : "Assign week to trainee"}
                                    </Button>

                                    <Button type="button" variant="outline" onClick={() => tplQ.refetch()}>
                                        {lang === "es" ? "Recargar template" : "Reload template"}
                                    </Button>
                                </div>
                            </div>

                            <Card>
                                <details className="group">
                                    <summary
                                        className={[
                                            "list-none cursor-pointer select-none",
                                            "flex items-center justify-between gap-3",
                                            // match CardHeader padding
                                            "p-4 sm:p-6",
                                        ].join(" ")}
                                    >
                                        <div className="min-w-0">
                                            <div className="text-base sm:text-lg font-semibold leading-none tracking-tight">
                                                {lang === "es" ? "Vista previa (template)" : "Template preview"}
                                            </div>
                                            <div className="mt-1 text-xs sm:text-sm text-muted-foreground">
                                                {lang === "es" ? "Toca para ver/ocultar" : "Tap to expand/collapse"}
                                            </div>
                                        </div>

                                        {/* Chevron (pure CSS rotate) */}
                                        <span
                                            aria-hidden="true"
                                            className={[
                                                "shrink-0 rounded-md border bg-background px-2 py-1",
                                                "text-xs font-mono text-muted-foreground",
                                                "transition-transform",
                                                "group-open:rotate-180",
                                            ].join(" ")}
                                        >
                                            ▼
                                        </span>
                                    </summary>

                                    {/* Content */}
                                    <div className="px-4 pb-4 sm:px-6 sm:pb-6">
                                        <div className="space-y-2">
                                            {previewRows.map((r) => (
                                                <div key={r.dayKey} className="rounded-lg border bg-background p-3">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="font-mono text-sm font-semibold">{r.dayKey}</div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {r.exists ? `${r.exCount} ex` : lang === "es" ? "vacío" : "empty"}
                                                        </div>
                                                    </div>
                                                    <div className="mt-1 text-sm">
                                                        <span className="font-semibold">{r.sessionType ?? "—"}</span>
                                                        {r.focus ? <span className="text-muted-foreground"> · {r.focus}</span> : null}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </details>
                            </Card>
                        </>
                    )}
                </CardContent>
            </Card>

            {lastReport ? <ReportCard report={lastReport} lang={lang} /> : null}

            <Card>
                <CardHeader>
                    <CardTitle>{lang === "es" ? "Editar por día" : "Edit per day"}</CardTitle>
                    <CardDescription>
                        {lang === "es"
                            ? "El editor refleja lo guardado en el trainee (source of truth) y puedes cargar desde template si quieres."
                            : "Editor reflects trainee saved data (source of truth) and you can load from template if needed."}
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    <div className="-mx-1 px-1 overflow-x-auto">
                        <div className="flex items-center gap-2 w-max">
                            {DAY_KEYS.map((dk) => (
                                <button key={dk} type="button" className={tabButton(dk === activeDayKey)} onClick={() => setActiveDayKey(dk)}>
                                    {dayKeyLabel(dk, lang)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-xl border bg-background p-3 sm:p-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                                <div className="text-sm font-semibold">
                                    {lang === "es" ? "Día seleccionado" : "Selected day"}:{" "}
                                    <span className="font-mono">{activeDayKey}</span>{" "}
                                    <span className="text-muted-foreground">({activeDate})</span>
                                </div>
                                <div className="mt-1 text-xs text-muted-foreground">
                                    {traineeDayQ.isLoading
                                        ? lang === "es"
                                            ? "Cargando día del trainee…"
                                            : "Loading trainee day…"
                                        : hasTrainingLock
                                            ? lang === "es"
                                                ? "Bloqueado: ya tiene entrenamiento."
                                                : "Locked: training exists."
                                            : lang === "es"
                                                ? "Disponible para modificar plannedRoutine."
                                                : "Available to modify plannedRoutine."}
                                </div>
                            </div>

                            <div className="grid gap-2 sm:flex sm:flex-wrap">
                                <Button type="button" variant="default" onClick={onSaveActiveDay} disabled={patchDayM.isPending || traineeDayQ.isLoading || hasTrainingLock}>
                                    {patchDayM.isPending ? (lang === "es" ? "Guardando…" : "Saving…") : (lang === "es" ? "Guardar este día" : "Save this day")}
                                </Button>

                                <Button type="button" variant="outline" onClick={onMarkRestActiveDay} disabled={patchDayM.isPending || traineeDayQ.isLoading || hasTrainingLock}>
                                    {lang === "es" ? "Marcar descanso" : "Mark rest"}
                                </Button>

                                <Button type="button" variant="outline" onClick={onLoadActiveDayFromTemplate} disabled={patchDayM.isPending || traineeDayQ.isLoading}>
                                    {lang === "es" ? "Cargar desde template" : "Load from template"}
                                </Button>
                            </div>
                        </div>
                    </div>

                    <RoutinesDayEditor
                        activePlan={activePlan}
                        busy={patchDayM.isPending || traineeDayQ.isLoading || hasTrainingLock}
                        t={t as any}
                        lang={lang}
                        ph={{
                            sessionType: lang === "es" ? "Ej: Pull power" : "e.g. Pull power",
                            focus: lang === "es" ? "Ej: Espalda" : "e.g. Back",
                            tags: lang === "es" ? "Ej: power, gym" : "e.g. power, gym",
                            notes: lang === "es" ? "Notas del día (opcional)" : "Day notes (optional)",
                            exNotes: lang === "es" ? "Notas del ejercicio (opcional)" : "Exercise notes (optional)",
                            sets: lang === "es" ? "Ej: 4" : "e.g. 4",
                            reps: lang === "es" ? "Ej: 8-10" : "e.g. 8-10",
                            load: lang === "es" ? "Ej: 70 lb" : "e.g. 70 lb",
                        }}
                        attachmentOptions={attachmentOptions}
                        movementOptions={movementOptions}
                        exerciseUploadBusy={exerciseUploadBusy}
                        uploadingExercise={uploadingExercise}
                        getPendingFilesForExercise={(exerciseId) => getPendingExerciseFiles(exerciseId)}
                        onPickFilesForExercise={(exerciseId, files) => onAddPendingExerciseFiles(exerciseId, files)}
                        onRemovePendingForExercise={(exerciseId, fileIndex) => onClearPendingExerciseFiles(exerciseId, fileIndex)}
                        onAddExercise={onAddExercise}
                        onRemoveExercise={onRemoveExercise}
                        onUpdatePlan={onUpdatePlan}
                        onUpdateExercise={onUpdateExercise}
                        scrollRootEl={null}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
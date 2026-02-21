import * as React from "react";
import { toast } from "sonner";
import { addDays, addWeeks, endOfISOWeek, format, startOfISOWeek } from "date-fns";

import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";

import { useI18n } from "@/i18n/I18nProvider";

import { toWeekKey, weekKeyToStartDate } from "@/utils/weekKey";

import { MediaViewerModal, type MediaLikeItem } from "@/components/media/MediaViewerModal";
import { useGymCheck } from "@/hooks/useGymCheck";

import { GymCheckWeekPickerCard } from "@/components/gymCheck/GymCheckWeekPickerCard";
import { GymCheckDayTabs } from "@/components/gymCheck/GymCheckDayTabs";
import { GymCheckPlanInfo } from "@/components/gymCheck/GymCheckPlanInfo";
import { GymCheckDayQuickLog } from "@/components/gymCheck/GymCheckDayQuickLog";
import { GymCheckExerciseCard } from "@/components/gymCheck/GymCheckExerciseCard";
import { GymCheckDeviceMetricsCard } from "@/components/gymCheck/GymCheckDeviceMetricsCard";
import { GymCheckSessionMetrics } from "@/components/gymCheck/GymCheckSessionMetrics";

import { attachmentToMediaItem } from "@/utils/gymCheck/formatters";
import { dayKeyToDateIso, parseDurationMinutesToSeconds } from "@/utils/gymCheck/sessionPayload";

import type { DayKey, DayPlan, ExerciseItem } from "@/utils/routines/plan";
import { DAY_KEYS } from "@/utils/routines/plan";

import { getWorkoutDayServ } from "@/services/workout";

const DAY_LABELS: Record<(typeof DAY_KEYS)[number], { es: string; en: string }> = {
    Mon: { es: "Lun", en: "Mon" },
    Tue: { es: "Mar", en: "Tue" },
    Wed: { es: "Mié", en: "Wed" },
    Thu: { es: "Jue", en: "Thu" },
    Fri: { es: "Vie", en: "Fri" },
    Sat: { es: "Sáb", en: "Sat" },
    Sun: { es: "Dom", en: "Sun" },
};

function hasAnyMetricValue(metrics: Record<string, unknown> | null | undefined): boolean {
    if (!metrics) return false;
    for (const v of Object.values(metrics)) {
        if (String(v ?? "").trim()) return true;
    }
    return false;
}

/**
 * PlannedRoutine -> DayPlan mapping for display.
 * Notes:
 * - This is intentionally minimal and tolerant to missing fields.
 */
function plannedRoutineToDayPlan(dayKey: DayKey, pr: any): DayPlan {
    const exercisesRaw: any[] = Array.isArray(pr?.exercises) ? pr.exercises : [];

    const exercises: ExerciseItem[] | undefined =
        exercisesRaw.length > 0
            ? exercisesRaw.map((ex: any) => ({
                id: String(ex?.id ?? `ex_${Math.random().toString(16).slice(2)}`),
                name: String(ex?.name ?? ""),
                sets: ex?.sets != null ? String(ex.sets) : undefined,
                reps: typeof ex?.reps === "string" ? ex.reps : ex?.reps != null ? String(ex.reps) : undefined,
                rpe: ex?.rpe != null ? String(ex.rpe) : undefined,
                load: ex?.load != null ? String(ex.load) : undefined,
                notes: ex?.notes != null ? String(ex.notes) : undefined,
                attachmentPublicIds: Array.isArray(ex?.attachmentPublicIds) ? ex.attachmentPublicIds : undefined,
                movementId: ex?.movementId != null ? String(ex.movementId) : undefined,
                movementName: ex?.movementName != null ? String(ex.movementName) : undefined,
            }))
            : undefined;

    const tags: string[] | undefined = Array.isArray(pr?.tags)
        ? pr.tags.map((x: any) => String(x).trim()).filter(Boolean)
        : undefined;

    return {
        dayKey,
        sessionType: typeof pr?.sessionType === "string" ? pr.sessionType : undefined,
        focus: typeof pr?.focus === "string" ? pr.focus : undefined,
        notes: typeof pr?.notes === "string" ? pr.notes : undefined,
        tags,
        exercises,
    };
}

function hasTrainingBlock(day: any): boolean {
    const training = day?.training ?? null;
    if (!training) return false;
    const sessions = Array.isArray(training.sessions) ? training.sessions : [];
    return sessions.length > 0;
}

function hasPlannedExercises(day: any): boolean {
    const pr = day?.plannedRoutine ?? null;
    const ex = Array.isArray(pr?.exercises) ? pr.exercises : null;
    return Array.isArray(ex) && ex.length > 0;
}

function hasGymCheckSession(day: any): boolean {
    const sessions: any[] = Array.isArray(day?.training?.sessions) ? day.training.sessions : [];
    return sessions.some((s) => String(s?.meta?.sessionKey ?? "") === "gym_check");
}

function toNumberOrNull(v: unknown): number | null {
    const s = String(v ?? "").trim();
    if (!s) return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
}

function toIntOrNull(v: unknown): number | null {
    const n = toNumberOrNull(v);
    return n === null ? null : Math.trunc(n);
}

function toStringOrUndefined(v: unknown): string | undefined {
    const s = String(v ?? "").trim();
    return s.length ? s : undefined;
}

/**
 * ========= TIME-ONLY HELPERS =========
 */

function isValidTimeHHmm(v: string): boolean {
    if (!v) return false;
    const m = /^(\d{2}):(\d{2})$/.exec(v);
    if (!m) return false;
    const hh = Number(m[1]);
    const mm = Number(m[2]);
    return hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59;
}

function isoToTimeHHmmOrEmpty(iso: string | null | undefined): string {
    const s = String(iso ?? "").trim();
    if (!s) return "";
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function timeHHmmToIsoOrEmpty(time: string, baseDateIso: string): string {
    const t = String(time ?? "").trim();
    if (!t) return "";
    if (!isValidTimeHHmm(t)) return "";
    const d = new Date(`${baseDateIso}T${t}:00`);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString();
}

type MetricsUiState = {
    startAtTime: string;
    endAtTime: string;
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

function buildMetricsUiFromGymDayMetrics(metrics: any): MetricsUiState {
    return {
        startAtTime: isoToTimeHHmmOrEmpty(metrics?.startAt),
        endAtTime: isoToTimeHHmmOrEmpty(metrics?.endAt),
        activeKcal: String(metrics?.activeKcal ?? ""),
        totalKcal: String(metrics?.totalKcal ?? ""),
        avgHr: String(metrics?.avgHr ?? ""),
        maxHr: String(metrics?.maxHr ?? ""),
        distanceKm: String(metrics?.distanceKm ?? ""),
        steps: String(metrics?.steps ?? ""),
        elevationGainM: String(metrics?.elevationGainM ?? ""),
        paceSecPerKm: String(metrics?.paceSecPerKm ?? ""),
        cadenceRpm: String(metrics?.cadenceRpm ?? ""),
        effortRpe: String(metrics?.effortRpe ?? ""),
        trainingSource: String(metrics?.trainingSource ?? ""),
        dayEffortRpe: String(metrics?.dayEffortRpe ?? ""),
    };
}

export function GymTraineeCheckPage() {
    const { t, lang } = useI18n();

    const today = React.useMemo(() => new Date(), []);
    const [weekDate, setWeekDate] = React.useState(() => format(today, "yyyy-MM-dd"));

    const derivedWeekKey = React.useMemo(() => {
        const d = new Date(`${weekDate}T00:00:00`);
        return toWeekKey(d);
    }, [weekDate]);

    const [runWeekKey, setRunWeekKey] = React.useState(() => toWeekKey(today));
    const [activeDay, setActiveDay] = React.useState<DayKey>("Mon");

    const weekRangeLabel = React.useMemo(() => {
        const d = new Date(`${weekDate}T00:00:00`);
        const start = startOfISOWeek(d);
        const end = endOfISOWeek(d);
        return `${format(start, "MMM d, yyyy")} → ${format(end, "MMM d, yyyy")}`;
    }, [weekDate]);

    function goPrevWeek() {
        const d = new Date(`${weekDate}T00:00:00`);
        setWeekDate(format(addWeeks(d, -1), "yyyy-MM-dd"));
    }

    function goNextWeek() {
        const d = new Date(`${weekDate}T00:00:00`);
        setWeekDate(format(addWeeks(d, 1), "yyyy-MM-dd"));
    }

    function syncToLoadedWeek() {
        const start = weekKeyToStartDate(runWeekKey);
        if (!start) return;
        setWeekDate(format(start, "yyyy-MM-dd"));
    }

    function loadWeek() {
        setRunWeekKey(derivedWeekKey);
        toast.message(`${t("week.selectedWeekKey")}: ${derivedWeekKey}`);
    }

    const activeDayDateIso = React.useMemo(() => {
        const d = dayKeyToDateIso(runWeekKey, activeDay);
        const start = weekKeyToStartDate(runWeekKey);
        const fallback = format(new Date(), "yyyy-MM-dd");
        return d ?? (start ? format(start, "yyyy-MM-dd") : fallback);
    }, [runWeekKey, activeDay]);

    // Load week days (Mon..Sun) from WorkoutDay (self) and build available tabs.
    const [weekDays, setWeekDays] = React.useState<Record<DayKey, any | null>>({
        Mon: null,
        Tue: null,
        Wed: null,
        Thu: null,
        Fri: null,
        Sat: null,
        Sun: null,
    });
    const [weekLoading, setWeekLoading] = React.useState(false);

    React.useEffect(() => {
        let alive = true;

        async function run() {
            try {
                setWeekLoading(true);

                const start = weekKeyToStartDate(runWeekKey);
                const base = start ?? new Date();

                const dates: { dayKey: DayKey; dateIso: string }[] = DAY_KEYS.map((dk, idx) => ({
                    dayKey: dk,
                    dateIso: format(addDays(base, idx), "yyyy-MM-dd"),
                }));

                const results = await Promise.allSettled(
                    dates.map(async (x) => {
                        const day = await getWorkoutDayServ(x.dateIso);
                        return { dayKey: x.dayKey, day };
                    })
                );

                if (!alive) return;

                const next: Record<DayKey, any | null> = {
                    Mon: null,
                    Tue: null,
                    Wed: null,
                    Thu: null,
                    Fri: null,
                    Sat: null,
                    Sun: null,
                };

                for (const r of results) {
                    if (r.status === "fulfilled") {
                        next[r.value.dayKey] = r.value.day;
                    }
                }

                setWeekDays(next);
            } finally {
                if (!alive) return;
                setWeekLoading(false);
            }
        }

        void run();
        return () => {
            alive = false;
        };
    }, [runWeekKey]);

    /**
     * ✅ Tabs: ONLY days with plannedRoutine.exercises.length > 0
     * Fallbacks:
     * 1) If no day has exercises but some day has plannedRoutine -> show those plannedRoutine days
     * 2) If still none but some day has training -> show those training days
     * 3) Else show all days
     */
    const availableDayKeys: DayKey[] = React.useMemo(() => {
        const withExercises = DAY_KEYS.filter((dk) => {
            const day = weekDays[dk];
            if (!day) return false;
            return hasPlannedExercises(day);
        });

        if (withExercises.length > 0) return withExercises;

        const withPlan = DAY_KEYS.filter((dk) => {
            const day = weekDays[dk];
            if (!day) return false;
            return Boolean(day.plannedRoutine);
        });

        if (withPlan.length > 0) return withPlan;

        const withTraining = DAY_KEYS.filter((dk) => {
            const day = weekDays[dk];
            if (!day) return false;
            return hasTrainingBlock(day);
        });

        return withTraining.length > 0 ? withTraining : [...DAY_KEYS];
    }, [weekDays]);

    React.useEffect(() => {
        // Prefer today's dayKey if it's available; otherwise first available.
        const todayKey = DAY_KEYS[(new Date().getDay() + 6) % 7] as DayKey; // JS: Sun=0 -> ISO: Mon=0
        const preferred = availableDayKeys.includes(todayKey) ? todayKey : availableDayKeys[0] ?? "Mon";
        setActiveDay(preferred);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [runWeekKey, availableDayKeys.join(",")]);

    const dayTabItems = React.useMemo(() => {
        return availableDayKeys.map((d) => ({
            dayKey: d,
            label: lang === "es" ? DAY_LABELS[d].es : DAY_LABELS[d].en,
        }));
    }, [availableDayKeys, lang]);

    const remoteDay = weekDays[activeDay] ?? null;

    const activePlan: DayPlan = React.useMemo(() => {
        const pr = remoteDay?.plannedRoutine ?? null;
        if (pr) return plannedRoutineToDayPlan(activeDay, pr);
        return { dayKey: activeDay } as DayPlan;
    }, [remoteDay, activeDay]);

    const exercisesList = (activePlan.exercises ?? []) as ExerciseItem[];
    const hasExercises = Array.isArray(exercisesList) && exercisesList.length > 0;

    // Local GymCheck state (done flags, notes, device metrics)
    const {
        getDay,
        toggleExerciseDone,
        setDayDuration,
        setDayNotes,
        setDayMetrics,
        addExerciseMediaPublicId,
        removeExerciseMediaAt,
        resetWeek,
    } = useGymCheck(runWeekKey);

    const gymDay = getDay(activeDay);

    const doneCount = React.useMemo(() => {
        const ex = gymDay?.exercises ?? {};
        return Object.values(ex).filter((v: any) => v?.done === true).length;
    }, [gymDay]);

    const [metricsUi, setMetricsUi] = React.useState<MetricsUiState>(() =>
        buildMetricsUiFromGymDayMetrics(gymDay?.metrics ?? {})
    );

    React.useEffect(() => {
        setMetricsUi(buildMetricsUiFromGymDayMetrics(gymDay?.metrics ?? {}));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [runWeekKey, activeDay]);

    const metricsHasAny = React.useMemo(() => hasAnyMetricValue(gymDay?.metrics ?? null), [gymDay]);
    const [metricsOpen, setMetricsOpen] = React.useState<boolean>(() => false);

    React.useEffect(() => {
        setMetricsOpen(false);
    }, [runWeekKey, activeDay]);

    function handleMetricUiChange(patch: Partial<MetricsUiState>) {
        setMetricsUi((prev) => ({ ...prev, ...patch }));
    }

    function commitMetricsToStore() {
        const payload: any = {
            startAt: timeHHmmToIsoOrEmpty(metricsUi.startAtTime, activeDayDateIso) || "",
            endAt: timeHHmmToIsoOrEmpty(metricsUi.endAtTime, activeDayDateIso) || "",
            activeKcal: metricsUi.activeKcal,
            totalKcal: metricsUi.totalKcal,
            avgHr: metricsUi.avgHr,
            maxHr: metricsUi.maxHr,
            distanceKm: metricsUi.distanceKm,
            steps: metricsUi.steps,
            elevationGainM: metricsUi.elevationGainM,
            paceSecPerKm: metricsUi.paceSecPerKm,
            cadenceRpm: metricsUi.cadenceRpm,
            effortRpe: metricsUi.effortRpe,
            trainingSource: metricsUi.trainingSource,
            dayEffortRpe: metricsUi.dayEffortRpe,
        };

        setDayMetrics(activeDay, payload);
    }

    const [viewer, setViewer] = React.useState<MediaLikeItem | null>(null);
    const [creating, setCreating] = React.useState(false);

    // Attachments are not available from RoutineWeek for TRAINEE (restricted),
    // so we keep an empty map. This still allows marking done + creating session.
    const attachmentByPublicId = React.useMemo(() => new Map<string, any>(), []);

    async function onCreateRealSession() {
        if (!hasExercises) {
            toast.error(lang === "es" ? "Este día no tiene ejercicios planeados." : "This day has no planned exercises.");
            return;
        }

        commitMetricsToStore();

        const date = dayKeyToDateIso(runWeekKey, activeDay);
        if (!date) {
            toast.error(lang === "es" ? "No se pudo calcular la fecha del día." : "Could not compute day date.");
            return;
        }

        setCreating(true);

        try {
            const dayAfterCommit = getDay(activeDay);

            const durationSeconds = parseDurationMinutesToSeconds(dayAfterCommit?.durationMin);
            const notes = typeof dayAfterCommit?.notes === "string" ? dayAfterCommit.notes : undefined;

            const type =
                typeof (activePlan as any)?.sessionType === "string" && (activePlan as any).sessionType.trim()
                    ? String((activePlan as any).sessionType).trim()
                    : lang === "es"
                        ? "Entrenamiento"
                        : "Workout";

            const m = dayAfterCommit?.metrics ?? {};

            const payload: any = {
                type,
                durationSeconds: typeof durationSeconds === "number" ? durationSeconds : null,
                notes: notes ?? null,

                startAt: toStringOrUndefined(m.startAt) ? String(m.startAt).trim() : null,
                endAt: toStringOrUndefined(m.endAt) ? String(m.endAt).trim() : null,

                activeKcal: toNumberOrNull(m.activeKcal),
                totalKcal: toNumberOrNull(m.totalKcal),

                avgHr: toIntOrNull(m.avgHr),
                maxHr: toIntOrNull(m.maxHr),

                distanceKm: toNumberOrNull(m.distanceKm),
                steps: toIntOrNull(m.steps),
                elevationGainM: toNumberOrNull(m.elevationGainM),

                paceSecPerKm: toIntOrNull(m.paceSecPerKm),
                cadenceRpm: toIntOrNull(m.cadenceRpm),

                effortRpe: toNumberOrNull(m.effortRpe),

                meta: {
                    sessionKey: "gym_check",
                    trainingSource: toStringOrUndefined(m.trainingSource) ?? null,
                    dayEffortRpe: toNumberOrNull(m.dayEffortRpe),
                },
            };

            const mod = await import("@/services/workout/sessions.service");
            const upserted = await mod.upsertGymCheckSession(date, payload, { returnMode: "day" });

            toast.success(
                upserted.mode === "patched"
                    ? (lang === "es" ? "Sesión real actualizada" : "Real session updated")
                    : (lang === "es" ? "Sesión real creada" : "Real session created")
            );
        } catch (e: any) {
            toast.error(e?.message ?? (lang === "es" ? "No se pudo crear la sesión" : "Could not create session"));
        } finally {
            setCreating(false);
        }
    }

    /**
     * GymCheckSessionMetrics requires this handler, but Trainee flow doesn't support it.
     * Keep as a no-op message to avoid changing core logic.
     */
    async function onSaveGymCheckToDb() {
        toast.message(
            lang === "es"
                ? "En modo Trainee no se guarda como ‘rutina semanal’. Solo crea/actualiza la sesión real."
                : "In Trainee mode there is no weekly routine save. Only create/update the real session."
        );
    }

    const busy = weekLoading || creating;

    const routineExists = Boolean(remoteDay?.plannedRoutine);
    const gymCheckSessionExists = hasGymCheckSession(remoteDay);

    // Sticky actions visibility (show when top actions are out of view)
    const topActionsRef = React.useRef<HTMLDivElement | null>(null);
    const [showStickyActions, setShowStickyActions] = React.useState(false);

    React.useEffect(() => {
        const el = topActionsRef.current;
        if (!el) return;

        const io = new IntersectionObserver(
            ([entry]) => {
                setShowStickyActions(!entry.isIntersecting);
            },
            {
                root: null,
                threshold: 0.01,
                rootMargin: "-72px 0px 0px 0px",
            }
        );

        io.observe(el);
        return () => io.disconnect();
    }, []);

    return (
        <div className="space-y-4 sm:space-y-6">
            <PageHeader
                title="Gym Check"
                subtitle={
                    lang === "es"
                        ? "Plan asignado por tu entrenador + checklist + métricas"
                        : "Coach-assigned plan + checklist + metrics"
                }
                right={
                    <div className="w-full sm:w-auto" ref={topActionsRef}>
                        <GymCheckSessionMetrics
                            t={t}
                            lang={lang}
                            busy={busy}
                            routineExists={routineExists}
                            doneCount={doneCount}
                            gymCheckSessionExists={gymCheckSessionExists}
                            onSyncToLoadedWeek={syncToLoadedWeek}
                            onSaveGymCheckToDb={onSaveGymCheckToDb}
                            onCreateRealSession={onCreateRealSession}
                            onResetWeek={resetWeek}
                        />
                    </div>
                }
            />

            <GymCheckWeekPickerCard
                t={t}
                lang={lang}
                busy={busy}
                weekDate={weekDate}
                onWeekDateChange={setWeekDate}
                onPrevWeek={goPrevWeek}
                onNextWeek={goNextWeek}
                onUseWeek={loadWeek}
                derivedWeekKey={derivedWeekKey}
                runWeekKey={runWeekKey}
                weekRangeLabel={weekRangeLabel}
                routineTitle={null}
                routineSplit={null}
                routineExists={false}
            />

            {weekLoading ? (
                <EmptyState
                    title={lang === "es" ? "Cargando semana…" : "Loading week…"}
                    description={lang === "es" ? "Buscando días con plan asignado." : "Finding days with an assigned plan."}
                />
            ) : (
                <div className="space-y-4">
                    <div className="-mx-2 px-2 overflow-x-auto">
                        <div className="min-w-max">
                            <GymCheckDayTabs items={dayTabItems} activeDay={activeDay} onSelectDay={setActiveDay} />
                        </div>
                    </div>

                    {!remoteDay?.plannedRoutine ? (
                        <EmptyState
                            title={lang === "es" ? "Sin plan asignado" : "No assigned plan"}
                            description={
                                lang === "es"
                                    ? "Este día no tiene plannedRoutine asignado."
                                    : "This day has no plannedRoutine assigned."
                            }
                        />
                    ) : !hasExercises ? (
                        <EmptyState
                            title={lang === "es" ? "Sin ejercicios" : "No exercises"}
                            description={
                                lang === "es"
                                    ? "Este día tiene plan, pero sin ejercicios."
                                    : "This day has a plan, but no exercises."
                            }
                        />
                    ) : (
                        <>
                            <div className="grid gap-4 md:grid-cols-2">
                                <GymCheckPlanInfo
                                    lang={lang}
                                    activeDay={activeDay}
                                    dayLabels={DAY_LABELS}
                                    activePlan={activePlan}
                                />

                                <GymCheckDayQuickLog
                                    lang={lang}
                                    busy={busy}
                                    durationMin={gymDay.durationMin}
                                    notes={gymDay.notes}
                                    onChangeDuration={(v) => setDayDuration(activeDay, v)}
                                    onChangeNotes={(v) => setDayNotes(activeDay, v)}
                                />
                            </div>

                            <GymCheckDeviceMetricsCard
                                lang={lang}
                                busy={busy}
                                metricsOpen={metricsOpen}
                                onToggleOpen={setMetricsOpen}
                                metricsHasAny={metricsHasAny}
                                metricsUi={metricsUi}
                                onMetricsUiChange={handleMetricUiChange}
                                onCommit={commitMetricsToStore}
                            />

                            <div className="space-y-3">
                                {exercisesList.map((ex: ExerciseItem, idx: number) => {
                                    const exerciseId = (ex as any).id || `idx_${idx}`;
                                    const exState = gymDay.exercises?.[exerciseId] ?? { done: false, mediaPublicIds: [] };

                                    return (
                                        <GymCheckExerciseCard
                                            key={`${activeDay}-${exerciseId}`}
                                            lang={lang}
                                            busy={busy}
                                            dayKey={activeDay}
                                            exercise={ex}
                                            index={idx}
                                            exerciseId={exerciseId}
                                            isDone={Boolean(exState.done)}
                                            uploading={false}
                                            mediaPublicIds={Array.isArray(exState.mediaPublicIds) ? exState.mediaPublicIds : []}
                                            attachmentByPublicId={attachmentByPublicId}
                                            onToggleDone={() => toggleExerciseDone(activeDay, exerciseId)}
                                            onUploadFiles={() => {
                                                toast.message(
                                                    lang === "es"
                                                        ? "Subidas desde rutina no disponibles en modo Trainee."
                                                        : "Routine-based uploads are not available in Trainee mode."
                                                );
                                            }}
                                            onOpenViewer={(opt) => {
                                                const item = attachmentToMediaItem(opt);
                                                if (!item) return;
                                                setViewer(item);
                                            }}
                                            onRemoveMediaAt={(i) => removeExerciseMediaAt(activeDay, exerciseId, i)}
                                        />
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Sticky bottom actions (mobile) */}
            {routineExists && showStickyActions ? (
                <div
                    className={[
                        "fixed inset-x-0 bottom-0 z-50 md:hidden",
                        "border-t bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/70",
                    ].join(" ")}
                    style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
                >
                    <div className="mx-auto max-w-6xl px-3 sm:px-4 py-2">
                        <GymCheckSessionMetrics
                            t={t}
                            lang={lang}
                            busy={busy}
                            routineExists={routineExists}
                            doneCount={doneCount}
                            gymCheckSessionExists={gymCheckSessionExists}
                            onSyncToLoadedWeek={syncToLoadedWeek}
                            onSaveGymCheckToDb={onSaveGymCheckToDb}
                            onCreateRealSession={onCreateRealSession}
                            onResetWeek={resetWeek}
                        />
                    </div>
                </div>
            ) : null}

            {routineExists ? <div className="h-24 md:hidden" /> : null}

            {viewer ? <MediaViewerModal item={viewer} onClose={() => setViewer(null)} /> : null}
        </div>
    );
}




// import * as React from "react";
// import { toast } from "sonner";
// import { addDays, addWeeks, endOfISOWeek, format, startOfISOWeek } from "date-fns";

// import { PageHeader } from "@/components/PageHeader";
// import { EmptyState } from "@/components/EmptyState";
// import { Button } from "@/components/ui/button";

// import { useI18n } from "@/i18n/I18nProvider";

// import { toWeekKey, weekKeyToStartDate } from "@/utils/weekKey";

// import { MediaViewerModal, type MediaLikeItem } from "@/components/media/MediaViewerModal";
// import { useGymCheck } from "@/hooks/useGymCheck";

// import { GymCheckWeekPickerCard } from "@/components/gymCheck/GymCheckWeekPickerCard";
// import { GymCheckDayTabs } from "@/components/gymCheck/GymCheckDayTabs";
// import { GymCheckPlanInfo } from "@/components/gymCheck/GymCheckPlanInfo";
// import { GymCheckDayQuickLog } from "@/components/gymCheck/GymCheckDayQuickLog";
// import { GymCheckExerciseCard } from "@/components/gymCheck/GymCheckExerciseCard";
// import { GymCheckDeviceMetricsCard } from "@/components/gymCheck/GymCheckDeviceMetricsCard";

// import { attachmentToMediaItem } from "@/utils/gymCheck/formatters";
// import { dayKeyToDateIso, parseDurationMinutesToSeconds } from "@/utils/gymCheck/sessionPayload";

// import type { DayKey, DayPlan, ExerciseItem } from "@/utils/routines/plan";
// import { DAY_KEYS } from "@/utils/routines/plan";

// import { getWorkoutDayServ } from "@/services/workout";

// const DAY_LABELS: Record<(typeof DAY_KEYS)[number], { es: string; en: string }> = {
//     Mon: { es: "Lun", en: "Mon" },
//     Tue: { es: "Mar", en: "Tue" },
//     Wed: { es: "Mié", en: "Wed" },
//     Thu: { es: "Jue", en: "Thu" },
//     Fri: { es: "Vie", en: "Fri" },
//     Sat: { es: "Sáb", en: "Sat" },
//     Sun: { es: "Dom", en: "Sun" },
// };

// function hasAnyMetricValue(metrics: Record<string, unknown> | null | undefined): boolean {
//     if (!metrics) return false;
//     for (const v of Object.values(metrics)) {
//         if (String(v ?? "").trim()) return true;
//     }
//     return false;
// }

// /**
//  * PlannedRoutine -> DayPlan mapping for display.
//  * Notes:
//  * - This is intentionally minimal and tolerant to missing fields.
//  */
// function plannedRoutineToDayPlan(dayKey: DayKey, pr: any): DayPlan {
//     const exercisesRaw: any[] = Array.isArray(pr?.exercises) ? pr.exercises : [];

//     const exercises: ExerciseItem[] | undefined =
//         exercisesRaw.length > 0
//             ? exercisesRaw.map((ex: any) => ({
//                 id: String(ex?.id ?? `ex_${Math.random().toString(16).slice(2)}`),
//                 name: String(ex?.name ?? ""),
//                 sets: ex?.sets != null ? String(ex.sets) : undefined,
//                 reps: typeof ex?.reps === "string" ? ex.reps : ex?.reps != null ? String(ex.reps) : undefined,
//                 rpe: ex?.rpe != null ? String(ex.rpe) : undefined,
//                 load: ex?.load != null ? String(ex.load) : undefined,
//                 notes: ex?.notes != null ? String(ex.notes) : undefined,
//                 attachmentPublicIds: Array.isArray(ex?.attachmentPublicIds) ? ex.attachmentPublicIds : undefined,
//                 movementId: ex?.movementId != null ? String(ex.movementId) : undefined,
//                 movementName: ex?.movementName != null ? String(ex.movementName) : undefined,
//             }))
//             : undefined;

//     const tags: string[] | undefined = Array.isArray(pr?.tags)
//         ? pr.tags.map((x: any) => String(x).trim()).filter(Boolean)
//         : undefined;

//     return {
//         dayKey,
//         sessionType: typeof pr?.sessionType === "string" ? pr.sessionType : undefined,
//         focus: typeof pr?.focus === "string" ? pr.focus : undefined,
//         notes: typeof pr?.notes === "string" ? pr.notes : undefined,
//         tags,
//         exercises,
//     };
// }

// function hasTrainingBlock(day: any): boolean {
//     const training = day?.training ?? null;
//     if (!training) return false;
//     const sessions = Array.isArray(training.sessions) ? training.sessions : [];
//     return sessions.length > 0;
// }

// function hasPlannedExercises(day: any): boolean {
//     const pr = day?.plannedRoutine ?? null;
//     const ex = Array.isArray(pr?.exercises) ? pr.exercises : null;
//     return Array.isArray(ex) && ex.length > 0;
// }

// function toNumberOrNull(v: unknown): number | null {
//     const s = String(v ?? "").trim();
//     if (!s) return null;
//     const n = Number(s);
//     return Number.isFinite(n) ? n : null;
// }

// function toIntOrNull(v: unknown): number | null {
//     const n = toNumberOrNull(v);
//     return n === null ? null : Math.trunc(n);
// }

// function toStringOrUndefined(v: unknown): string | undefined {
//     const s = String(v ?? "").trim();
//     return s.length ? s : undefined;
// }

// /**
//  * ========= TIME-ONLY HELPERS =========
//  */

// function isValidTimeHHmm(v: string): boolean {
//     if (!v) return false;
//     const m = /^(\d{2}):(\d{2})$/.exec(v);
//     if (!m) return false;
//     const hh = Number(m[1]);
//     const mm = Number(m[2]);
//     return hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59;
// }

// function isoToTimeHHmmOrEmpty(iso: string | null | undefined): string {
//     const s = String(iso ?? "").trim();
//     if (!s) return "";
//     const d = new Date(s);
//     if (Number.isNaN(d.getTime())) return "";
//     const pad = (n: number) => String(n).padStart(2, "0");
//     return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
// }

// function timeHHmmToIsoOrEmpty(time: string, baseDateIso: string): string {
//     const t = String(time ?? "").trim();
//     if (!t) return "";
//     if (!isValidTimeHHmm(t)) return "";
//     const d = new Date(`${baseDateIso}T${t}:00`);
//     if (Number.isNaN(d.getTime())) return "";
//     return d.toISOString();
// }

// type MetricsUiState = {
//     startAtTime: string;
//     endAtTime: string;
//     activeKcal: string;
//     totalKcal: string;
//     avgHr: string;
//     maxHr: string;
//     distanceKm: string;
//     steps: string;
//     elevationGainM: string;
//     paceSecPerKm: string;
//     cadenceRpm: string;
//     effortRpe: string;
//     trainingSource: string;
//     dayEffortRpe: string;
// };

// function buildMetricsUiFromGymDayMetrics(metrics: any): MetricsUiState {
//     return {
//         startAtTime: isoToTimeHHmmOrEmpty(metrics?.startAt),
//         endAtTime: isoToTimeHHmmOrEmpty(metrics?.endAt),
//         activeKcal: String(metrics?.activeKcal ?? ""),
//         totalKcal: String(metrics?.totalKcal ?? ""),
//         avgHr: String(metrics?.avgHr ?? ""),
//         maxHr: String(metrics?.maxHr ?? ""),
//         distanceKm: String(metrics?.distanceKm ?? ""),
//         steps: String(metrics?.steps ?? ""),
//         elevationGainM: String(metrics?.elevationGainM ?? ""),
//         paceSecPerKm: String(metrics?.paceSecPerKm ?? ""),
//         cadenceRpm: String(metrics?.cadenceRpm ?? ""),
//         effortRpe: String(metrics?.effortRpe ?? ""),
//         trainingSource: String(metrics?.trainingSource ?? ""),
//         dayEffortRpe: String(metrics?.dayEffortRpe ?? ""),
//     };
// }

// export function GymTraineeCheckPage() {
//     const { t, lang } = useI18n();

//     const today = React.useMemo(() => new Date(), []);
//     const [weekDate, setWeekDate] = React.useState(() => format(today, "yyyy-MM-dd"));

//     const derivedWeekKey = React.useMemo(() => {
//         const d = new Date(`${weekDate}T00:00:00`);
//         return toWeekKey(d);
//     }, [weekDate]);

//     const [runWeekKey, setRunWeekKey] = React.useState(() => toWeekKey(today));
//     const [activeDay, setActiveDay] = React.useState<DayKey>("Mon");

//     const weekRangeLabel = React.useMemo(() => {
//         const d = new Date(`${weekDate}T00:00:00`);
//         const start = startOfISOWeek(d);
//         const end = endOfISOWeek(d);
//         return `${format(start, "MMM d, yyyy")} → ${format(end, "MMM d, yyyy")}`;
//     }, [weekDate]);

//     function goPrevWeek() {
//         const d = new Date(`${weekDate}T00:00:00`);
//         setWeekDate(format(addWeeks(d, -1), "yyyy-MM-dd"));
//     }

//     function goNextWeek() {
//         const d = new Date(`${weekDate}T00:00:00`);
//         setWeekDate(format(addWeeks(d, 1), "yyyy-MM-dd"));
//     }

//     function syncToLoadedWeek() {
//         const start = weekKeyToStartDate(runWeekKey);
//         if (!start) return;
//         setWeekDate(format(start, "yyyy-MM-dd"));
//     }

//     function loadWeek() {
//         setRunWeekKey(derivedWeekKey);
//         toast.message(`${t("week.selectedWeekKey")}: ${derivedWeekKey}`);
//     }

//     const activeDayDateIso = React.useMemo(() => {
//         const d = dayKeyToDateIso(runWeekKey, activeDay);
//         const start = weekKeyToStartDate(runWeekKey);
//         const fallback = format(new Date(), "yyyy-MM-dd");
//         return d ?? (start ? format(start, "yyyy-MM-dd") : fallback);
//     }, [runWeekKey, activeDay]);

//     // Load week days (Mon..Sun) from WorkoutDay (self) and build available tabs.
//     const [weekDays, setWeekDays] = React.useState<Record<DayKey, any | null>>({
//         Mon: null,
//         Tue: null,
//         Wed: null,
//         Thu: null,
//         Fri: null,
//         Sat: null,
//         Sun: null,
//     });
//     const [weekLoading, setWeekLoading] = React.useState(false);

//     React.useEffect(() => {
//         let alive = true;

//         async function run() {
//             try {
//                 setWeekLoading(true);

//                 const start = weekKeyToStartDate(runWeekKey);
//                 const base = start ?? new Date();

//                 const dates: { dayKey: DayKey; dateIso: string }[] = DAY_KEYS.map((dk, idx) => ({
//                     dayKey: dk,
//                     dateIso: format(addDays(base, idx), "yyyy-MM-dd"),
//                 }));

//                 const results = await Promise.allSettled(
//                     dates.map(async (x) => {
//                         const day = await getWorkoutDayServ(x.dateIso);
//                         return { dayKey: x.dayKey, day };
//                     })
//                 );

//                 if (!alive) return;

//                 const next: Record<DayKey, any | null> = {
//                     Mon: null,
//                     Tue: null,
//                     Wed: null,
//                     Thu: null,
//                     Fri: null,
//                     Sat: null,
//                     Sun: null,
//                 };

//                 for (const r of results) {
//                     if (r.status === "fulfilled") {
//                         next[r.value.dayKey] = r.value.day;
//                     }
//                 }

//                 setWeekDays(next);
//             } finally {
//                 if (!alive) return;
//                 setWeekLoading(false);
//             }
//         }

//         void run();
//         return () => {
//             alive = false;
//         };
//     }, [runWeekKey]);

//     /**
//      * ✅ Tabs: ONLY days with plannedRoutine.exercises.length > 0
//      * Fallbacks:
//      * 1) If no day has exercises but some day has plannedRoutine -> show those plannedRoutine days
//      * 2) If still none but some day has training -> show those training days
//      * 3) Else show all days
//      */
//     const availableDayKeys: DayKey[] = React.useMemo(() => {
//         const withExercises = DAY_KEYS.filter((dk) => {
//             const day = weekDays[dk];
//             if (!day) return false;
//             return hasPlannedExercises(day);
//         });

//         if (withExercises.length > 0) return withExercises;

//         const withPlan = DAY_KEYS.filter((dk) => {
//             const day = weekDays[dk];
//             if (!day) return false;
//             return Boolean(day.plannedRoutine);
//         });

//         if (withPlan.length > 0) return withPlan;

//         const withTraining = DAY_KEYS.filter((dk) => {
//             const day = weekDays[dk];
//             if (!day) return false;
//             return hasTrainingBlock(day);
//         });

//         return withTraining.length > 0 ? withTraining : [...DAY_KEYS];
//     }, [weekDays]);

//     React.useEffect(() => {
//         // Pick a sensible default active day when week changes:
//         // Prefer today's dayKey if it's available; otherwise first available.
//         const todayKey = DAY_KEYS[(new Date().getDay() + 6) % 7] as DayKey; // JS: Sun=0 -> ISO: Mon=0
//         const preferred = availableDayKeys.includes(todayKey) ? todayKey : availableDayKeys[0] ?? "Mon";
//         setActiveDay(preferred);
//         // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, [runWeekKey, availableDayKeys.join(",")]);

//     const dayTabItems = React.useMemo(() => {
//         return availableDayKeys.map((d) => ({
//             dayKey: d,
//             label: lang === "es" ? DAY_LABELS[d].es : DAY_LABELS[d].en,
//         }));
//     }, [availableDayKeys, lang]);

//     const remoteDay = weekDays[activeDay] ?? null;

//     const activePlan: DayPlan = React.useMemo(() => {
//         const pr = remoteDay?.plannedRoutine ?? null;
//         if (pr) return plannedRoutineToDayPlan(activeDay, pr);
//         return { dayKey: activeDay } as DayPlan;
//     }, [remoteDay, activeDay]);

//     const exercisesList = (activePlan.exercises ?? []) as ExerciseItem[];
//     const hasExercises = Array.isArray(exercisesList) && exercisesList.length > 0;

//     // Local GymCheck state (done flags, notes, device metrics)
//     const {
//         getDay,
//         toggleExerciseDone,
//         setDayDuration,
//         setDayNotes,
//         setDayMetrics,
//         addExerciseMediaPublicId,
//         removeExerciseMediaAt,
//         resetWeek,
//     } = useGymCheck(runWeekKey);

//     const gymDay = getDay(activeDay);

//     const doneCount = React.useMemo(() => {
//         const ex = gymDay?.exercises ?? {};
//         return Object.values(ex).filter((v: any) => v?.done === true).length;
//     }, [gymDay]);

//     const [metricsUi, setMetricsUi] = React.useState<MetricsUiState>(() =>
//         buildMetricsUiFromGymDayMetrics(gymDay?.metrics ?? {})
//     );

//     React.useEffect(() => {
//         setMetricsUi(buildMetricsUiFromGymDayMetrics(gymDay?.metrics ?? {}));
//         // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, [runWeekKey, activeDay]);

//     const metricsHasAny = React.useMemo(() => hasAnyMetricValue(gymDay?.metrics ?? null), [gymDay]);
//     const [metricsOpen, setMetricsOpen] = React.useState<boolean>(() => false);

//     React.useEffect(() => {
//         setMetricsOpen(false);
//     }, [runWeekKey, activeDay]);

//     function handleMetricUiChange(patch: Partial<MetricsUiState>) {
//         setMetricsUi((prev) => ({ ...prev, ...patch }));
//     }

//     function commitMetricsToStore() {
//         const payload: any = {
//             startAt: timeHHmmToIsoOrEmpty(metricsUi.startAtTime, activeDayDateIso) || "",
//             endAt: timeHHmmToIsoOrEmpty(metricsUi.endAtTime, activeDayDateIso) || "",
//             activeKcal: metricsUi.activeKcal,
//             totalKcal: metricsUi.totalKcal,
//             avgHr: metricsUi.avgHr,
//             maxHr: metricsUi.maxHr,
//             distanceKm: metricsUi.distanceKm,
//             steps: metricsUi.steps,
//             elevationGainM: metricsUi.elevationGainM,
//             paceSecPerKm: metricsUi.paceSecPerKm,
//             cadenceRpm: metricsUi.cadenceRpm,
//             effortRpe: metricsUi.effortRpe,
//             trainingSource: metricsUi.trainingSource,
//             dayEffortRpe: metricsUi.dayEffortRpe,
//         };

//         setDayMetrics(activeDay, payload);
//     }

//     const [viewer, setViewer] = React.useState<MediaLikeItem | null>(null);
//     const [creating, setCreating] = React.useState(false);

//     // Attachments are not available from RoutineWeek for TRAINEE (restricted),
//     // so we keep an empty map. This still allows marking done + creating session.
//     const attachmentByPublicId = React.useMemo(() => new Map<string, any>(), []);

//     async function onCreateRealSession() {
//         if (!hasExercises) {
//             toast.error(lang === "es" ? "Este día no tiene ejercicios planeados." : "This day has no planned exercises.");
//             return;
//         }

//         commitMetricsToStore();

//         const date = dayKeyToDateIso(runWeekKey, activeDay);
//         if (!date) {
//             toast.error(lang === "es" ? "No se pudo calcular la fecha del día." : "Could not compute day date.");
//             return;
//         }

//         setCreating(true);

//         try {
//             const dayAfterCommit = getDay(activeDay);

//             const durationSeconds = parseDurationMinutesToSeconds(dayAfterCommit?.durationMin);
//             const notes = typeof dayAfterCommit?.notes === "string" ? dayAfterCommit.notes : undefined;

//             const type =
//                 typeof (activePlan as any)?.sessionType === "string" && (activePlan as any).sessionType.trim()
//                     ? String((activePlan as any).sessionType).trim()
//                     : lang === "es"
//                         ? "Entrenamiento"
//                         : "Workout";

//             const m = dayAfterCommit?.metrics ?? {};

//             const payload: any = {
//                 type,
//                 durationSeconds: typeof durationSeconds === "number" ? durationSeconds : null,
//                 notes: notes ?? null,

//                 startAt: toStringOrUndefined(m.startAt) ? String(m.startAt).trim() : null,
//                 endAt: toStringOrUndefined(m.endAt) ? String(m.endAt).trim() : null,

//                 activeKcal: toNumberOrNull(m.activeKcal),
//                 totalKcal: toNumberOrNull(m.totalKcal),

//                 avgHr: toIntOrNull(m.avgHr),
//                 maxHr: toIntOrNull(m.maxHr),

//                 distanceKm: toNumberOrNull(m.distanceKm),
//                 steps: toIntOrNull(m.steps),
//                 elevationGainM: toNumberOrNull(m.elevationGainM),

//                 paceSecPerKm: toIntOrNull(m.paceSecPerKm),
//                 cadenceRpm: toIntOrNull(m.cadenceRpm),

//                 effortRpe: toNumberOrNull(m.effortRpe),

//                 meta: {
//                     sessionKey: "gym_check",
//                     trainingSource: toStringOrUndefined(m.trainingSource) ?? null,
//                     dayEffortRpe: toNumberOrNull(m.dayEffortRpe),
//                 },
//             };

//             const mod = await import("@/services/workout/sessions.service");
//             const upserted = await mod.upsertGymCheckSession(date, payload, { returnMode: "day" });

//             toast.success(
//                 upserted.mode === "patched"
//                     ? (lang === "es" ? "Sesión real actualizada" : "Real session updated")
//                     : (lang === "es" ? "Sesión real creada" : "Real session created")
//             );
//         } catch (e: any) {
//             toast.error(e?.message ?? (lang === "es" ? "No se pudo crear la sesión" : "Could not create session"));
//         } finally {
//             setCreating(false);
//         }
//     }

//     return (
//         <div className="space-y-4 sm:space-y-6">
//             <PageHeader
//                 title="Gym Check"
//                 subtitle={
//                     lang === "es"
//                         ? "Plan asignado por tu entrenador + checklist + métricas"
//                         : "Coach-assigned plan + checklist + metrics"
//                 }
//                 right={
//                     <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
//                         <Button variant="outline" onClick={syncToLoadedWeek} disabled={weekLoading || creating}>
//                             {lang === "es" ? "Ir a semana cargada" : "Go to loaded week"}
//                         </Button>

//                         <Button onClick={onCreateRealSession} disabled={weekLoading || creating || !hasExercises}>
//                             {creating
//                                 ? (lang === "es" ? "Creando…" : "Creating…")
//                                 : (lang === "es" ? "Crear sesión real" : "Create real session")}
//                         </Button>

//                         <Button variant="outline" onClick={resetWeek} disabled={weekLoading || creating}>
//                             {lang === "es" ? "Reset" : "Reset"}
//                         </Button>
//                     </div>
//                 }
//             />

//             <GymCheckWeekPickerCard
//                 t={t}
//                 lang={lang}
//                 busy={weekLoading || creating}
//                 weekDate={weekDate}
//                 onWeekDateChange={setWeekDate}
//                 onPrevWeek={goPrevWeek}
//                 onNextWeek={goNextWeek}
//                 onUseWeek={loadWeek}
//                 derivedWeekKey={derivedWeekKey}
//                 runWeekKey={runWeekKey}
//                 weekRangeLabel={weekRangeLabel}
//                 routineTitle={null}
//                 routineSplit={null}
//                 routineExists={false}
//             />

//             {weekLoading ? (
//                 <EmptyState
//                     title={lang === "es" ? "Cargando semana…" : "Loading week…"}
//                     description={lang === "es" ? "Buscando días con plan asignado." : "Finding days with an assigned plan."}
//                 />
//             ) : (
//                 <div className="space-y-4">
//                     <div className="-mx-2 px-2 overflow-x-auto">
//                         <div className="min-w-max">
//                             <GymCheckDayTabs items={dayTabItems} activeDay={activeDay} onSelectDay={setActiveDay} />
//                         </div>
//                     </div>

//                     {!remoteDay?.plannedRoutine ? (
//                         <EmptyState
//                             title={lang === "es" ? "Sin plan asignado" : "No assigned plan"}
//                             description={
//                                 lang === "es"
//                                     ? "Este día no tiene plannedRoutine asignado."
//                                     : "This day has no plannedRoutine assigned."
//                             }
//                         />
//                     ) : !hasExercises ? (
//                         <EmptyState
//                             title={lang === "es" ? "Sin ejercicios" : "No exercises"}
//                             description={
//                                 lang === "es"
//                                     ? "Este día tiene plan, pero sin ejercicios."
//                                     : "This day has a plan, but no exercises."
//                             }
//                         />
//                     ) : (
//                         <>
//                             <div className="grid gap-4 md:grid-cols-2">
//                                 <GymCheckPlanInfo lang={lang} activeDay={activeDay} dayLabels={DAY_LABELS} activePlan={activePlan} />

//                                 <GymCheckDayQuickLog
//                                     lang={lang}
//                                     busy={creating}
//                                     durationMin={gymDay.durationMin}
//                                     notes={gymDay.notes}
//                                     onChangeDuration={(v) => setDayDuration(activeDay, v)}
//                                     onChangeNotes={(v) => setDayNotes(activeDay, v)}
//                                 />
//                             </div>

//                             <GymCheckDeviceMetricsCard
//                                 lang={lang}
//                                 busy={creating}
//                                 metricsOpen={metricsOpen}
//                                 onToggleOpen={setMetricsOpen}
//                                 metricsHasAny={metricsHasAny}
//                                 metricsUi={metricsUi}
//                                 onMetricsUiChange={handleMetricUiChange}
//                                 onCommit={commitMetricsToStore}
//                             />

//                             <div className="space-y-3">
//                                 {exercisesList.map((ex: ExerciseItem, idx: number) => {
//                                     const exerciseId = (ex as any).id || `idx_${idx}`;
//                                     const exState = gymDay.exercises?.[exerciseId] ?? { done: false, mediaPublicIds: [] };

//                                     return (
//                                         <GymCheckExerciseCard
//                                             key={`${activeDay}-${exerciseId}`}
//                                             lang={lang}
//                                             busy={creating}
//                                             dayKey={activeDay}
//                                             exercise={ex}
//                                             index={idx}
//                                             exerciseId={exerciseId}
//                                             isDone={Boolean(exState.done)}
//                                             uploading={false}
//                                             mediaPublicIds={Array.isArray(exState.mediaPublicIds) ? exState.mediaPublicIds : []}
//                                             attachmentByPublicId={attachmentByPublicId}
//                                             onToggleDone={() => toggleExerciseDone(activeDay, exerciseId)}
//                                             onUploadFiles={() => {
//                                                 toast.message(
//                                                     lang === "es"
//                                                         ? "Subidas desde rutina no disponibles en modo Trainee."
//                                                         : "Routine-based uploads are not available in Trainee mode."
//                                                 );
//                                             }}
//                                             onOpenViewer={(opt) => {
//                                                 const item = attachmentToMediaItem(opt);
//                                                 if (!item) return;
//                                                 setViewer(item);
//                                             }}
//                                             onRemoveMediaAt={(i) => removeExerciseMediaAt(activeDay, exerciseId, i)}
//                                         />
//                                     );
//                                 })}
//                             </div>
//                         </>
//                     )}
//                 </div>
//             )}

//             {viewer ? <MediaViewerModal item={viewer} onClose={() => setViewer(null)} /> : null}
//         </div>
//     );
// }
import * as React from "react";
import { toast } from "sonner";
import { addWeeks, endOfISOWeek, format, startOfISOWeek } from "date-fns";

import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";

import { useI18n } from "@/i18n/I18nProvider";

import { toWeekKey, weekKeyToStartDate } from "@/utils/weekKey";

import { useRoutineWeek } from "@/hooks/useRoutineWeek";
import { useUploadRoutineAttachments } from "@/hooks/useRoutineAttachments";

import {
    DAY_KEYS,
    type DayPlan,
    type DayKey,
    normalizePlans,
    getPlanFromMeta,
    type ExerciseItem,
} from "@/utils/routines/plan";

import { extractAttachments, toAttachmentOptions, type AttachmentOption } from "@/utils/routines/attachments";
import type { UploadQuery } from "@/types/uploadQuery";
import { getWorkoutDay } from "@/services/workout/sessions.service";

import { MediaViewerModal, type MediaLikeItem } from "@/components/media/MediaViewerModal";
import { useGymCheck } from "@/hooks/useGymCheck";
import { useSyncGymCheckDay } from "@/hooks/useSyncGymCheckDay";

import { GymCheckWeekPickerCard } from "@/components/gymCheck/GymCheckWeekPickerCard";
import { GymCheckDayTabs } from "@/components/gymCheck/GymCheckDayTabs";
import { GymCheckPlanInfo } from "@/components/gymCheck/GymCheckPlanInfo";
import { GymCheckDayQuickLog } from "@/components/gymCheck/GymCheckDayQuickLog";
import { GymCheckSessionMetrics } from "@/components/gymCheck/GymCheckSessionMetrics";
import { GymCheckExerciseCard } from "@/components/gymCheck/GymCheckExerciseCard";
import { GymCheckDeviceMetricsCard } from "@/components/gymCheck/GymCheckDeviceMetricsCard";

import {
    buildAttachmentsSet,
    diffNewAttachmentPublicIds,
    attachmentToMediaItem,
} from "@/utils/gymCheck/formatters";

import {
    dayKeyToDateIso,
    parseDurationMinutesToSeconds,
    buildAttachMediaItemsFromGymDay,
} from "@/utils/gymCheck/sessionPayload";

const DAY_LABELS: Record<(typeof DAY_KEYS)[number], { es: string; en: string }> = {
    Mon: { es: "Lun", en: "Mon" },
    Tue: { es: "Mar", en: "Tue" },
    Wed: { es: "Mié", en: "Wed" },
    Thu: { es: "Jue", en: "Thu" },
    Fri: { es: "Vie", en: "Fri" },
    Sat: { es: "Sáb", en: "Sat" },
    Sun: { es: "Dom", en: "Sun" },
};

function isRecord(v: unknown): v is Record<string, unknown> {
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
    return n === null ? null : Math.trunc(n);
}

function toStringOrUndefined(v: unknown): string | undefined {
    const s = String(v ?? "").trim();
    return s.length ? s : undefined;
}

function hasAnyMetricValue(metrics: Record<string, unknown> | null | undefined): boolean {
    if (!metrics) return false;
    for (const v of Object.values(metrics)) {
        if (String(v ?? "").trim()) return true;
    }
    return false;
}

function shouldSyncGymDay(day: any): boolean {
    if (!day) return false;

    if (String(day.durationMin ?? "").trim()) return true;
    if (String(day.notes ?? "").trim()) return true;

    const metrics = day.metrics ?? null;
    if (metrics && hasAnyMetricValue(metrics)) return true;

    const exercises = day.exercises ?? {};
    if (exercises && typeof exercises === "object") {
        for (const st of Object.values(exercises)) {
            const s: any = st as any;
            if (!s) continue;
            if (s.done === true) return true;
            if (String(s.notes ?? "").trim()) return true;
            if (String(s.durationMin ?? "").trim()) return true;
            if (Array.isArray(s.mediaPublicIds) && s.mediaPublicIds.length > 0) return true;
        }
    }

    return false;
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

export function RoutineGymCheckPage() {
    const { t, lang } = useI18n();

    const today = React.useMemo(() => new Date(), []);
    const [weekDate, setWeekDate] = React.useState(() => format(today, "yyyy-MM-dd"));

    const derivedWeekKey = React.useMemo(() => {
        const d = new Date(`${weekDate}T00:00:00`);
        return toWeekKey(d);
    }, [weekDate]);

    const [runWeekKey, setRunWeekKey] = React.useState(() => toWeekKey(today));

    const routineQuery = useRoutineWeek(runWeekKey);
    const uploadMutation = useUploadRoutineAttachments(runWeekKey);

    const routine = routineQuery.data ?? null;

    const [activeDay, setActiveDay] = React.useState<DayKey>("Mon");

    const plans: DayPlan[] = React.useMemo(() => {
        if (!routine) return normalizePlans([]);
        const meta = isRecord((routine as any)?.meta) ? (routine as any).meta : {};
        const extracted = getPlanFromMeta(meta);
        return normalizePlans(extracted);
    }, [routine]);

    const putBody = React.useMemo(() => {
        if (!routine) return null;
        return {
            title: (routine as any)?.title ?? "",
            split: (routine as any)?.split ?? "",
            plannedDays: Array.isArray((routine as any)?.plannedDays) ? (routine as any)?.plannedDays : null,
        };
    }, [routine]);

    const plannedDaysList = React.useMemo(() => {
        const list = (putBody?.plannedDays ?? []).filter((d: any) => DAY_KEYS.includes(d as DayKey)) as DayKey[];
        return list;
    }, [putBody]);

    const dayTabs: readonly DayKey[] = plannedDaysList.length > 0 ? plannedDaysList : DAY_KEYS;

    React.useEffect(() => {
        if (dayTabs.length === 0) return;
        if (!dayTabs.includes(activeDay)) setActiveDay(dayTabs[0]);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [runWeekKey, plannedDaysList.join(",")]);

    const dayTabItems = React.useMemo(() => {
        return dayTabs.map((d) => ({
            dayKey: d,
            label: lang === "es" ? DAY_LABELS[d].es : DAY_LABELS[d].en,
        }));
    }, [dayTabs, lang]);

    const activePlan = React.useMemo(() => {
        return plans.find((p) => p.dayKey === activeDay) ?? ({ dayKey: activeDay } as DayPlan);
    }, [plans, activeDay]);

    const attachments = React.useMemo(() => extractAttachments(routine), [routine]);
    const attachmentOptions: AttachmentOption[] = React.useMemo(() => toAttachmentOptions(attachments), [attachments]);

    const attachmentByPublicId = React.useMemo(() => {
        const map = new Map<string, AttachmentOption>();
        for (const a of attachmentOptions) {
            if (a.publicId) map.set(a.publicId, a);
        }
        return map;
    }, [attachmentOptions]);

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

    const {
        getDay,
        hydrateFromRemote,
        clearLocalWeek,
        toggleExerciseDone,
        setDayDuration,
        setDayNotes,
        setDayMetrics,
        addExerciseMediaPublicId,
        removeExerciseMediaAt,
        resetWeek,
    } = useGymCheck(runWeekKey);

    const hydratedSigRef = React.useRef<string>("");

    function routineSignature(r: unknown): string {
        const id = String((r as any)?.id ?? (r as any)?._id ?? "");
        const updatedAt = String((r as any)?.updatedAt ?? "");
        const metaUpdatedAt = String((r as any)?.meta?.updatedAt ?? "");
        return `${runWeekKey}|${id}|${updatedAt || metaUpdatedAt}`;
    }

    React.useEffect(() => {
        if (!routine) return;
        const sig = routineSignature(routine);
        if (hydratedSigRef.current === sig) return;
        hydratedSigRef.current = sig;
        hydrateFromRemote(routine);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [routine, runWeekKey]);

    function hasGymCheckSession(day: any): boolean {
        const sessions: any[] = Array.isArray(day?.training?.sessions) ? day.training.sessions : [];
        return sessions.some((s) => String(s?.meta?.sessionKey ?? "") === "gym_check");
    }

    const [gymCheckSessionExists, setGymCheckSessionExists] = React.useState<boolean>(false);

    React.useEffect(() => {
        let alive = true;

        async function run() {
            try {
                const date = dayKeyToDateIso(runWeekKey, activeDay);
                if (!date) return;
                if (!navigator.onLine) return;

                const day = await getWorkoutDay(date);
                if (!alive) return;
                setGymCheckSessionExists(hasGymCheckSession(day));
            } catch {
                if (!alive) return;
                setGymCheckSessionExists(false);
            }
        }

        void run();

        return () => {
            alive = false;
        };
    }, [runWeekKey, activeDay]);

    const gymDay = getDay(activeDay);

    const exercisesList = (activePlan.exercises ?? []) as ExerciseItem[];
    const hasExercises = Array.isArray(exercisesList) && exercisesList.length > 0;

    const [viewer, setViewer] = React.useState<MediaLikeItem | null>(null);
    const [uploading, setUploading] = React.useState<{ exerciseId: string } | null>(null);

    const syncGymDay = useSyncGymCheckDay(runWeekKey);

    const busy = uploadMutation.isPending || Boolean(uploading) || syncGymDay.isPending;

    const doneCount = React.useMemo(() => {
        const ex = gymDay?.exercises ?? {};
        return Object.values(ex).filter((v: any) => v?.done === true).length;
    }, [gymDay]);

    const activeDayDateIso = React.useMemo(() => {
        const d = dayKeyToDateIso(runWeekKey, activeDay);
        const start = weekKeyToStartDate(runWeekKey);
        return d ?? (start ? format(start, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"));
    }, [runWeekKey, activeDay]);

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
        setMetricsUi((prev) => {
            const next = { ...prev, ...patch };
            for (const v of Object.values(patch)) {
                if (String(v ?? "").trim()) {
                    setMetricsOpen(true);
                    break;
                }
            }
            return next;
        });
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

    async function uploadExerciseFiles(args: { dayKey: DayKey; exerciseId: string; files: File[] }) {
        if (!routine) {
            toast.error(lang === "es" ? "No hay rutina cargada para esta semana." : "No routine loaded for this week.");
            return;
        }
        if (!args.files.length) return;

        setUploading({ exerciseId: args.exerciseId });

        try {
            const before = buildAttachmentsSet(routine);

            const query: UploadQuery = {};
            await uploadMutation.mutateAsync({ files: args.files, query });

            const ref = await routineQuery.refetch();
            const nextRoutine = ref.data ?? null;
            const after = buildAttachmentsSet(nextRoutine);

            const added = diffNewAttachmentPublicIds(before, after);

            if (added.length === 0) {
                toast.error(t("routines.uploadFail"), {
                    description: "Upload succeeded but the new publicId could not be detected.",
                });
                return;
            }

            for (const publicId of added) {
                addExerciseMediaPublicId(args.dayKey, args.exerciseId, publicId);
            }

            toast.success(t("routines.uploadSuccess"));
        } catch (e: any) {
            toast.error(e?.message ?? t("routines.uploadFail"));
        } finally {
            setUploading(null);
        }
    }

    async function syncWholeWeekToDb() {
        if (!routine) return;

        commitMetricsToStore();

        if (!navigator.onLine) {
            toast.message(lang === "es" ? "Sin internet: guardado local (offline)" : "Offline: saved locally");
            return;
        }

        for (const dayKey of DAY_KEYS) {
            const day = getDay(dayKey);
            if (!shouldSyncGymDay(day)) continue;

            await syncGymDay.mutateAsync({
                routine,
                dayKey,
                gymDay: day,
            });
        }

        await routineQuery.refetch();
    }

    async function onSaveGymCheckToDb() {
        if (!routine) return;

        try {
            await syncWholeWeekToDb();

            if (navigator.onLine) {
                const ref = await routineQuery.refetch();
                const freshRoutine = ref.data ?? null;

                if (freshRoutine) {
                    clearLocalWeek(runWeekKey);
                    hydrateFromRemote(freshRoutine);
                    hydratedSigRef.current = routineSignature(freshRoutine);
                }

                toast.success(lang === "es" ? "Gym Check guardado (semana)" : "Gym Check saved (week)");
            }
        } catch (e: any) {
            toast.error(e?.message ?? (lang === "es" ? "No se pudo guardar" : "Could not save"));
        }
    }

    async function onCreateRealSession() {
        if (!routine) return;

        commitMetricsToStore();

        const date = dayKeyToDateIso(runWeekKey, activeDay);
        if (!date) {
            toast.error(lang === "es" ? "No se pudo calcular la fecha del día." : "Could not compute day date.");
            return;
        }

        // NOTE: Busy state does not include this operation; we still prevent duplicates via upsert.
        try {
            const dayAfterCommit = getDay(activeDay);

            const attachMediaItems = buildAttachMediaItemsFromGymDay({
                gymDay: dayAfterCommit,
                attachmentByPublicId,
            });

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
                    // keep as-is (this is the device/source of metrics, not the session key)
                    trainingSource: toStringOrUndefined(m.trainingSource) ?? null,
                    dayEffortRpe: toNumberOrNull(m.dayEffortRpe),
                },
            };

            const upserted = await (async () => {
                const mod = await import("@/services/workout/sessions.service");

                const needAttach = attachMediaItems.length > 0;

                const upserted = await mod.upsertGymCheckSession(date, payload, {
                    returnMode: needAttach ? "session" : "day",
                });

                if (needAttach) {
                    await mod.attachSessionMedia(date, upserted.sessionId, { items: attachMediaItems }, { returnMode: "day" });
                }

                return upserted;
            })();

            setGymCheckSessionExists(true);

            toast.success(
                upserted.mode === "patched"
                    ? (lang === "es" ? "Sesión real actualizada" : "Real session updated")
                    : (lang === "es" ? "Sesión real creada" : "Real session created")
            );

            if (navigator.onLine) {
                try {
                    await syncWholeWeekToDb();
                    const ref = await routineQuery.refetch();
                    const freshRoutine = ref.data ?? null;
                    if (freshRoutine) {
                        clearLocalWeek(runWeekKey);
                        hydrateFromRemote(freshRoutine);
                        hydratedSigRef.current = routineSignature(freshRoutine);
                    }
                } catch {
                    // ignore
                }
            }
        } catch (e: any) {
            toast.error(e?.message ?? (lang === "es" ? "No se pudo crear la sesión" : "Could not create session"));
        }
    }

    return (
        <div className="space-y-4 md:space-y-6">
            <PageHeader
                title="Gym Check"
                subtitle={
                    lang === "es"
                        ? "Checklist de rutina por día + métricas del dispositivo + media por ejercicio"
                        : "Daily routine checklist + device metrics + per-exercise media"
                }
                right={
                    <GymCheckSessionMetrics
                        t={t}
                        lang={lang}
                        busy={busy}
                        routineExists={Boolean(routine)}
                        doneCount={doneCount}
                        gymCheckSessionExists={gymCheckSessionExists}
                        onSyncToLoadedWeek={syncToLoadedWeek}
                        onSaveGymCheckToDb={onSaveGymCheckToDb}
                        onCreateRealSession={onCreateRealSession}
                        onResetWeek={resetWeek}
                    />
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
                routineTitle={(routine as any)?.title ?? null}
                routineSplit={(routine as any)?.split ?? null}
                routineExists={Boolean(routine)}
            />

            {!routine && !routineQuery.isFetching ? (
                <EmptyState title={t("routines.noRoutineTitle")} description={t("routines.noRoutineDesc")} />
            ) : null}

            {routine ? (
                <div className="space-y-4">
                    <GymCheckDayTabs items={dayTabItems} activeDay={activeDay} onSelectDay={setActiveDay} />

                    {!hasExercises ? (
                        <EmptyState
                            title={lang === "es" ? "Sin ejercicios" : "No exercises"}
                            description={lang === "es" ? "Este día no tiene ejercicios planeados." : "This day has no planned exercises."}
                        />
                    ) : (
                        <>
                            <div className="grid gap-4 md:grid-cols-2">
                                <GymCheckPlanInfo lang={lang} activeDay={activeDay} dayLabels={DAY_LABELS} activePlan={activePlan} />

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
                                            uploading={uploading?.exerciseId === exerciseId}
                                            mediaPublicIds={Array.isArray(exState.mediaPublicIds) ? exState.mediaPublicIds : []}
                                            attachmentByPublicId={attachmentByPublicId}
                                            onToggleDone={() => toggleExerciseDone(activeDay, exerciseId)}
                                            onUploadFiles={(files) => void uploadExerciseFiles({ dayKey: activeDay, exerciseId, files })}
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
            ) : null}

            {viewer ? <MediaViewerModal item={viewer} onClose={() => setViewer(null)} /> : null}
        </div>
    );
}

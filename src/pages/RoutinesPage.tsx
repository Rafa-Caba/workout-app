import React from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";

import { toWeekKey, weekKeyToStartDate } from "@/utils/weekKey";
import { startOfISOWeek, endOfISOWeek, addWeeks, format } from "date-fns";

import { useInitRoutineWeek, useRoutineWeek, useSetRoutineArchived, useUpdateRoutineWeek } from "@/hooks/useRoutineWeek";
import { useDeleteRoutineAttachment, useUploadRoutineAttachments } from "@/hooks/useRoutineAttachments";

import { toRoutineUpsertBody } from "@/services/workout/routines.service";
import type { ApiError } from "@/api/httpErrors";

import { useI18n } from "@/i18n/I18nProvider";
import type { I18nKey } from "@/i18n/translations";

import {
    DAY_KEYS,
    type DayPlan,
    type ExerciseItem,
    normalizePlans,
    getPlanFromMeta,
    setPlanIntoMeta,
    type DayKey,
} from "@/utils/routines/plan";

import { extractAttachments, toAttachmentOptions, type AttachmentOption } from "@/utils/routines/attachments";

import { normalizePutBodyForApi, type RoutineUpsertBody } from "@/utils/routines/putBody";

import { saveRoutineWeekWithPlanFallback } from "@/utils/routines/saveRoutineWeek";
import { safeParseJson, safeStringify } from "@/utils/routines/json";

import { PlanVsActualPanel } from "@/components/pva/PlanVsActualPanel";

import { RoutineAttachmentsSection } from "@/components/routines/RoutineAttachmentsSection";
import { RoutinesModeToggle } from "@/components/routines/RoutinesModeToggle";
import { RoutinesWeekPickerCard } from "@/components/routines/RoutinesWeekPickerCard";
import { RoutinesPutForm } from "@/components/routines/RoutinesPutForm";
import { RoutinesJsonEditor } from "@/components/routines/RoutinesJsonEditor";

import type { UploadQuery } from "@/types/uploadQuery";

function toastApiError(e: unknown, fallback: string) {
    const err = e as Partial<ApiError> | undefined;
    const msg = err?.message ?? fallback;
    const details = err?.details ? JSON.stringify(err.details, null, 2) : undefined;
    toast.error(msg, { description: details });
}

const DAY_LABELS: Record<(typeof DAY_KEYS)[number], { es: string; en: string }> = {
    Mon: { es: "Lun", en: "Mon" },
    Tue: { es: "Mar", en: "Tue" },
    Wed: { es: "Mié", en: "Wed" },
    Thu: { es: "Jue", en: "Thu" },
    Fri: { es: "Vie", en: "Fri" },
    Sat: { es: "Sáb", en: "Sat" },
    Sun: { es: "Dom", en: "Sun" },
};

const SPLIT_PRESETS: Array<{ value: string; labelKey: I18nKey }> = [
    { value: "", labelKey: "routines.split.none" },
    { value: "push", labelKey: "routines.split.push" },
    { value: "pull", labelKey: "routines.split.pull" },
    { value: "legs", labelKey: "routines.split.legs" },
    { value: "upper/lower", labelKey: "routines.split.upperLower" },
    { value: "ppl", labelKey: "routines.split.ppl" },
];

function isRecord(v: unknown): v is Record<string, unknown> {
    return typeof v === "object" && v !== null && !Array.isArray(v);
}

function buildAttachmentsSet(routine: unknown): Set<string> {
    const list = extractAttachments(routine as any);
    const s = new Set<string>();
    for (const a of list) {
        if (a && typeof a.publicId === "string" && a.publicId.trim()) s.add(a.publicId.trim());
    }
    return s;
}

function diffNewAttachmentPublicIds(before: Set<string>, after: Set<string>): string[] {
    const added: string[] = [];
    for (const id of after) {
        if (!before.has(id)) added.push(id);
    }
    return added;
}

function makeId(): string {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g: any = globalThis as any;
    if (g?.crypto?.randomUUID) return g.crypto.randomUUID();
    return `ex_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function ensureExerciseIds(input: DayPlan[]): DayPlan[] {
    return input.map((p) => ({
        ...p,
        exercises: p.exercises?.map((e) => ({
            ...e,
            id: e.id || makeId(),
            attachmentPublicIds: Array.isArray((e as any).attachmentPublicIds) ? (e as any).attachmentPublicIds : [],
        })),
    }));
}

function attachPublicIdToExercise(plans: DayPlan[], args: { dayKey: DayKey; exerciseId: string; publicId: string }): DayPlan[] {
    const { dayKey, exerciseId, publicId } = args;

    return plans.map((p) => {
        if (p.dayKey !== dayKey) return p;

        const ex = p.exercises ?? [];
        const nextExercises = ex.map((row) => {
            if (row.id !== exerciseId) return row;

            const current = Array.isArray(row.attachmentPublicIds) ? row.attachmentPublicIds : [];
            const nextIds = current.includes(publicId) ? current : [...current, publicId];

            return { ...row, attachmentPublicIds: nextIds };
        });

        return { ...p, exercises: nextExercises };
    });
}

export function RoutinesPage() {
    const { t, lang } = useI18n();

    const today = React.useMemo(() => new Date(), []);
    const [weekDate, setWeekDate] = React.useState(() => format(today, "yyyy-MM-dd"));

    const derivedWeekKey = React.useMemo(() => {
        const d = new Date(`${weekDate}T00:00:00`);
        return toWeekKey(d);
    }, [weekDate]);

    const [runWeekKey, setRunWeekKey] = React.useState(() => toWeekKey(today));

    const routineQuery = useRoutineWeek(runWeekKey);
    const initMutation = useInitRoutineWeek(runWeekKey);
    const updateMutation = useUpdateRoutineWeek(runWeekKey);
    const archiveMutation = useSetRoutineArchived(runWeekKey);

    const uploadMutation = useUploadRoutineAttachments(runWeekKey);
    const deleteMutation = useDeleteRoutineAttachment(runWeekKey);

    const routine = routineQuery.data ?? null;

    // ✅ refs to avoid stale state during async save/upload flows
    const routineRef = React.useRef<any>(routine);
    React.useEffect(() => {
        routineRef.current = routine;
    }, [routine]);

    // Init controls
    const [initTitle, setInitTitle] = React.useState("");
    const [initSplit, setInitSplit] = React.useState("");
    const [unarchive, setUnarchive] = React.useState(true);

    // Editor modes
    const [mode, setMode] = React.useState<"form" | "json">("form");

    // PUT body (form mode)
    const [putBody, setPutBody] = React.useState<RoutineUpsertBody>({
        title: "",
        split: "",
        plannedDays: null,
        meta: null,
    });

    // Split UI (preset + custom)
    const [splitPreset, setSplitPreset] = React.useState<string>("");
    const [splitCustom, setSplitCustom] = React.useState<string>("");

    // JSON editor (JSON mode)
    const [editor, setEditor] = React.useState<string>("");
    const [metaEditor, setMetaEditor] = React.useState<string>("{}");

    // Day plans
    const [plans, setPlans] = React.useState<DayPlan[]>(() => normalizePlans([]));
    const plansRef = React.useRef<DayPlan[]>(plans);
    React.useEffect(() => {
        plansRef.current = plans;
    }, [plans]);

    const [activeDay, setActiveDay] = React.useState<(typeof DAY_KEYS)[number]>("Mon");

    // Attachments
    const attachments = React.useMemo(() => extractAttachments(routine), [routine]);
    const attachmentOptions: AttachmentOption[] = React.useMemo(() => toAttachmentOptions(attachments), [attachments]);

    /**
     * =========================================================
     * ✅ Pending local files per exercise (exerciseId-based)
     * pendingExerciseFiles[dayKey][exerciseId] = File[]
     * =========================================================
     */
    const [pendingExerciseFiles, setPendingExerciseFiles] = React.useState<Record<DayKey, Record<string, File[]> | undefined>>({
        Mon: undefined,
        Tue: undefined,
        Wed: undefined,
        Thu: undefined,
        Fri: undefined,
        Sat: undefined,
        Sun: undefined,
    });

    // Upload status while saving
    const [uploadingExercise, setUploadingExercise] = React.useState<{ dayKey: DayKey; exerciseId: string } | null>(null);
    const [exerciseUploadBusy, setExerciseUploadBusy] = React.useState(false);

    const getPendingExerciseFilesFor = React.useCallback(
        (exerciseId: string): File[] => {
            const dayMap = pendingExerciseFiles[activeDay as DayKey];
            return dayMap?.[exerciseId] ?? [];
        },
        [pendingExerciseFiles, activeDay]
    );

    const addPendingExerciseFiles = React.useCallback(
        (exerciseId: string, files: File[]) => {
            if (!files.length) return;
            const dayKey = activeDay as DayKey;

            setPendingExerciseFiles((prev) => {
                const dayMap = prev[dayKey] ?? {};
                const existing = dayMap[exerciseId] ?? [];
                return {
                    ...prev,
                    [dayKey]: {
                        ...dayMap,
                        [exerciseId]: [...existing, ...files],
                    },
                };
            });
        },
        [activeDay]
    );

    const clearPendingExerciseFiles = React.useCallback(
        (exerciseId: string, fileIndex?: number) => {
            const dayKey = activeDay as DayKey;

            setPendingExerciseFiles((prev) => {
                const dayMap = prev[dayKey];
                if (!dayMap) return prev;

                const files = dayMap[exerciseId] ?? [];
                if (!files.length) return prev;

                let nextFiles: File[] = [];
                if (typeof fileIndex === "number") {
                    nextFiles = files.filter((_, i) => i !== fileIndex);
                }

                const nextDayMap: Record<string, File[]> = { ...dayMap };
                if (typeof fileIndex !== "number") {
                    delete nextDayMap[exerciseId];
                } else if (nextFiles.length === 0) {
                    delete nextDayMap[exerciseId];
                } else {
                    nextDayMap[exerciseId] = nextFiles;
                }

                return { ...prev, [dayKey]: Object.keys(nextDayMap).length ? nextDayMap : undefined };
            });
        },
        [activeDay]
    );

    // Hydrate from backend routine -> local state
    React.useEffect(() => {
        if (!routine) return;

        const body = toRoutineUpsertBody(routine);

        const title = typeof body.title === "string" ? body.title : "";
        const split = typeof body.split === "string" ? body.split : "";

        setPutBody({
            title,
            split,
            plannedDays: Array.isArray(body.plannedDays) ? body.plannedDays : null,
            meta: isRecord(body.meta) ? body.meta : null,
        });

        const presetMatch = SPLIT_PRESETS.some((p) => p.value && p.value.toLowerCase() === split.toLowerCase()) ? split : "";
        setSplitPreset(presetMatch);
        setSplitCustom(presetMatch ? "" : split);

        setEditor(
            safeStringify({
                title: body.title ?? null,
                split: body.split ?? null,
                plannedDays: body.plannedDays ?? null,
                meta: body.meta ?? null,
            })
        );

        const extracted = getPlanFromMeta(routine?.meta ?? {});
        const normalized = ensureExerciseIds(normalizePlans(extracted));
        setPlans(normalized);
        plansRef.current = normalized;

        setMetaEditor(safeStringify(isRecord(routine?.meta) ? routine.meta : {}));

        const planned = Array.isArray(body.plannedDays) ? body.plannedDays : null;
        if (planned && planned.length > 0 && !planned.includes(activeDay)) {
            const first = planned.find((d) => DAY_KEYS.includes(d as DayKey)) as DayKey | undefined;
            if (first) setActiveDay(first);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [routine]);

    // Auto-sync plans into putBody.meta.plan
    const lastPlanHashRef = React.useRef<string>("");
    React.useEffect(() => {
        const hash = safeStringify(plans);
        if (hash === lastPlanHashRef.current) return;
        lastPlanHashRef.current = hash;

        setPutBody((prev) => {
            const baseMeta = isRecord(prev.meta) ? prev.meta : null;
            const nextMeta = setPlanIntoMeta(baseMeta, plans);
            return { ...prev, meta: nextMeta };
        });
    }, [plans]);

    // Keep editor in sync in form mode
    React.useEffect(() => {
        if (mode !== "form") return;
        setEditor(
            safeStringify({
                title: putBody.title ?? null,
                split: putBody.split ?? null,
                plannedDays: putBody.plannedDays ?? null,
                meta: putBody.meta ?? null,
            })
        );
    }, [putBody, mode]);

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
        toast.message(`${t("routines.weekSelected")}: ${derivedWeekKey}`);
    }

    async function initRoutine() {
        try {
            await initMutation.mutateAsync({
                title: initTitle.trim() || undefined,
                split: initSplit.trim() || undefined,
                unarchive,
            });
            toast.success(t("routines.initSuccess"));
        } catch (e) {
            toastApiError(e, t("routines.initFail"));
        }
    }

    function computeSplitValue(preset: string, custom: string) {
        const p = (preset ?? "").trim();
        if (p) return p;
        return (custom ?? "").trim();
    }

    function onChangeSplitPreset(next: string) {
        setSplitPreset(next);
        setSplitCustom(next ? "" : splitCustom);
        const nextSplit = computeSplitValue(next, next ? "" : splitCustom);
        setPutBody((p) => ({ ...p, split: nextSplit }));
    }

    function onChangeSplitCustom(next: string) {
        setSplitCustom(next);
        if (next.trim()) setSplitPreset("");
        const nextSplit = computeSplitValue("", next);
        setPutBody((p) => ({ ...p, split: nextSplit }));
    }

    // Plan editing helpers
    function togglePlannedDay(dayKey: string) {
        setPutBody((prev) => {
            const current = prev.plannedDays ?? [];
            const exists = current.includes(dayKey);
            const next = exists ? current.filter((d) => d !== dayKey) : [...current, dayKey];
            return { ...prev, plannedDays: next.length ? next : null };
        });
    }

    function updatePlan(dayKey: DayKey, patch: Partial<DayPlan>) {
        setPlans((prev) => prev.map((p) => (p.dayKey === dayKey ? { ...p, ...patch } : p)));
    }

    function addExercise(dayKey: DayKey) {
        setPlans((prev) =>
            prev.map((p) => {
                if (p.dayKey !== dayKey) return p;
                const next = [...(p.exercises ?? []), { id: makeId(), name: "", attachmentPublicIds: [] } as ExerciseItem];
                return { ...p, exercises: next };
            })
        );
    }

    function removeExercise(dayKey: DayKey, idx: number) {
        const exerciseIdToRemove = plansRef.current.find((p) => p.dayKey === dayKey)?.exercises?.[idx]?.id ?? null;

        setPlans((prev) =>
            prev.map((p) => {
                if (p.dayKey !== dayKey) return p;
                const next = (p.exercises ?? []).filter((_, i) => i !== idx);
                return { ...p, exercises: next.length ? next : undefined };
            })
        );

        if (exerciseIdToRemove) {
            setPendingExerciseFiles((prev) => {
                const dayMap = prev[dayKey];
                if (!dayMap) return prev;
                if (!(exerciseIdToRemove in dayMap)) return prev;

                const nextDayMap: Record<string, File[]> = { ...dayMap };
                delete nextDayMap[exerciseIdToRemove];

                return { ...prev, [dayKey]: Object.keys(nextDayMap).length ? nextDayMap : undefined };
            });
        }
    }

    function updateExercise(dayKey: DayKey, idx: number, patch: Partial<ExerciseItem>) {
        setPlans((prev) =>
            prev.map((p) => {
                if (p.dayKey !== dayKey) return p;
                const ex = p.exercises ?? [];
                const next = ex.map((e, i) => (i === idx ? { ...e, ...patch } : e));
                return { ...p, exercises: next };
            })
        );
    }

    /**
     * ✅ IMPORTANT FIX:
     * This returns the UPDATED plans (no stale state).
     * Save uses the returned plans, not the old `plans`.
     */
    async function uploadPendingExerciseFilesIfAny(): Promise<DayPlan[]> {
        const baseRoutine = routineRef.current ?? routineQuery.data ?? null;
        if (!baseRoutine) return plansRef.current;

        const pending: Array<{ dayKey: DayKey; exerciseId: string; file: File }> = [];
        (DAY_KEYS as readonly DayKey[]).forEach((dayKey) => {
            const map = pendingExerciseFiles[dayKey];
            if (!map) return;
            for (const exerciseId of Object.keys(map)) {
                const files = map[exerciseId] ?? [];
                for (const f of files) pending.push({ dayKey, exerciseId, file: f });
            }
        });

        if (pending.length === 0) return plansRef.current;

        setExerciseUploadBusy(true);

        let nextPlans = plansRef.current;

        try {
            for (const item of pending) {
                setUploadingExercise({ dayKey: item.dayKey, exerciseId: item.exerciseId });

                // Always diff against the latest routine snapshot
                const before = buildAttachmentsSet(routineRef.current ?? routineQuery.data ?? baseRoutine);

                await uploadMutation.mutateAsync({ files: [item.file], query: {} });

                const ref = await routineQuery.refetch();
                const nextRoutine = ref.data ?? null;

                // Keep ref fresh so next iterations diff correctly
                routineRef.current = nextRoutine;

                const after = buildAttachmentsSet(nextRoutine);

                const added = diffNewAttachmentPublicIds(before, after);
                const newId = added.length > 0 ? added[0] : null;

                if (!newId) {
                    toast.error(t("routines.uploadFail"), {
                        description: "Upload succeeded but could not detect the new attachment publicId.",
                    });
                } else {
                    nextPlans = attachPublicIdToExercise(nextPlans, {
                        dayKey: item.dayKey,
                        exerciseId: item.exerciseId,
                        publicId: newId,
                    });

                    setPlans(nextPlans);
                    plansRef.current = nextPlans;
                }

                // Remove this file from pending (by identity) under exerciseId
                setPendingExerciseFiles((prev) => {
                    const dayMap = prev[item.dayKey];
                    if (!dayMap) return prev;

                    const files = dayMap[item.exerciseId] ?? [];
                    const nextFiles = files.filter((f) => f !== item.file);

                    const nextDayMap: Record<string, File[]> = { ...dayMap };
                    if (nextFiles.length === 0) delete nextDayMap[item.exerciseId];
                    else nextDayMap[item.exerciseId] = nextFiles;

                    return { ...prev, [item.dayKey]: Object.keys(nextDayMap).length ? nextDayMap : undefined };
                });
            }

            return nextPlans;
        } finally {
            setUploadingExercise(null);
            setExerciseUploadBusy(false);
        }
    }

    async function saveRoutine() {
        try {
            if (mode === "form") {
                const updatedPlans = await uploadPendingExerciseFilesIfAny();

                /**
                 * ✅ CORE FIX:
                 * Build meta.plan from updatedPlans right now (do NOT rely on useEffect timing).
                 */
                const baseMeta = isRecord(putBody.meta) ? putBody.meta : null;
                const nextMeta = setPlanIntoMeta(baseMeta, updatedPlans);

                const bodyWithUpdatedMeta: RoutineUpsertBody = {
                    ...putBody,
                    meta: nextMeta,
                };

                // Keep local state aligned (optional but nice)
                setPutBody(bodyWithUpdatedMeta);

                const apiBody = normalizePutBodyForApi(bodyWithUpdatedMeta);

                await saveRoutineWeekWithPlanFallback({
                    weekKey: runWeekKey,
                    baseBody: apiBody,
                    plans: updatedPlans,
                    mutateAsync: updateMutation.mutateAsync,
                });

                toast.success(t("routines.saveSuccess"));
                await routineQuery.refetch();
                return;
            }

            const parsed = safeParseJson(editor);
            if (!parsed.ok) {
                toast.error(t("routines.jsonInvalid"), { description: parsed.error });
                return;
            }

            await updateMutation.mutateAsync(parsed.value);
            toast.success(t("routines.saveSuccess"));
            await routineQuery.refetch();
        } catch (e) {
            toastApiError(e, t("routines.saveFail"));
        }
    }

    async function setArchived(archived: boolean) {
        try {
            await archiveMutation.mutateAsync({ archived });
            toast.success(archived ? t("routines.archived") : t("routines.unarchived"));
        } catch (e) {
            toastApiError(e, t("routines.archiveFail"));
        }
    }

    const busy =
        initMutation.isPending ||
        updateMutation.isPending ||
        archiveMutation.isPending ||
        uploadMutation.isPending ||
        deleteMutation.isPending ||
        routineQuery.isFetching ||
        exerciseUploadBusy;

    const plannedDaysList = (putBody.plannedDays ?? []).filter((d) => DAY_KEYS.includes(d as DayKey)) as DayKey[];
    const dayTabs = plannedDaysList.length > 0 ? plannedDaysList : DAY_KEYS;

    const activePlan = plans.find((p) => p.dayKey === activeDay) ?? ({ dayKey: activeDay } as DayPlan);

    const ph = React.useMemo(() => {
        if (lang === "es") {
            return {
                sessionType: "Ej. Pull Power",
                focus: "Ej. Espalda + bíceps",
                tags: "power, hypertrophy",
                notes: "Notas del día…",
                exNotes: "Opcional…",
                sets: "3",
                reps: "8-10",
                load: "100kg / RPE 8",
            };
        }
        return {
            sessionType: "e.g. Pull Power",
            focus: "e.g. Back + biceps",
            tags: "power, hypertrophy",
            notes: "Day notes…",
            exNotes: "Optional…",
            sets: "3",
            reps: "8-10",
            load: "100kg / RPE 8",
        };
    }, [lang]);

    async function uploadWeekAttachments(args: { files: File[]; query: UploadQuery }) {
        await uploadMutation.mutateAsync({ files: args.files, query: args.query });
        await routineQuery.refetch();
    }

    async function deleteWeekAttachment(args: { publicId: string; deleteCloudinary: boolean }) {
        await deleteMutation.mutateAsync({ publicId: args.publicId, deleteCloudinary: args.deleteCloudinary });
        await routineQuery.refetch();
    }

    const initOpenDefault = !routine && !routineQuery.isFetching;

    const dayTabItems = React.useMemo(() => {
        return dayTabs.map((d) => {
            const label = lang === "es" ? DAY_LABELS[d].es : DAY_LABELS[d].en;
            return { dayKey: d, label };
        });
    }, [dayTabs, lang]);

    const debugPutBodyData = React.useMemo(() => {
        const parsed = safeParseJson(editor);
        return parsed.ok ? parsed.value : editor;
    }, [editor]);

    function onApplyMetaFromMetaEditor() {
        const metaParsed = safeParseJson(metaEditor);
        if (!metaParsed.ok) {
            toast.error(t("routines.metaInvalid"), { description: metaParsed.error });
            return;
        }
        if (metaParsed.value && typeof metaParsed.value !== "object") {
            toast.error(t("routines.metaMustBeObject"));
            return;
        }

        const objParsed = safeParseJson(editor);
        if (!objParsed.ok || !objParsed.value || typeof objParsed.value !== "object") {
            toast.error(t("routines.jsonInvalid"), {
                description: objParsed.ok ? "Invalid JSON object" : objParsed.error,
            });
            return;
        }

        const nextObj = { ...(objParsed.value as Record<string, unknown>) };
        nextObj.meta = metaParsed.value as Record<string, unknown>;

        const extractedPlans = getPlanFromMeta(nextObj.meta);
        const normalized = ensureExerciseIds(normalizePlans(extractedPlans));
        setPlans(normalized);
        plansRef.current = normalized;

        setEditor(safeStringify(nextObj));
        toast.success(t("routines.metaApplied"));
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title={t("routines.title")}
                subtitle={t("routines.subtitle")}
                right={<RoutinesModeToggle mode={mode} busy={busy} t={t} onModeChange={setMode} />}
            />

            <RoutinesWeekPickerCard
                t={t}
                lang={lang}
                busy={busy}
                weekDate={weekDate}
                onWeekDateChange={setWeekDate}
                onPrevWeek={goPrevWeek}
                onNextWeek={goNextWeek}
                onLoadWeek={loadWeek}
                derivedWeekKey={derivedWeekKey}
                weekRangeLabel={weekRangeLabel}
                runWeekKey={runWeekKey}
                onSyncToLoadedWeek={syncToLoadedWeek}
                initOpenDefault={initOpenDefault}
                initTitle={initTitle}
                setInitTitle={setInitTitle}
                initSplit={initSplit}
                setInitSplit={setInitSplit}
                unarchive={unarchive}
                setUnarchive={setUnarchive}
                onInitRoutine={initRoutine}
                isInitializing={initMutation.isPending}
                onSetArchived={setArchived}
            />

            {!routine && !routineQuery.isFetching ? (
                <EmptyState title={t("routines.noRoutineTitle")} description={t("routines.noRoutineDesc")} />
            ) : null}

            {routine && mode === "form" ? (
                <>
                    <RoutinesPutForm
                        t={t}
                        lang={lang}
                        busy={busy}
                        isSaving={updateMutation.isPending}
                        onSave={saveRoutine}
                        putBody={putBody}
                        onChangeTitle={(next) => setPutBody((p) => ({ ...p, title: next }))}
                        splitPreset={splitPreset}
                        splitCustom={splitCustom}
                        splitPresets={SPLIT_PRESETS}
                        onChangeSplitPreset={onChangeSplitPreset}
                        onChangeSplitCustom={onChangeSplitCustom}
                        dayKeys={DAY_KEYS}
                        onTogglePlannedDay={togglePlannedDay}
                        planBuilderTitle={t("routines.planBuilderTitle")}
                        planBuilderHint={t("routines.planBuilderHint")}
                        dayTabItems={dayTabItems}
                        activeDay={activeDay as DayKey}
                        onSelectDay={(d) => setActiveDay(d)}
                        activePlan={activePlan}
                        attachmentOptions={attachmentOptions}
                        exerciseUploadBusy={exerciseUploadBusy}
                        uploadingExercise={uploadingExercise}
                        getPendingExerciseFiles={getPendingExerciseFilesFor}
                        onAddPendingExerciseFiles={addPendingExerciseFiles}
                        onClearPendingExerciseFiles={clearPendingExerciseFiles}
                        onAddExercise={addExercise}
                        onRemoveExercise={removeExercise}
                        onUpdatePlan={updatePlan}
                        onUpdateExercise={updateExercise}
                        ph={ph}
                        debugPutBodyTitle={t("routines.debugPutBody")}
                        debugPutBodyData={debugPutBodyData}
                        debugPlansTitle={lang === "es" ? "Debug: planes (estado local)" : "Debug: plans (local state)"}
                        plans={plans}
                    />

                    <PlanVsActualPanel weekKey={runWeekKey} />
                </>
            ) : null}

            {routine && mode === "json" ? (
                <>
                    <RoutinesJsonEditor
                        t={t}
                        lang={lang}
                        busy={busy}
                        editor={editor}
                        onEditorChange={setEditor}
                        metaEditor={metaEditor}
                        onMetaEditorChange={setMetaEditor}
                        onApplyMeta={onApplyMetaFromMetaEditor}
                        onSave={saveRoutine}
                        isSaving={updateMutation.isPending}
                        routine={routine}
                    />

                    <PlanVsActualPanel weekKey={runWeekKey} />
                </>
            ) : null}

            <RoutineAttachmentsSection
                t={t}
                lang={lang}
                busy={busy}
                showUploadQuery={mode === "json"}
                attachments={attachments}
                onUpload={uploadWeekAttachments}
                onDelete={deleteWeekAttachment}
            />
        </div>
    );
}

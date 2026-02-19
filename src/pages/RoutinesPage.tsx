import React from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { cn } from "@/lib/utils";

import { toWeekKey, weekKeyToStartDate } from "@/utils/weekKey";
import { startOfISOWeek, endOfISOWeek, addWeeks, format, parseISO, isValid } from "date-fns";

import {
    useInitRoutineWeek,
    useRoutineWeek,
    useRoutineWeeksList,
    useSetRoutineArchived,
    useUpdateRoutineWeek,
} from "@/hooks/useRoutineWeek";
import { useDeleteRoutineAttachment, useUploadRoutineAttachments } from "@/hooks/useRoutineAttachments";

import { toRoutineUpsertBody, toStatusLabel } from "@/services/workout/routines.service";
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
import type { WorkoutRoutineWeek, WorkoutRoutineDay, WorkoutRoutineStatus } from "@/types/workoutRoutine.types";
import { useMovements } from "@/hooks/useMovements";

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

function attachPublicIdToExercise(
    plans: DayPlan[],
    args: { dayKey: DayKey; exerciseId: string; publicId: string }
): DayPlan[] {
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

function routineDaysToPlans(days: WorkoutRoutineDay[] | null | undefined): DayPlan[] {
    const list = Array.isArray(days) ? days : [];
    const mapped: DayPlan[] = list
        .filter((d) => d && DAY_KEYS.includes(d.dayKey as DayKey))
        .map((d) => {
            const dayKey = d.dayKey as DayKey;
            const exercises: ExerciseItem[] | undefined = Array.isArray(d.exercises)
                ? d.exercises.map((e) => ({
                    id: String(e.id || makeId()),
                    name: String(e.name ?? ""),
                    sets: e.sets == null ? undefined : String(e.sets),
                    reps: e.reps == null ? undefined : String(e.reps),
                    rpe: e.rpe == null ? undefined : String(e.rpe),
                    load: e.load ?? undefined,
                    notes: e.notes ?? undefined,
                    attachmentPublicIds: Array.isArray(e.attachmentPublicIds) ? e.attachmentPublicIds : [],
                }))
                : undefined;

            return {
                dayKey,
                sessionType: d.sessionType ?? undefined,
                focus: d.focus ?? undefined,
                tags: Array.isArray(d.tags) ? d.tags : undefined,
                notes: d.notes ?? undefined,
                exercises,
            };
        });

    return normalizePlans(ensureExerciseIds(mapped));
}

function buildWeekRangeLabel(args: { weekDate: string; routine: WorkoutRoutineWeek | null }): string {
    const { weekDate, routine } = args;

    const from = routine?.range?.from ?? "";
    const to = routine?.range?.to ?? "";

    if (from && to) {
        const df = parseISO(from);
        const dt = parseISO(to);
        if (isValid(df) && isValid(dt)) {
            return `${format(df, "MMM d, yyyy")} → ${format(dt, "MMM d, yyyy")}`;
        }
    }

    const d = new Date(`${weekDate}T00:00:00`);
    const start = startOfISOWeek(d);
    const end = endOfISOWeek(d);
    return `${format(start, "MMM d, yyyy")} → ${format(end, "MMM d, yyyy")}`;
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

    const routine = (routineQuery.data ?? null) as WorkoutRoutineWeek | null;

    const scrollRootRef = React.useRef<HTMLDivElement | null>(null);
    const [scrollRootEl, setScrollRootEl] = React.useState<HTMLElement | null>(null);

    React.useLayoutEffect(() => {
        if (scrollRootRef.current) setScrollRootEl(scrollRootRef.current);
    }, []);

    // refs to avoid stale state during async save/upload flows
    const routineRef = React.useRef<WorkoutRoutineWeek | null>(routine);
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

    // Day plans (UI helper)
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
     * Pending local files per exercise
     */
    const [pendingExerciseFiles, setPendingExerciseFiles] = React.useState<
        Record<DayKey, Record<string, File[]> | undefined>
    >({
        Mon: undefined,
        Tue: undefined,
        Wed: undefined,
        Thu: undefined,
        Fri: undefined,
        Sat: undefined,
        Sun: undefined,
    });

    const [uploadingExercise, setUploadingExercise] = React.useState<{ dayKey: DayKey; exerciseId: string } | null>(
        null
    );
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

        const presetMatch = SPLIT_PRESETS.some((p) => p.value && p.value.toLowerCase() === split.toLowerCase())
            ? split
            : "";
        setSplitPreset(presetMatch);
        setSplitCustom(presetMatch ? "" : split);

        setEditor(
            safeStringify({
                title: body.title ?? null,
                split: body.split ?? null,
                plannedDays: body.plannedDays ?? null,
                meta: body.meta ?? null,
                // show canonical too (debug-friendly)
                status: routine.status ?? null,
                range: routine.range ?? null,
                days: routine.days ?? null,
                attachments: routine.attachments ?? null,
            })
        );

        // CANONICAL SOURCE: routine.days (always preferred)
        const canonicalPlans = routineDaysToPlans(routine.days);

        // Fallback only if days are missing/invalid (legacy or corrupted payload)
        const fallbackPlans = ensureExerciseIds(normalizePlans(getPlanFromMeta(routine?.meta ?? {})));
        const hasCanonicalDays = Array.isArray(routine.days) && routine.days.length > 0;

        const chosenPlans = hasCanonicalDays ? canonicalPlans : fallbackPlans;

        setPlans(chosenPlans);
        plansRef.current = chosenPlans;

        setMetaEditor(safeStringify(isRecord(routine?.meta) ? routine.meta : {}));

        const planned = Array.isArray(body.plannedDays) ? body.plannedDays : null;
        if (planned && planned.length > 0 && !planned.includes(activeDay)) {
            const first = planned.find((d) => DAY_KEYS.includes(d as DayKey)) as DayKey | undefined;
            if (first) setActiveDay(first);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [routine]);

    // Auto-sync plans into putBody.meta.plan (UI helper only)
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

    // Tabs filter list
    const [statusFilter, setStatusFilter] = React.useState<WorkoutRoutineStatus>("active");
    const listQuery = useRoutineWeeksList(statusFilter);
    const weeksList = listQuery.data ?? [];

    React.useEffect(() => {
        if (weeksList.length === 0) return;

        setRunWeekKey((prev) => {
            const exists = weeksList.some((w) => w.weekKey === prev);
            if (exists) return prev;

            const first = weeksList[0].weekKey;
            const start = weekKeyToStartDate(first);
            if (start) setWeekDate(format(start, "yyyy-MM-dd"));
            return first;
        });
    }, [weeksList, setWeekDate]);

    const movementsQuery = useMovements();
    const movementOptions = React.useMemo(
        () => (movementsQuery.data ?? []).map((m: any) => ({ id: m.id, name: m.name })),
        [movementsQuery.data]
    );

    const weekRangeLabel = React.useMemo(() => buildWeekRangeLabel({ weekDate, routine }), [weekDate, routine]);

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
            const exists = current.includes(dayKey as any);
            const next = exists ? current.filter((d) => d !== (dayKey as any)) : [...current, dayKey as any];
            return { ...prev, plannedDays: next.length ? (next as any) : null };
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

    async function uploadPendingExerciseFilesIfAny(): Promise<DayPlan[]> {
        const baseRoutine = routineRef.current ?? (routineQuery.data as any) ?? null;
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

                const before = buildAttachmentsSet(routineRef.current ?? (routineQuery.data as any) ?? baseRoutine);

                await uploadMutation.mutateAsync({ files: [item.file], query: {} });

                const ref = await routineQuery.refetch();
                const nextRoutine = (ref.data ?? null) as WorkoutRoutineWeek | null;

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

                const baseMeta = isRecord(putBody.meta) ? putBody.meta : null;
                const nextMeta = setPlanIntoMeta(baseMeta, updatedPlans);

                const bodyWithUpdatedMeta: RoutineUpsertBody = {
                    ...putBody,
                    meta: nextMeta,
                };

                setPutBody(bodyWithUpdatedMeta);

                const apiBody = normalizePutBodyForApi(bodyWithUpdatedMeta);

                // ✅ IMPORTANT: Persist CANONICAL days[] always
                await saveRoutineWeekWithPlanFallback({
                    weekKey: runWeekKey,
                    baseBody: apiBody,
                    plans: updatedPlans,
                    mutateAsync: updateMutation.mutateAsync as any,
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
                load: "100kg / barra",
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
            load: "100kg / bar",
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

    const status = routine?.status ?? "active";

    // Gating and UI helpers
    const listEmpty = !listQuery.isFetching && weeksList.length === 0;

    const showEditorArea =
        statusFilter === "active"
            ? true
            : !listEmpty;

    const showNoRoutine = showEditorArea && !routine && !routineQuery.isFetching;

    const isActiveTab = statusFilter === "active";
    const isArchivedTab = statusFilter === "archived";

    const statusTabClass = (active: boolean) =>
        cn(
            "h-9 px-3 rounded-md border text-sm inline-flex items-center gap-2 transition-colors",
            active
                ? "border-primary bg-primary/10 text-primary shadow-sm"
                : "border-border text-muted-foreground hover:bg-muted/60"
        );

    return (
        <div className="space-y-5 sm:space-y-6">
            <PageHeader
                title={t("routines.title")}
                subtitle={
                    routine
                        ? `${t("routines.subtitle")} • ${toStatusLabel(status as any, lang)} • ${weekRangeLabel}`
                        : t("routines.subtitle")
                }
                right={
                    <div className="w-full sm:w-auto">
                        <RoutinesModeToggle mode={mode} busy={busy} t={t} onModeChange={setMode} />
                    </div>
                }
            />

            {/* Status tabs (Activas/Archivadas) */}
            <div className="rounded-xl border bg-card p-3 sm:p-4 flex flex-col gap-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                    <div className="text-sm font-medium">
                        {lang === "es" ? "Rutinas" : "Routines"}
                    </div>

                    {/* Mobile: allow wrap/scroll if needed */}
                    <div className="-mx-1 px-1 overflow-x-auto">
                        <div className="flex w-max sm:w-auto gap-2">
                            <button
                                type="button"
                                className={statusTabClass(isActiveTab)}
                                disabled={busy}
                                onClick={() => setStatusFilter("active")}
                            >
                                {lang === "es" ? "Activas" : "Active"}
                            </button>

                            <button
                                type="button"
                                className={statusTabClass(isArchivedTab)}
                                disabled={busy}
                                onClick={() => setStatusFilter("archived")}
                            >
                                {lang === "es" ? "Archivadas" : "Archived"}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="text-xs text-muted-foreground">
                        {listQuery.isFetching
                            ? lang === "es"
                                ? "Cargando semanas..."
                                : "Loading weeks..."
                            : lang === "es"
                                ? `Mostrando ${weeksList.length} semana(s) ${statusFilter === "active" ? "activas" : "archivadas"}`
                                : `Showing ${weeksList.length} ${statusFilter} week(s)`}
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
                        <div className="text-xs font-medium">
                            {lang === "es" ? "Saltar a semana:" : "Jump to week:"}
                        </div>

                        <select
                            className="h-9 w-full sm:w-auto rounded-md border bg-background px-3 text-sm"
                            value={runWeekKey}
                            disabled={busy || listQuery.isFetching || weeksList.length === 0}
                            onChange={(e) => {
                                const wk = e.target.value;
                                setRunWeekKey(wk);

                                const start = weekKeyToStartDate(wk);
                                if (start) setWeekDate(format(start, "yyyy-MM-dd"));
                            }}
                        >
                            {weeksList.length === 0 ? (
                                <option value={runWeekKey}>
                                    {lang === "es" ? "Sin semanas" : "No weeks"}
                                </option>
                            ) : (
                                weeksList.map((w) => (
                                    <option key={w.weekKey} value={w.weekKey}>
                                        {w.weekKey} • {w.range.from} → {w.range.to}
                                        {w.title ? ` • ${w.title}` : ""}
                                    </option>
                                ))
                            )}
                        </select>
                    </div>
                </div>
            </div>

            {showEditorArea ? (
                <>
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
                        hasRoutine={!!routine}
                        routineStatus={routine?.status}
                    />

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
                                debugPlansTitle={
                                    lang === "es"
                                        ? "Debug: planes (estado local)"
                                        : "Debug: plans (local state)"
                                }
                                plans={plans}
                                movementOptions={movementOptions}
                                scrollRootEl={scrollRootEl}
                            />

                            {/* <PlanVsActualPanel weekKey={runWeekKey} /> */}
                        </>
                    ) : null}

                    {showNoRoutine ? (
                        <EmptyState
                            title={t("routines.noRoutineTitle")}
                            description={t("routines.noRoutineDesc")}
                        />
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

                    {routine ? (
                        <RoutineAttachmentsSection
                            t={t}
                            lang={lang}
                            busy={busy}
                            showUploadQuery={mode === "json"}
                            attachments={attachments}
                            onUpload={uploadWeekAttachments}
                            onDelete={deleteWeekAttachment}
                        />
                    ) : null}
                </>
            ) : null}

            {!showEditorArea && listEmpty ? (
                <EmptyState
                    title={
                        lang === "es"
                            ? statusFilter === "archived"
                                ? "No hay rutinas archivadas"
                                : "No hay rutinas activas"
                            : statusFilter === "archived"
                                ? "No archived routines"
                                : "No active routines"
                    }
                    description={
                        lang === "es"
                            ? "Crea una rutina o cambia el filtro."
                            : "Create a routine or switch the filter."
                    }
                />
            ) : null}
        </div>
    );
}

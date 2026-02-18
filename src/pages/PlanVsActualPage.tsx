import * as React from "react";
import { format, startOfISOWeek, endOfISOWeek, addWeeks } from "date-fns";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { toWeekKey, weekKeyToStartDate } from "@/utils/weekKey";
import { usePlanVsActual } from "@/hooks/usePlanVsActual";
import type { ApiError } from "@/api/httpErrors";

import { PageHeader } from "@/components/PageHeader";
import { JsonDetails } from "@/components/JsonDetails";
import { EmptyState } from "@/components/EmptyState";
import { StatCard } from "@/components/StatCard";
import { useI18n } from "@/i18n/I18nProvider";

function isRecord(v: unknown): v is Record<string, unknown> {
    return typeof v === "object" && v !== null;
}

function toastApiError(e: unknown, fallback: string) {
    const err = e as Partial<ApiError> | undefined;
    const msg = err?.message ?? fallback;
    const details = err?.details ? JSON.stringify(err.details, null, 2) : undefined;
    toast.error(msg, { description: details });
}

type GymCheckSummary = {
    durationMin: number | null;
    notes: string | null;
    totalPlannedExercises: number;
    doneExercises: number;
    hasAnyCheck: boolean;
};

type PvaDay = {
    date: string;
    dayKey: string;
    planned: {
        sessionType: string | null;
        focus: string | null;
        tags: string[] | null;
    } | null;
    actual: {
        sessions: Array<{ id: string; type: string }>;
    } | null;
    status: string;

    // ✅ added by mergePlanVsActualPlanned
    gymCheck?: GymCheckSummary;
};

type PlanVsActualResponse = {
    weekKey: string;
    range: { from: string; to: string };
    hasRoutineTemplate: boolean;
    days: PvaDay[];
};

function isPlanVsActualResponse(v: unknown): v is PlanVsActualResponse {
    if (!isRecord(v)) return false;
    if (typeof (v as any).weekKey !== "string") return false;
    if (!isRecord((v as any).range)) return false;
    if (typeof (v as any).range.from !== "string" || typeof (v as any).range.to !== "string") return false;
    if (typeof (v as any).hasRoutineTemplate !== "boolean") return false;
    if (!Array.isArray((v as any).days)) return false;
    return true;
}

function statusKey(
    status: string
): "pva.status.done" | "pva.status.rest" | "pva.status.missed" | "pva.status.extra" | "pva.status.unknown" {
    switch (status) {
        case "done":
            return "pva.status.done";
        case "rest":
            return "pva.status.rest";
        case "missed":
            return "pva.status.missed";
        case "extra":
            return "pva.status.extra";
        default:
            return "pva.status.unknown";
    }
}

function formatGymSummary(gym: GymCheckSummary | undefined, lang: string) {
    if (!gym || !gym.hasAnyCheck) return null;

    const pieces: string[] = [];

    if (gym.totalPlannedExercises > 0) {
        pieces.push(`${gym.doneExercises}/${gym.totalPlannedExercises}`);
    } else if (gym.doneExercises > 0) {
        pieces.push(`${gym.doneExercises}`);
    }

    if (gym.durationMin !== null) {
        pieces.push(`${gym.durationMin} min`);
    }

    const notes = gym.notes?.trim() ? gym.notes.trim() : null;
    return {
        headline: pieces.length ? pieces.join(" • ") : lang === "es" ? "Registrado" : "Recorded",
        notes,
    };
}

export function PlanVsActualPage() {
    const { t, lang } = useI18n();
    const today = React.useMemo(() => new Date(), []);

    const [weekDate, setWeekDate] = React.useState(() => format(today, "yyyy-MM-dd"));
    const derivedWeekKey = React.useMemo(() => {
        const d = new Date(`${weekDate}T00:00:00`);
        return toWeekKey(d);
    }, [weekDate]);

    // ✅ auto-load when picker changes (debounced)
    const [runWeekKey, setRunWeekKey] = React.useState(() => toWeekKey(today));
    const query = usePlanVsActual(runWeekKey);

    // Toast control: only when user-triggered
    const lastRunRef = React.useRef<string>("");
    const didMountRef = React.useRef(false);

    // Errors
    React.useEffect(() => {
        if (query.isError) toastApiError(query.error, t("pva.toast.loadFail"));
    }, [query.isError, query.error, t]);

    // Success toast only if it was a user-triggered load/refetch
    React.useEffect(() => {
        if (!query.isSuccess) return;
        if (lastRunRef.current === `week:${runWeekKey}`) toast.success(t("pva.toast.loaded"));
    }, [query.isSuccess, runWeekKey, t]);

    // Debounced auto-run on weekDate change (like Day/Weeks)
    React.useEffect(() => {
        // avoid double-run on initial mount
        if (!didMountRef.current) {
            didMountRef.current = true;
            // ensure initial runWeekKey matches initial derivedWeekKey without extra toast
            setRunWeekKey(derivedWeekKey);
            lastRunRef.current = ""; // silent
            return;
        }

        const handle = window.setTimeout(() => {
            setRunWeekKey(derivedWeekKey);
            lastRunRef.current = `week:${derivedWeekKey}`;
        }, 450);

        return () => window.clearTimeout(handle);
    }, [derivedWeekKey]);

    const weekRangeLabel = React.useMemo(() => {
        const d = new Date(`${weekDate}T00:00:00`);
        const start = startOfISOWeek(d);
        const end = endOfISOWeek(d);
        return `${format(start, "MMM d, yyyy")} → ${format(end, "MMM d, yyyy")}`;
    }, [weekDate]);

    function goPrevWeek() {
        const d = new Date(`${weekDate}T00:00:00`);
        setWeekDate(format(addWeeks(d, -1), "yyyy-MM-dd"));
        // auto-run will happen via effect
    }

    function goNextWeek() {
        const d = new Date(`${weekDate}T00:00:00`);
        setWeekDate(format(addWeeks(d, 1), "yyyy-MM-dd"));
        // auto-run will happen via effect
    }

    function syncToLoadedWeek() {
        const start = weekKeyToStartDate(runWeekKey);
        if (!start) return;
        setWeekDate(format(start, "yyyy-MM-dd"));
        // auto-run will happen via effect
    }

    function refetch() {
        lastRunRef.current = `week:${runWeekKey}`;
        query.refetch();
    }

    const pva: PlanVsActualResponse | null = React.useMemo(() => {
        return isPlanVsActualResponse(query.data) ? (query.data as PlanVsActualResponse) : null;
    }, [query.data]);

    const summary = React.useMemo(() => {
        if (!pva) return null;

        const total = pva.days.length;
        const done = pva.days.filter((d) => d.status === "done").length;
        const rest = pva.days.filter((d) => d.status === "rest").length;
        const extra = pva.days.filter((d) => d.status === "extra").length;

        const plannedCount = pva.days.filter(
            (d) => d.planned?.sessionType || d.planned?.focus || (d.planned?.tags?.length ?? 0) > 0
        ).length;

        const actualSessions = pva.days.reduce((acc, d) => acc + (d.actual?.sessions?.length ?? 0), 0);

        const gymCheckedDays = pva.days.filter((d) => d.gymCheck?.hasAnyCheck).length;

        return { total, done, rest, extra, plannedCount, actualSessions, gymCheckedDays };
    }, [pva]);

    const shouldShowEmpty =
        Boolean(pva) &&
        query.isSuccess &&
        !query.isFetching &&
        isPlanVsActualResponse(query.data) &&
        (pva?.days?.length ?? 0) === 0;

    return (
        <div className="space-y-5 sm:space-y-6">
            <PageHeader
                title={t("pages.pva.title")}
                subtitle={`GET /api/workout/weeks/:weekKey/plan-vs-actual`}
                right={
                    <div className="w-full sm:w-auto">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
                            <Button className="w-full sm:w-auto" variant="outline" onClick={refetch} disabled={query.isFetching}>
                                {t("common.refetch")}
                            </Button>
                        </div>
                    </div>
                }
            />

            <div className="rounded-xl border p-4 space-y-3 border-primary/40 bg-primary/5">
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
                    <label className="text-sm flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
                        <span className="whitespace-nowrap">{t("pva.pickDateInWeek")}</span>
                        <input
                            type="date"
                            className="w-full sm:w-auto rounded-md border bg-background px-3 py-2 text-sm"
                            value={weekDate}
                            onChange={(e) => setWeekDate(e.target.value)}
                        />
                    </label>

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
                        <Button className="w-full sm:w-auto" variant="outline" onClick={goPrevWeek} disabled={query.isFetching}>
                            ← {t("pva.prevWeek")}
                        </Button>
                        <Button className="w-full sm:w-auto" variant="outline" onClick={goNextWeek} disabled={query.isFetching}>
                            {t("pva.nextWeek")} →
                        </Button>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-1">
                        <span className="text-xs text-muted-foreground wrap-break-words">
                            {t("pva.selected")}: <span className="font-mono">{derivedWeekKey}</span> • {weekRangeLabel} • {t("pva.loaded")}:{" "}
                            <span className="font-mono">{runWeekKey}</span>{" "}
                            <Button
                                variant="ghost"
                                className="h-8 px-2 align-middle"
                                onClick={syncToLoadedWeek}
                                disabled={query.isFetching}
                            >
                                ({t("pva.sync")})
                            </Button>
                        </span>

                        <span className="text-xs text-muted-foreground wrap-break-words">
                            {t("pva.queryKeyLabel")}: <span className="font-mono">["planVsActual","{runWeekKey}"]</span>
                        </span>
                    </div>
                </div>
            </div>

            {query.isFetching ? (
                <div className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">{t("common.fetching")}</div>
            ) : null}

            {query.isError ? <JsonDetails title={t("pva.error.jsonTitle")} data={query.error} defaultOpen /> : null}

            {!query.isFetching && query.isSuccess && !pva ? (
                <EmptyState
                    title={lang === "es" ? "No se pudo interpretar la respuesta" : "Could not interpret response"}
                    description={lang === "es" ? "Mostrando JSON de depuración." : "Showing debug JSON."}
                />
            ) : null}

            {shouldShowEmpty ? <EmptyState title={t("pva.empty.title")} description={t("pva.empty.desc")} /> : null}

            {pva && summary && !shouldShowEmpty ? (
                <div className="space-y-4">
                    <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-7">
                        <StatCard label={t("pva.stats.days")} value={summary.total} />
                        <StatCard label={t("pva.stats.planned")} value={summary.plannedCount} />
                        <StatCard label={t("pva.stats.actualSessions")} value={summary.actualSessions} />
                        <StatCard label={"Gym Check"} value={summary.gymCheckedDays} />
                        <StatCard label={t("pva.stats.done")} value={summary.done} />
                        <StatCard label={t("pva.stats.rest")} value={summary.rest} />
                        <StatCard label={t("pva.stats.extra")} value={summary.extra} />
                    </div>

                    <div className="rounded-xl border bg-card overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[215] text-sm border-primary/40 bg-primary/5">
                                <thead className="border-b text-left">
                                    <tr>
                                        <th className="p-3">{t("pva.table.day")}</th>
                                        <th className="p-3">{t("pva.table.date")}</th>
                                        <th className="p-3">{t("pva.table.plan")}</th>
                                        <th className="p-3">Gym Check</th>
                                        <th className="p-3">{t("pva.table.actual")}</th>
                                        <th className="p-3">{t("pva.table.status")}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pva.days.map((d) => {
                                        const planned = d.planned;

                                        const plannedText = planned
                                            ? [
                                                planned.sessionType ? `${t("pva.plan.type")}: ${planned.sessionType}` : null,
                                                planned.focus ? `${t("pva.plan.focus")}: ${planned.focus}` : null,
                                                planned.tags?.length ? `${t("pva.plan.tags")}: ${planned.tags.join(", ")}` : null,
                                            ]
                                                .filter(Boolean)
                                                .join(" • ")
                                            : "";

                                        const gymText = formatGymSummary(d.gymCheck, lang);

                                        const actualCount = d.actual?.sessions?.length ?? 0;
                                        const actualText =
                                            actualCount === 0
                                                ? t("common.noDataDash")
                                                : d.actual!.sessions.map((s) => s.type).join(", ");

                                        return (
                                            <tr key={d.date} className="border-b last:border-b-0">
                                                <td className="p-3 font-medium whitespace-nowrap">{d.dayKey}</td>
                                                <td className="p-3 font-mono whitespace-nowrap">{d.date}</td>

                                                <td className="p-3 wrap-break-words">
                                                    {plannedText ? (
                                                        plannedText
                                                    ) : (
                                                        <span className="text-muted-foreground">{t("common.noDataDash")}</span>
                                                    )}
                                                </td>

                                                <td className="p-3">
                                                    {gymText ? (
                                                        <div className="space-y-1">
                                                            <div className="font-mono wrap-break-words">{gymText.headline}</div>
                                                            {gymText.notes ? (
                                                                <div
                                                                    className="text-xs text-muted-foreground truncate max-w-[320px]"
                                                                    title={gymText.notes}
                                                                >
                                                                    {gymText.notes}
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground">{t("common.noDataDash")}</span>
                                                    )}
                                                </td>

                                                <td className="p-3 wrap-break-words">
                                                    {actualCount > 0 ? (
                                                        <span>
                                                            {actualCount} {t("pva.actual.sessionSuffix")} • {actualText}
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground">{t("common.noDataDash")}</span>
                                                    )}
                                                </td>

                                                <td className="p-3 font-mono whitespace-nowrap">{t(statusKey(d.status))}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <JsonDetails title={t("pva.debug.responseTitle")} data={query.data} />
                </div>
            ) : null}
        </div>
    );
}

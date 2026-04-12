// src/pages/WeeklySummaryPage.tsx
import React from "react";
import { format, addWeeks, startOfISOWeek, endOfISOWeek } from "date-fns";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { EmptyState } from "@/components/EmptyState";
import { JsonDetails } from "@/components/JsonDetails";
import { useI18n } from "@/i18n/I18nProvider";

import { toWeekKey, weekKeyToStartDate } from "@/utils/weekKey";
import { useWeekSummary } from "@/hooks/useWeekSummary";
import { useRangeSummary } from "@/hooks/useRangeSummary";
import { extractWeekKpis } from "@/utils/weeksExplorer";

type Tab = "week" | "range";

type AnyRecord = Record<string, unknown>;

function isRecord(v: unknown): v is AnyRecord {
    return typeof v === "object" && v !== null;
}

function todayIso(): string {
    return format(new Date(), "yyyy-MM-dd");
}

function getDaysCountFromSummary(data: unknown): number | null {
    if (!isRecord(data)) return null;
    const v = data.daysCount;
    return typeof v === "number" && Number.isFinite(v) ? v : null;
}

/**
 * Formats values passed into StatCard so large decimal tails do not break mobile UI.
 * - numbers => rounded to max 2 decimals
 * - strings / other values => returned as-is
 */
function formatStatValue(value: unknown): React.ReactNode {
    if (typeof value === "number" && Number.isFinite(value)) {
        return Number(value.toFixed(2)).toString();
    }

    return value as React.ReactNode;
}

export function WeeklySummaryPage() {
    const { t } = useI18n();
    const today = React.useMemo(() => new Date(), []);

    const [tab, setTab] = React.useState<Tab>("week");

    // Week picker (date -> derived weekKey)
    const [weekDate, setWeekDate] = React.useState<string>(() => format(today, "yyyy-MM-dd"));
    const derivedWeekKey = React.useMemo(() => {
        const d = new Date(`${weekDate}T00:00:00`);
        return toWeekKey(d);
    }, [weekDate]);

    // Range picker
    const [from, setFrom] = React.useState<string>(() => todayIso());
    const [to, setTo] = React.useState<string>(() => todayIso());

    // Auto-load keys (mirrors selection)
    const [runWeekKey, setRunWeekKey] = React.useState<string>(() => toWeekKey(today));
    const [runFrom, setRunFrom] = React.useState<string>(from);
    const [runTo, setRunTo] = React.useState<string>(to);

    // Auto-load behavior (like Day)
    React.useEffect(() => {
        if (tab !== "week") return;
        setRunWeekKey(derivedWeekKey);
    }, [tab, derivedWeekKey]);

    React.useEffect(() => {
        if (tab !== "range") return;
        setRunFrom(from);
        setRunTo(to);
    }, [tab, from, to]);

    const weekQuery = useWeekSummary(tab === "week" ? runWeekKey : "");
    const rangeQuery = useRangeSummary(tab === "range" ? runFrom : "", tab === "range" ? runTo : "");

    const active = tab === "week" ? weekQuery : rangeQuery;
    const isFetching = active.isFetching;

    React.useEffect(() => {
        if (weekQuery.isError) toast.error(weekQuery.error.message);
    }, [weekQuery.isError, weekQuery.error]);

    React.useEffect(() => {
        if (rangeQuery.isError) toast.error(rangeQuery.error.message);
    }, [rangeQuery.isError, rangeQuery.error]);

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

    function jumpToWeekKey(weekKey: string) {
        const start = weekKeyToStartDate(weekKey);
        if (!start) return;
        setWeekDate(format(start, "yyyy-MM-dd"));
    }

    const weekData = tab === "week" ? weekQuery.data ?? null : null;
    const extracted = React.useMemo(() => extractWeekKpis(weekData), [weekData]);

    const daysCount = getDaysCountFromSummary(active.data ?? null);
    const showEmptyForZero = active.isSuccess && daysCount === 0;

    const hasMediaCountPerType = extracted.bySessionType.some((r) => typeof (r as { mediaCount?: unknown }).mediaCount === "number");

    return (
        <div className="px-4 sm:px-0 space-y-6">
            <PageHeader title={t("pages.weeks.title")} subtitle={t("pages.weeks.subtitle")} />

            <div className="rounded-xl border bg-card p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2">
                    <Button
                        className="w-full sm:w-auto"
                        variant={tab === "week" ? "default" : "outline"}
                        onClick={() => setTab("week")}
                    >
                        {t("tabs.week")}
                    </Button>
                    <Button
                        className="w-full sm:w-auto"
                        variant={tab === "range" ? "default" : "outline"}
                        onClick={() => setTab("range")}
                    >
                        {t("tabs.range")}
                    </Button>
                </div>

                {tab === "week" ? (
                    <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3">
                            <label className="text-sm w-full sm:w-auto">
                                <span className="block sm:inline">{t("week.pickDateInWeek")}</span>{" "}
                            </label>
                            <div className="my-1 w-auto columns-1 sm:my-0 sm:w-auto">
                                <input
                                    type="date"
                                    className="mt-1 sm:mt-0 sm:ml-2 w-full sm:w-auto h-11 sm:h-10 rounded-md border bg-background px-3 text-sm"
                                    value={weekDate}
                                    onChange={(e) => setWeekDate(e.target.value)}
                                />
                            </div>

                            <div className="my-1 grid w-auto grid-cols-2 gap-2 sm:my-0 sm:w-auto">
                                <Button className="w-full sm:w-auto" variant="outline" onClick={goPrevWeek} disabled={isFetching}>
                                    {t("week.prev")}
                                </Button>
                                <Button className="w-full sm:w-auto" variant="outline" onClick={goNextWeek} disabled={isFetching}>
                                    {t("week.next")}
                                </Button>
                            </div>

                            <div className="sm:ml-auto text-xs text-muted-foreground wrap-wrap-break-words">
                                {t("week.selectedWeekKey")}:{" "}
                                <span className="font-mono text-foreground">{derivedWeekKey}</span>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 text-sm">
                            <div className="flex flex-col sm:flex-row sm:gap-3 rounded-md border bg-background px-3 py-2 w-full sm:w-auto">
                                <span className="text-muted-foreground">{t("week.weekRange")}:</span>{" "}
                                <span className="font-mono">{weekRangeLabel}</span>
                            </div>

                            <div className="text-xs text-muted-foreground wrap-wrap-break-words sm:ml-auto">
                                {t("week.loaded")}:{" "}
                                <span className="font-mono">{runWeekKey}</span>{" "}
                                <Button
                                    variant="ghost"
                                    className="h-8 px-2"
                                    onClick={() => jumpToWeekKey(runWeekKey)}
                                    disabled={isFetching}
                                    title={t("weeks.syncPickerTitle")}
                                >
                                    {t("weeks.sync")}
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center">
                        <label className="text-sm w-full sm:w-auto">
                            <span className="block sm:inline">{t("common.from")}</span>{" "}
                        </label>
                        <div className="my-1 w-auto columns-1 sm:my-0 sm:w-auto">
                            <input
                                type="date"
                                className="mt-1 sm:mt-0 sm:ml-2 w-full sm:w-auto h-11 sm:h-10 rounded-md border bg-background px-3 text-sm"
                                value={from}
                                onChange={(e) => setFrom(e.target.value)}
                            />
                        </div>

                        <label className="text-sm w-full sm:w-auto">
                            <span className="block sm:inline">{t("common.to")}</span>{" "}
                        </label>
                        <div className="my-1 w-auto columns-1 sm:my-0 sm:w-auto">
                            <input
                                type="date"
                                className="mt-1 sm:mt-0 sm:ml-2 w-full sm:w-auto h-11 sm:h-10 rounded-md border bg-background px-3 text-sm"
                                value={to}
                                onChange={(e) => setTo(e.target.value)}
                            />
                        </div>

                        <span className="sm:ml-auto text-xs mt-1 text-muted-foreground wrap-wrap-break-words">
                            {t("week.loaded")}:{" "}
                            <span className="font-mono">{runFrom}</span> → <span className="font-mono">{runTo}</span>
                        </span>
                    </div>
                )}
            </div>

            <div className="rounded-xl border bg-card p-4 space-y-4">
                {!active.data && !active.isFetching && !active.isError ? (
                    <EmptyState title={t("weeks.empty.title")} description={t("weeks.empty.desc")} />
                ) : null}

                {active.isFetching ? <div className="text-sm text-muted-foreground">{t("common.fetching")}</div> : null}

                {active.isError ? <JsonDetails title={t("common.errorTitle")} data={active.error} defaultOpen /> : null}

                {showEmptyForZero ? (
                    <EmptyState title={t("weeks.empty.title")} description={t("weeks.empty.desc")} />
                ) : null}

                {tab === "week" && weekQuery.isSuccess && weekData && !showEmptyForZero ? (
                    <>
                        <div className="grid gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
                            <StatCard label={t("weeks.kpi.days")} value={formatStatValue(extracted.kpis.daysCount)} />
                            <StatCard label={t("weeks.kpi.sessions")} value={formatStatValue(extracted.kpis.sessionsCount)} />
                            <StatCard label={t("weeks.kpi.durationMin")} value={formatStatValue(extracted.kpis.durationMinutes)} />
                            <StatCard label={t("weeks.kpi.activeKcal")} value={formatStatValue(extracted.kpis.activeKcal)} />
                            <StatCard label={t("weeks.kpi.media")} value={formatStatValue(extracted.kpis.mediaCount)} />
                            <StatCard label={t("weeks.kpi.sleepDays")} value={formatStatValue(extracted.kpis.sleepDays)} />
                            <StatCard label={t("weeks.kpi.sleepAvgMin")} value={formatStatValue(extracted.kpis.sleepAvgTotal)} />
                            <StatCard label={t("weeks.kpi.sleepScore")} value={formatStatValue(extracted.kpis.sleepAvgScore)} />
                            <StatCard label={t("weeks.kpi.sleepAvgRemMin")} value={formatStatValue(extracted.kpis.sleepAvgRem)} />
                            <StatCard label={t("weeks.kpi.sleepAvgDeepMin")} value={formatStatValue(extracted.kpis.sleepAvgDeep)} />
                            <StatCard
                                label={t("weeks.kpi.hr")}
                                value={`${formatStatValue(extracted.kpis.avgHr)} / ${formatStatValue(extracted.kpis.maxHr)}`}
                            />
                        </div>

                        {extracted.bySessionType.length > 0 ? (
                            <div className="rounded-xl border bg-background p-4">
                                <div className="text-sm font-medium">{t("weeks.byType.title")}</div>

                                <div className="mt-4 overflow-x-auto">
                                    <div className="min-w-[140]">
                                        <table className="w-full text-sm">
                                            <thead className="text-muted-foreground">
                                                <tr className="border-b">
                                                    <th className="py-3 pr-6 text-left font-medium whitespace-nowrap">
                                                        {t("weeks.byType.type")}
                                                    </th>
                                                    <th className="py-3 px-4 text-right font-medium whitespace-nowrap">
                                                        {t("weeks.byType.sessions")}
                                                    </th>
                                                    <th className="py-3 px-4 text-right font-medium whitespace-nowrap">
                                                        {t("weeks.byType.durationMin")}
                                                    </th>
                                                    <th className="py-3 px-4 text-right font-medium whitespace-nowrap">
                                                        {t("weeks.byType.kcal")}
                                                    </th>

                                                    {hasMediaCountPerType ? (
                                                        <th className="py-3 pl-4 text-right font-medium whitespace-nowrap">
                                                            {t("weeks.byType.media")}
                                                        </th>
                                                    ) : null}
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {extracted.bySessionType.map((row, idx) => (
                                                    <tr key={`${row.sessionType}-${idx}`} className="border-b last:border-b-0">
                                                        <td className="py-3 pr-6 align-top">
                                                            <span className="wrap-break-words">{row.sessionType}</span>
                                                        </td>
                                                        <td className="py-3 px-4 text-right tabular-nums whitespace-nowrap">
                                                            {formatStatValue(row.sessionsCount)}
                                                        </td>
                                                        <td className="py-3 px-4 text-right tabular-nums whitespace-nowrap">
                                                            {formatStatValue(row.durationMinutes)}
                                                        </td>
                                                        <td className="py-3 px-4 text-right tabular-nums whitespace-nowrap">
                                                            {formatStatValue(row.activeKcal)}
                                                        </td>

                                                        {hasMediaCountPerType ? (
                                                            <td className="py-3 pl-4 text-right tabular-nums whitespace-nowrap">
                                                                {formatStatValue((row as { mediaCount?: unknown }).mediaCount ?? "—")}
                                                            </td>
                                                        ) : null}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        ) : null}

                        <JsonDetails title={t("weeks.json.weekTitle")} data={weekQuery.data} />
                    </>
                ) : null}

                {tab === "range" && rangeQuery.isSuccess ? (
                    <>
                        {showEmptyForZero ? null : <JsonDetails title={t("weeks.json.rangeTitle")} data={rangeQuery.data} />}

                        {showEmptyForZero ? <JsonDetails title={t("weeks.json.rangeTitle")} data={rangeQuery.data} /> : null}
                    </>
                ) : null}
            </div>
        </div>
    );
}
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
    const v = (data as any).daysCount;
    return typeof v === "number" && Number.isFinite(v) ? v : null;
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

    // Errors
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

    // By-type optional media column
    const hasMediaCountPerType = extracted.bySessionType.some((r) => typeof (r as any).mediaCount === "number");

    return (
        <div className="space-y-6">
            <PageHeader title={t("pages.weeks.title")} subtitle={t("pages.weeks.subtitle")} />

            <div className="rounded-xl border bg-card p-4 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                    <Button variant={tab === "week" ? "default" : "outline"} onClick={() => setTab("week")}>
                        {t("tabs.week")}
                    </Button>
                    <Button variant={tab === "range" ? "default" : "outline"} onClick={() => setTab("range")}>
                        {t("tabs.range")}
                    </Button>
                </div>

                {tab === "week" ? (
                    <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                            <label className="text-sm">
                                {t("week.pickDateInWeek")}{" "}
                                <input
                                    type="date"
                                    className="ml-2 rounded-md border bg-background px-3 py-2 text-sm"
                                    value={weekDate}
                                    onChange={(e) => setWeekDate(e.target.value)}
                                />
                            </label>

                            <div className="grid gap-2 grid-cols-2">
                                <Button variant="outline" onClick={goPrevWeek} disabled={isFetching}>
                                    {t("week.prev")}
                                </Button>
                                <Button variant="outline" onClick={goNextWeek} disabled={isFetching}>
                                    {t("week.next")}
                                </Button>
                            </div>

                            <div className="ml-auto text-xs text-muted-foreground">
                                {t("week.selectedWeekKey")}:{" "}
                                <span className="font-mono text-foreground">{derivedWeekKey}</span>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-sm">
                            <div className="rounded-md border bg-background px-3 py-2">
                                <span className="text-muted-foreground">{t("week.weekRange")}:</span>{" "}
                                <span className="font-mono">{weekRangeLabel}</span>
                            </div>

                            <div className="text-xs text-muted-foreground">
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
                    <div className="flex flex-wrap items-center gap-2">
                        <label className="text-sm">
                            {t("common.from")}{" "}
                            <input
                                type="date"
                                className="ml-2 rounded-md border bg-background px-3 py-2 text-sm"
                                value={from}
                                onChange={(e) => setFrom(e.target.value)}
                            />
                        </label>

                        <label className="text-sm">
                            {t("common.to")}{" "}
                            <input
                                type="date"
                                className="ml-2 rounded-md border bg-background px-3 py-2 text-sm"
                                value={to}
                                onChange={(e) => setTo(e.target.value)}
                            />
                        </label>

                        <span className="ml-auto text-xs text-muted-foreground">
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
                            <StatCard label={t("weeks.kpi.days")} value={extracted.kpis.daysCount} />
                            <StatCard label={t("weeks.kpi.sessions")} value={extracted.kpis.sessionsCount} />
                            <StatCard label={t("weeks.kpi.durationMin")} value={extracted.kpis.durationMinutes} />
                            <StatCard label={t("weeks.kpi.activeKcal")} value={extracted.kpis.activeKcal} />
                            <StatCard label={t("weeks.kpi.media")} value={extracted.kpis.mediaCount} />
                            <StatCard label={t("weeks.kpi.sleepDays")} value={extracted.kpis.sleepDays} />
                            <StatCard label={t("weeks.kpi.sleepAvgMin")} value={extracted.kpis.sleepAvgTotal} />
                            <StatCard label={t("weeks.kpi.sleepScore")} value={extracted.kpis.sleepAvgScore} />

                            {/* NEW: REM / Deep */}
                            <StatCard label={t("weeks.kpi.sleepAvgRemMin")} value={extracted.kpis.sleepAvgRem} />
                            <StatCard label={t("weeks.kpi.sleepAvgDeepMin")} value={extracted.kpis.sleepAvgDeep} />

                            <StatCard
                                label={t("weeks.kpi.hr")}
                                value={`${extracted.kpis.avgHr} / ${extracted.kpis.maxHr}`}
                            />
                        </div>

                        {extracted.bySessionType.length > 0 ? (
                            <div className="rounded-xl border bg-background p-4">
                                <div className="text-sm font-medium">{t("weeks.byType.title")}</div>

                                <div className="mt-3 overflow-auto">
                                    <table className="w-full text-sm">
                                        <thead className="text-muted-foreground">
                                            <tr className="border-b">
                                                <th className="py-2 text-left font-medium">{t("weeks.byType.type")}</th>
                                                <th className="py-2 text-right font-medium">{t("weeks.byType.sessions")}</th>
                                                <th className="py-2 text-right font-medium">{t("weeks.byType.durationMin")}</th>
                                                <th className="py-2 text-right font-medium">{t("weeks.byType.kcal")}</th>

                                                {hasMediaCountPerType ? (
                                                    <th className="py-2 text-right font-medium">{t("weeks.byType.media")}</th>
                                                ) : null}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {extracted.bySessionType.map((row, idx) => (
                                                <tr key={`${row.sessionType}-${idx}`} className="border-b last:border-b-0">
                                                    <td className="py-2">{row.sessionType}</td>
                                                    <td className="py-2 text-right">{row.sessionsCount}</td>
                                                    <td className="py-2 text-right">{row.durationMinutes}</td>
                                                    <td className="py-2 text-right">{row.activeKcal}</td>

                                                    {hasMediaCountPerType ? (
                                                        <td className="py-2 text-right">
                                                            {(row as any).mediaCount ?? "—"}
                                                        </td>
                                                    ) : null}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : null}

                        <JsonDetails title={t("weeks.json.weekTitle")} data={weekQuery.data} />
                    </>
                ) : null}

                {tab === "range" && rangeQuery.isSuccess ? (
                    <>
                        {showEmptyForZero ? null : (
                            <JsonDetails title={t("weeks.json.rangeTitle")} data={rangeQuery.data} />
                        )}

                        {/* If it's empty but backend still returned JSON, keep it accessible */}
                        {showEmptyForZero ? (
                            <JsonDetails title={t("weeks.json.rangeTitle")} data={rangeQuery.data} />
                        ) : null}
                    </>
                ) : null}
            </div>
        </div>
    );
}

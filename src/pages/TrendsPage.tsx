import React from "react";
import { toast } from "sonner";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts";

import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { JsonDetails } from "@/components/JsonDetails";
import { StatCard } from "@/components/StatCard";
import { useI18n } from "@/i18n/I18nProvider";

import { useWeeklyTrends } from "@/hooks/useWeeklyTrends";
import { defaultTrendsRange, sanitizeWeekKeyInput } from "@/utils/trendsDefaults";
import type { WeekKey } from "@/types/workoutSummary.types";

type ChartRow = {
    weekKey: string;
    sessionsCount: number;
    durationSeconds: number;
    activeKcal: number | null;
    mediaCount: number;
    sleepDays: number;
};

function isValidWeekKey(v: string): v is WeekKey {
    return /^(\d{4})-W(\d{2})$/.test(v);
}

export function TrendsPage() {
    const { t } = useI18n();

    const defaults = React.useMemo(() => defaultTrendsRange(new Date()), []);
    const [fromWeek, setFromWeek] = React.useState(defaults.fromWeek);
    const [toWeek, setToWeek] = React.useState(defaults.toWeek);

    // These are the actual query params (auto-updated)
    const [runFrom, setRunFrom] = React.useState<WeekKey | "">(defaults.fromWeek as WeekKey);
    const [runTo, setRunTo] = React.useState<WeekKey | "">(defaults.toWeek as WeekKey);

    const query = useWeeklyTrends(runFrom, runTo);

    // prevent toast spam
    const lastToastRef = React.useRef<string>("");

    React.useEffect(() => {
        if (query.isError) toast.error(query.error.message);
    }, [query.isError, query.error]);

    // AUTO-LOAD (debounced): whenever the user edits from/to, sanitize + if valid -> set runFrom/runTo
    React.useEffect(() => {
        const handle = window.setTimeout(() => {
            const nextFrom = sanitizeWeekKeyInput(fromWeek);
            const nextTo = sanitizeWeekKeyInput(toWeek);

            // only normalize the visible inputs if sanitization changed them
            if (nextFrom !== fromWeek) setFromWeek(nextFrom);
            if (nextTo !== toWeek) setToWeek(nextTo);

            if (isValidWeekKey(nextFrom) && isValidWeekKey(nextTo)) {
                // only update when actually changed
                const key = `${nextFrom}:${nextTo}`;
                const prev = `${runFrom}:${runTo}`;
                if (key !== prev) {
                    setRunFrom(nextFrom);
                    setRunTo(nextTo);
                }
            } else {
                // keep query disabled until valid
                if (runFrom !== "" || runTo !== "") {
                    setRunFrom("");
                    setRunTo("");
                }
            }
        }, 450);

        return () => window.clearTimeout(handle);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fromWeek, toWeek]);

    // Loaded toast (only when success AND params changed)
    React.useEffect(() => {
        if (!query.isSuccess) return;
        if (!runFrom || !runTo) return;

        const k = `${runFrom}:${runTo}`;
        if (lastToastRef.current !== k) {
            lastToastRef.current = k;
            toast.success(t("trends.toast.loaded"));
        }
    }, [query.isSuccess, runFrom, runTo, t]);

    const points = query.data?.points ?? [];

    const chartData: ChartRow[] = React.useMemo(
        () =>
            points.map((p) => ({
                weekKey: p.weekKey,
                sessionsCount: p.training.sessionsCount,
                durationSeconds: p.training.durationSeconds,
                activeKcal: p.training.activeKcal,
                mediaCount: p.mediaCount,
                sleepDays: p.sleep.daysWithSleep,
            })),
        [points]
    );

    const last = points.length ? points[points.length - 1] : null;

    return (
        <div className="space-y-6">
            <PageHeader title={t("pages.trends.title")} subtitle={t("pages.trends.subtitle")} />

            <div className="rounded-xl border bg-card p-4 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                    <label className="text-sm">
                        {t("trends.fromWeek")}{" "}
                        <input
                            className="ml-2 rounded-md border bg-background px-3 py-2 text-sm"
                            value={fromWeek}
                            onChange={(e) => setFromWeek(e.target.value)}
                            placeholder="YYYY-W##"
                            inputMode="text"
                            autoComplete="off"
                            spellCheck={false}
                        />
                    </label>

                    <label className="text-sm">
                        {t("trends.toWeek")}{" "}
                        <input
                            className="ml-2 rounded-md border bg-background px-3 py-2 text-sm"
                            value={toWeek}
                            onChange={(e) => setToWeek(e.target.value)}
                            placeholder="YYYY-W##"
                            inputMode="text"
                            autoComplete="off"
                            spellCheck={false}
                        />
                    </label>

                    <span className="text-xs text-muted-foreground">
                        {t("week.loaded")}:{" "}
                        <span className="font-mono">{runFrom || "—"}</span> →{" "}
                        <span className="font-mono">{runTo || "—"}</span>
                    </span>
                </div>
            </div>

            {query.isError ? <JsonDetails title={t("common.errorTitle")} data={query.error} defaultOpen /> : null}

            {query.isSuccess && last ? (
                <div className="grid gap-4 sm:grid-cols-4">
                    <StatCard label={t("trends.kpi.week")} value={last.weekKey} />
                    <StatCard label={t("trends.kpi.sessions")} value={last.training.sessionsCount} />
                    <StatCard label={t("trends.kpi.durationSeconds")} value={last.training.durationSeconds} />
                    <StatCard label={t("trends.kpi.media")} value={last.mediaCount} />
                </div>
            ) : null}

            <div className="rounded-xl border bg-card p-4">
                {query.isFetching ? <p className="text-sm text-muted-foreground">{t("common.fetching")}</p> : null}

                {query.isSuccess && points.length === 0 ? (
                    <EmptyState title={t("trends.empty.title")} description={t("trends.empty.desc")} />
                ) : null}

                {query.isSuccess && points.length > 0 ? (
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height={320}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="weekKey" />
                                <YAxis />
                                <Tooltip />

                                <Line type="monotone" dataKey="sessionsCount" name={t("trends.line.sessions")} strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey="durationSeconds" name={t("trends.line.durationSeconds")} strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey="activeKcal" name={t("trends.line.activeKcal")} strokeWidth={2} dot={false} connectNulls={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                ) : null}
            </div>

            {query.isSuccess ? <JsonDetails title={t("trends.json.title")} data={query.data} /> : null}
        </div>
    );
}

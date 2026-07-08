// src/pages/TrendsPage.tsx
// MUI weekly trends page with responsive controls, KPI cards, and chart container.

import React from "react";
import { toast } from "sonner";
import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";

import { JsonDetails } from "@/components/JsonDetails";
import { AppCard, AppEmptyState, AppMetricCard, AppPage, AppToolbar } from "@/components/mui";
import { useI18n } from "@/i18n/I18nProvider";

import { useWeeklyTrends } from "@/hooks/useWeeklyTrends";
import type { WeekKey } from "@/types/workoutSummary.types";
import { defaultTrendsRange, sanitizeWeekKeyInput } from "@/utils/trendsDefaults";

type ChartRow = {
    weekKey: string;
    sessionsCount: number;
    durationSeconds: number;
    activeKcal: number | null;
    mediaCount: number;
    sleepDays: number;
};

function isValidWeekKey(value: string): value is WeekKey {
    return /^(\d{4})-W(\d{2})$/.test(value);
}

function formatNumber(value: number | null | undefined): string {
    if (typeof value !== "number" || !Number.isFinite(value)) return "—";
    return Number(value.toFixed(2)).toString();
}

export function TrendsPage() {
    const { t } = useI18n();
    const theme = useTheme();

    const defaults = React.useMemo(() => defaultTrendsRange(new Date()), []);
    const [fromWeek, setFromWeek] = React.useState(defaults.fromWeek);
    const [toWeek, setToWeek] = React.useState(defaults.toWeek);
    const [runFrom, setRunFrom] = React.useState<WeekKey | "">(defaults.fromWeek as WeekKey);
    const [runTo, setRunTo] = React.useState<WeekKey | "">(defaults.toWeek as WeekKey);

    const query = useWeeklyTrends(runFrom, runTo);
    const lastToastRef = React.useRef<string>("");

    React.useEffect(() => {
        if (query.isError) toast.error(query.error.message);
    }, [query.isError, query.error]);

    React.useEffect(() => {
        const handle = window.setTimeout(() => {
            const nextFrom = sanitizeWeekKeyInput(fromWeek);
            const nextTo = sanitizeWeekKeyInput(toWeek);

            if (nextFrom !== fromWeek) setFromWeek(nextFrom);
            if (nextTo !== toWeek) setToWeek(nextTo);

            if (isValidWeekKey(nextFrom) && isValidWeekKey(nextTo)) {
                const key = `${nextFrom}:${nextTo}`;
                const previous = `${runFrom}:${runTo}`;

                if (key !== previous) {
                    setRunFrom(nextFrom);
                    setRunTo(nextTo);
                }
            } else if (runFrom !== "" || runTo !== "") {
                setRunFrom("");
                setRunTo("");
            }
        }, 450);

        return () => window.clearTimeout(handle);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fromWeek, toWeek]);

    React.useEffect(() => {
        if (!query.isSuccess || !runFrom || !runTo) return;

        const toastKey = `${runFrom}:${runTo}`;
        if (lastToastRef.current !== toastKey) {
            lastToastRef.current = toastKey;
            toast.success(t("trends.toast.loaded"));
        }
    }, [query.isSuccess, runFrom, runTo, t]);

    const points = query.data?.points ?? [];
    const chartData: ChartRow[] = React.useMemo(
        () =>
            points.map((point) => ({
                weekKey: point.weekKey,
                sessionsCount: point.training.sessionsCount,
                durationSeconds: point.training.durationSeconds,
                activeKcal: point.training.activeKcal,
                mediaCount: point.mediaCount,
                sleepDays: point.sleep.daysWithSleep,
            })),
        [points]
    );

    const last = points.length ? points[points.length - 1] : null;

    return (
        <AppPage title={t("pages.trends.title")} subtitle={t("pages.trends.subtitle")} maxWidth="lg">
            <AppToolbar sx={{ flexDirection: "row" }}>
                <TextField
                    label={t("trends.fromWeek")}
                    size="small"
                    value={fromWeek}
                    onChange={(event) => setFromWeek(event.target.value)}
                    placeholder="YYYY-W##"
                    autoComplete="off"
                    spellCheck={false}
                    sx={{ width: { xs: "48%", sm: 180 } }}
                />
                <TextField
                    label={t("trends.toWeek")}
                    size="small"
                    value={toWeek}
                    onChange={(event) => setToWeek(event.target.value)}
                    placeholder="YYYY-W##"
                    autoComplete="off"
                    spellCheck={false}
                    sx={{ width: { xs: "48%", sm: 180 } }}
                />
                <Chip label={`${t("week.loaded")}: ${runFrom || "—"} → ${runTo || "—"}`} color="primary" variant="outlined" />
            </AppToolbar>

            {query.isError ? <JsonDetails title={t("common.errorTitle")} data={query.error} defaultOpen /> : null}

            {query.isSuccess && last ? (
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: {
                            xs: "repeat(2, minmax(0, 1fr))",
                            md: "repeat(4, minmax(0, 1fr))",
                        },
                        gap: { xs: 1, md: 1.5 },
                    }}
                >
                    <AppMetricCard label={t("trends.kpi.week")} value={last.weekKey} compact />
                    <AppMetricCard label={t("trends.kpi.sessions")} value={formatNumber(last.training.sessionsCount)} compact />
                    <AppMetricCard label={t("trends.kpi.durationSeconds")} value={formatNumber(last.training.durationSeconds)} compact />
                    <AppMetricCard label={t("trends.kpi.media")} value={formatNumber(last.mediaCount)} compact />
                </Box>
            ) : null}

            <AppCard>
                {query.isFetching ? (
                    <Typography variant="body2" color="text.secondary">
                        {t("common.fetching")}
                    </Typography>
                ) : null}

                {query.isSuccess && points.length === 0 ? (
                    <AppEmptyState title={t("trends.empty.title")} description={t("trends.empty.desc")} />
                ) : null}

                {query.isSuccess && points.length > 0 ? (
                    <Box sx={{ height: { xs: 320, md: 380 }, minWidth: 0 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 8, right: 20, bottom: 8, left: 0 }}>
                                <CartesianGrid stroke={theme.palette.divider} strokeDasharray="3 3" />
                                <XAxis dataKey="weekKey" stroke={theme.palette.text.secondary} />
                                <YAxis stroke={theme.palette.text.secondary} />
                                <Tooltip
                                    contentStyle={{
                                        background: theme.palette.background.paper,
                                        border: `1px solid ${theme.palette.divider}`,
                                        borderRadius: 10,
                                        color: theme.palette.text.primary,
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="sessionsCount"
                                    name={t("trends.line.sessions")}
                                    stroke={theme.palette.primary.main}
                                    strokeWidth={2}
                                    dot={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="durationSeconds"
                                    name={t("trends.line.durationSeconds")}
                                    stroke={theme.palette.info.main}
                                    strokeWidth={2}
                                    dot={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="activeKcal"
                                    name={t("trends.line.activeKcal")}
                                    stroke={theme.palette.warning.main}
                                    strokeWidth={2}
                                    dot={false}
                                    connectNulls={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </Box>
                ) : null}
            </AppCard>

            {query.isSuccess ? <JsonDetails title={t("trends.json.title")} data={query.data} /> : null}
        </AppPage>
    );
}

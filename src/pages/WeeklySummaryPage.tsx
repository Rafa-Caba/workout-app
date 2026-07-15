// src/pages/WeeklySummaryPage.tsx
// MUI weekly / range summary page. Keeps existing hooks and API contracts unchanged.

import React from "react";
import { addWeeks, endOfISOWeek, format, startOfISOWeek } from "date-fns";
import { toast } from "sonner";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { JsonDetails } from "@/components/JsonDetails";
import {
    AppCard,
    AppEmptyState,
    AppMetricCard,
    AppPage,
    AppResponsiveTabs,
    AppToolbar,
} from "@/components/mui";
import { useI18n } from "@/i18n/I18nProvider";

import { useRangeSummary } from "@/hooks/useRangeSummary";
import { useWeekSummary } from "@/hooks/useWeekSummary";
import { useWorkoutWeekView } from "@/hooks/useWorkoutWeekView";
import { extractWeekKpis } from "@/utils/weeksExplorer";
import { toWeekKey, weekKeyToStartDate } from "@/utils/weekKey";
import { WeekSleepByDayTable } from "@/components/weeklySummary/WeekSleepByDayTable";

type Tab = "week" | "range";
type AnyRecord = Record<string, unknown>;

function isRecord(value: unknown): value is AnyRecord {
    return typeof value === "object" && value !== null;
}

function todayIso(): string {
    return format(new Date(), "yyyy-MM-dd");
}

function getDaysCountFromSummary(data: unknown): number | null {
    if (!isRecord(data)) return null;

    const daysCount = data.daysCount;
    return typeof daysCount === "number" && Number.isFinite(daysCount) ? daysCount : null;
}

function formatStatValue(value: unknown): React.ReactNode {
    if (typeof value === "number" && Number.isFinite(value)) {
        return Number(value.toFixed(2)).toString();
    }

    if (value === null || value === undefined || value === "") {
        return "—";
    }

    return value as React.ReactNode;
}

export function WeeklySummaryPage() {
    const { t, lang } = useI18n();
    const today = React.useMemo(() => new Date(), []);

    const [tab, setTab] = React.useState<Tab>("week");
    const [weekDate, setWeekDate] = React.useState<string>(() => format(today, "yyyy-MM-dd"));
    const [from, setFrom] = React.useState<string>(() => todayIso());
    const [to, setTo] = React.useState<string>(() => todayIso());

    const derivedWeekKey = React.useMemo(() => {
        const date = new Date(`${weekDate}T00:00:00`);
        return toWeekKey(date);
    }, [weekDate]);

    const [runWeekKey, setRunWeekKey] = React.useState<string>(() => toWeekKey(today));
    const [runFrom, setRunFrom] = React.useState<string>(from);
    const [runTo, setRunTo] = React.useState<string>(to);

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
    const weekDetailsQuery = useWorkoutWeekView(tab === "week" ? runWeekKey : null, {
        fields: null,
        fillMissingDays: true,
        includeRollups: false,
        includeSleep: true,
        includeTraining: true,
        includeSummaries: true,
        includeTotals: false,
        includeTypes: false,
        includeRaw: false,
    });
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
        const date = new Date(`${weekDate}T00:00:00`);
        return `${format(startOfISOWeek(date), "MMM d, yyyy")} → ${format(endOfISOWeek(date), "MMM d, yyyy")}`;
    }, [weekDate]);

    function goPrevWeek() {
        const date = new Date(`${weekDate}T00:00:00`);
        setWeekDate(format(addWeeks(date, -1), "yyyy-MM-dd"));
    }

    function goNextWeek() {
        const date = new Date(`${weekDate}T00:00:00`);
        setWeekDate(format(addWeeks(date, 1), "yyyy-MM-dd"));
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
    const hasMediaCountPerType = extracted.bySessionType.some((row) => {
        const mediaCount = (row as { mediaCount?: unknown }).mediaCount;
        return typeof mediaCount === "number";
    });

    return (
        <AppPage title={t("pages.weeks.title")} subtitle={t("pages.weeks.subtitle")} maxWidth="lg">
            <AppToolbar>
                <AppResponsiveTabs
                    value={tab}
                    onChange={(nextValue) => setTab(nextValue as Tab)}
                    ariaLabel={t("pages.weeks.title")}
                    tabs={[
                        { value: "week", label: t("tabs.week") },
                        { value: "range", label: t("tabs.range") },
                    ]}
                    sx={{ width: { xs: "100%", sm: "auto" }, borderBottom: 0 }}
                />

                {tab === "week" ? (
                    <>
                        <TextField
                            label={t("week.pickDateInWeek")}
                            type="date"
                            size="small"
                            value={weekDate}
                            onChange={(event) => setWeekDate(event.target.value)}
                            sx={{ width: { xs: "100%", sm: 190 } }}
                        />
                        <Button sx={{ fontSize: { xs: "0.8rem", md: "1rem" } }} variant="outlined" onClick={goPrevWeek} disabled={isFetching}>
                            {t("week.prev")}
                        </Button>
                        <Button sx={{ fontSize: { xs: "0.8rem", md: "1rem" } }} variant="outlined" onClick={goNextWeek} disabled={isFetching}>
                            {t("week.next")}
                        </Button>
                        <Chip label={`${t("week.selectedWeekKey")}: ${derivedWeekKey}`} variant="outlined" />
                        <Chip label={`${t("week.weekRange")}: ${weekRangeLabel}`} variant="outlined" />
                        <Chip label={`${t("week.loaded")}: ${runWeekKey}`} color="primary" variant="outlined" />
                        <Button variant="text" onClick={() => jumpToWeekKey(runWeekKey)} disabled={isFetching}>
                            {t("weeks.sync")}
                        </Button>
                    </>
                ) : (
                    <>
                        <TextField
                            label={t("common.from")}
                            type="date"
                            size="small"
                            value={from}
                            onChange={(event) => setFrom(event.target.value)}
                            sx={{ width: { xs: "48%", sm: 190 } }}
                        />
                        <TextField
                            label={t("common.to")}
                            type="date"
                            size="small"
                            value={to}
                            onChange={(event) => setTo(event.target.value)}
                            sx={{ width: { xs: "48%", sm: 190 } }}
                        />
                        <Chip label={`${t("week.loaded")}: ${runFrom} → ${runTo}`} color="primary" variant="outlined" />
                    </>
                )}
            </AppToolbar>

            <AppCard>
                {!active.data && !active.isFetching && !active.isError ? (
                    <AppEmptyState title={t("weeks.empty.title")} description={t("weeks.empty.desc")} variant="inline" />
                ) : null}

                {active.isFetching ? (
                    <Typography variant="body2" color="text.secondary">
                        {t("common.fetching")}
                    </Typography>
                ) : null}

                {active.isError ? <JsonDetails title={t("common.errorTitle")} data={active.error} defaultOpen /> : null}

                {showEmptyForZero ? <AppEmptyState title={t("weeks.empty.title")} description={t("weeks.empty.desc")} /> : null}

                {tab === "week" && weekQuery.isSuccess && weekData && !showEmptyForZero ? (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 1.5, md: 2 } }}>
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
                            <AppMetricCard label={t("weeks.kpi.days")} value={formatStatValue(extracted.kpis.daysCount)} compact />
                            <AppMetricCard label={t("weeks.kpi.sessions")} value={formatStatValue(extracted.kpis.sessionsCount)} compact />
                            <AppMetricCard label={t("weeks.kpi.durationMin")} value={formatStatValue(extracted.kpis.durationMinutes)} compact />
                            <AppMetricCard label={t("weeks.kpi.activeKcal")} value={formatStatValue(extracted.kpis.activeKcal)} compact />
                            <AppMetricCard label={t("weeks.kpi.media")} value={formatStatValue(extracted.kpis.mediaCount)} compact />
                            <AppMetricCard label={t("weeks.kpi.sleepDays")} value={formatStatValue(extracted.kpis.sleepDays)} compact />
                            <AppMetricCard label={t("weeks.kpi.sleepAvgMin")} value={formatStatValue(extracted.kpis.sleepAvgTotal)} compact />
                            <AppMetricCard label={t("weeks.kpi.sleepScore")} value={formatStatValue(extracted.kpis.sleepAvgScore)} compact />
                            <AppMetricCard label={t("weeks.kpi.sleepAvgRemMin")} value={formatStatValue(extracted.kpis.sleepAvgRem)} compact />
                            <AppMetricCard label={t("weeks.kpi.sleepAvgDeepMin")} value={formatStatValue(extracted.kpis.sleepAvgDeep)} compact />
                            <AppMetricCard
                                label={t("weeks.kpi.hr")}
                                value={`${formatStatValue(extracted.kpis.avgHr)} / ${formatStatValue(extracted.kpis.maxHr)}`}
                                compact
                            />
                        </Box>

                        {extracted.bySessionType.length > 0 ? (
                            <AppCard title={t("weeks.byType.title")} padding="sm">
                                <TableContainer sx={{ overflowX: "auto" }}>
                                    <Table size="small" sx={{ minWidth: 620 }}>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>{t("weeks.byType.type")}</TableCell>
                                                <TableCell align="right">{t("weeks.byType.sessions")}</TableCell>
                                                <TableCell align="right">{t("weeks.byType.durationMin")}</TableCell>
                                                <TableCell align="right">{t("weeks.byType.kcal")}</TableCell>
                                                {hasMediaCountPerType ? (
                                                    <TableCell align="right">{t("weeks.byType.media")}</TableCell>
                                                ) : null}
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {extracted.bySessionType.map((row, index) => (
                                                <TableRow key={`${row.sessionType}-${index}`}>
                                                    <TableCell>{row.sessionType}</TableCell>
                                                    <TableCell align="right">{formatStatValue(row.sessionsCount)}</TableCell>
                                                    <TableCell align="right">{formatStatValue(row.durationMinutes)}</TableCell>
                                                    <TableCell align="right">{formatStatValue(row.activeKcal)}</TableCell>
                                                    {hasMediaCountPerType ? (
                                                        <TableCell align="right">
                                                            {formatStatValue((row as { mediaCount?: unknown }).mediaCount ?? "—")}
                                                        </TableCell>
                                                    ) : null}
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </AppCard>
                        ) : null}

                        <WeekSleepByDayTable
                            days={weekDetailsQuery.data?.days ?? []}
                            loading={weekDetailsQuery.isLoading}
                            hasError={weekDetailsQuery.isError}
                            lang={lang}
                            t={t}
                        />

                        <JsonDetails title={t("weeks.json.weekTitle")} data={weekQuery.data} />
                    </Box>
                ) : null}

                {tab === "range" && rangeQuery.isSuccess ? (
                    <JsonDetails title={t("weeks.json.rangeTitle")} data={rangeQuery.data} />
                ) : null}
            </AppCard>
        </AppPage>
    );
}

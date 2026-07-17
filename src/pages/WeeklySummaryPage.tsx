// src/pages/WeeklySummaryPage.tsx
// Period summary page for monthly comparisons, weekly summaries, and custom ranges.

import * as React from "react";
import {
    addMonths,
    addWeeks,
    differenceInCalendarDays,
    endOfISOWeek,
    format,
    startOfISOWeek,
    subMonths,
} from "date-fns";
import { toast } from "sonner";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { JsonDetails } from "@/components/JsonDetails";
import {
    AppCard,
    AppEmptyState,
    AppPage,
    AppResponsiveTabs,
    AppToolbar,
} from "@/components/mui";
import { MonthComparisonCard } from "@/components/weeklySummary/MonthComparisonCard";
import { MonthWeekBreakdownTable } from "@/components/weeklySummary/MonthWeekBreakdownTable";
import { SessionTypeSummaryTable } from "@/components/weeklySummary/SessionTypeSummaryTable";
import { WeekDayDetailsCard } from "@/components/weeklySummary/WeekDayDetailsCard";
import { WeekSummaryOverview } from "@/components/weeklySummary/WeekSummaryOverview";
import { useI18n } from "@/i18n/I18nProvider";
import { useRangeSummary } from "@/hooks/useRangeSummary";
import { useWeekSummary } from "@/hooks/useWeekSummary";
import { useWorkoutCalendar } from "@/hooks/useWorkoutCalendar";
import { useWorkoutWeekView } from "@/hooks/useWorkoutWeekView";
import { formatMonthLabel, getMonthRange } from "@/utils/summaryPeriods/monthlySummary";
import { toWeekKey, weekKeyToStartDate } from "@/utils/weekKey";
import { extractWeekKpis } from "@/utils/summaryPeriods/weeksExplorer";

type PeriodTab = "month" | "week" | "range";
type UnknownRecord = Record<string, unknown>;

const DETAILS_QUERY_OPTIONS = {
    fields: null,
    fillMissingDays: true,
    includeRollups: false,
    includeSleep: true,
    includeTraining: true,
    includeSummaries: true,
    includeTotals: false,
    includeTypes: false,
    includeRaw: false,
} as const;

function isRecord(value: unknown): value is UnknownRecord {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function todayIso(): string {
    return format(new Date(), "yyyy-MM-dd");
}

function getDaysCountFromSummary(data: unknown): number | null {
    if (!isRecord(data)) return null;

    const daysCount = data.daysCount;
    return typeof daysCount === "number" && Number.isFinite(daysCount) ? daysCount : null;
}

function parseMonthValue(monthValue: string): Date | null {
    if (!/^\d{4}-\d{2}$/.test(monthValue)) return null;

    const date = new Date(`${monthValue}-01T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
}

function getInclusiveRangeDaysCount(from: string, to: string): number | undefined {
    const fromDate = new Date(`${from}T00:00:00`);
    const toDate = new Date(`${to}T00:00:00`);

    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) return undefined;
    if (toDate.getTime() < fromDate.getTime()) return undefined;

    return differenceInCalendarDays(toDate, fromDate) + 1;
}

export function WeeklySummaryPage() {
    const { t, lang } = useI18n();
    const today = React.useMemo(() => new Date(), []);

    const [tab, setTab] = React.useState<PeriodTab>("month");

    const [monthValue, setMonthValue] = React.useState<string>(() => format(today, "yyyy-MM"));
    const [comparisonMonthValue, setComparisonMonthValue] = React.useState<string>(() => format(subMonths(today, 1), "yyyy-MM"));

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

    const monthRange = React.useMemo(() => getMonthRange(monthValue), [monthValue]);
    const comparisonMonthRange = React.useMemo(
        () => getMonthRange(comparisonMonthValue),
        [comparisonMonthValue],
    );

    const monthSummaryQuery = useRangeSummary(
        tab === "month" ? monthRange?.from ?? "" : "",
        tab === "month" ? monthRange?.to ?? "" : "",
    );
    const monthDetailsQuery = useWorkoutCalendar({
        from: tab === "month" ? monthRange?.from ?? "" : "",
        to: tab === "month" ? monthRange?.to ?? "" : "",
        ...DETAILS_QUERY_OPTIONS,
    });

    const comparisonSummaryQuery = useRangeSummary(
        tab === "month" ? comparisonMonthRange?.from ?? "" : "",
        tab === "month" ? comparisonMonthRange?.to ?? "" : "",
    );
    const comparisonDetailsQuery = useWorkoutCalendar({
        from: tab === "month" ? comparisonMonthRange?.from ?? "" : "",
        to: tab === "month" ? comparisonMonthRange?.to ?? "" : "",
        ...DETAILS_QUERY_OPTIONS,
    });

    const weekQuery = useWeekSummary(tab === "week" ? runWeekKey : "");
    const weekDetailsQuery = useWorkoutWeekView(
        tab === "week" ? runWeekKey : null,
        DETAILS_QUERY_OPTIONS,
    );

    const rangeQuery = useRangeSummary(
        tab === "range" ? runFrom : "",
        tab === "range" ? runTo : "",
    );
    const rangeDetailsQuery = useWorkoutCalendar({
        from: tab === "range" ? runFrom : "",
        to: tab === "range" ? runTo : "",
        ...DETAILS_QUERY_OPTIONS,
    });

    React.useEffect(() => {
        if (monthSummaryQuery.isError) toast.error(monthSummaryQuery.error.message);
    }, [monthSummaryQuery.isError, monthSummaryQuery.error]);

    React.useEffect(() => {
        if (comparisonSummaryQuery.isError) toast.error(comparisonSummaryQuery.error.message);
    }, [comparisonSummaryQuery.isError, comparisonSummaryQuery.error]);

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

    const rangeDaysCount = React.useMemo(
        () => getInclusiveRangeDaysCount(runFrom, runTo),
        [runFrom, runTo],
    );

    const currentMonthLabel = formatMonthLabel(monthValue, lang);
    const comparisonMonthLabel = formatMonthLabel(comparisonMonthValue, lang);

    function updateSelectedMonth(nextMonthValue: string): void {
        const parsed = parseMonthValue(nextMonthValue);
        if (!parsed) return;

        setMonthValue(nextMonthValue);
        setComparisonMonthValue(format(subMonths(parsed, 1), "yyyy-MM"));
    }

    function goPrevMonth(): void {
        const parsed = parseMonthValue(monthValue);
        if (!parsed) return;

        updateSelectedMonth(format(addMonths(parsed, -1), "yyyy-MM"));
    }

    function goNextMonth(): void {
        const parsed = parseMonthValue(monthValue);
        if (!parsed) return;

        updateSelectedMonth(format(addMonths(parsed, 1), "yyyy-MM"));
    }

    function goPrevWeek(): void {
        const date = new Date(`${weekDate}T00:00:00`);
        setWeekDate(format(addWeeks(date, -1), "yyyy-MM-dd"));
    }

    function goNextWeek(): void {
        const date = new Date(`${weekDate}T00:00:00`);
        setWeekDate(format(addWeeks(date, 1), "yyyy-MM-dd"));
    }

    function jumpToWeekKey(weekKey: string): void {
        const start = weekKeyToStartDate(weekKey);
        if (!start) return;
        setWeekDate(format(start, "yyyy-MM-dd"));
    }

    const monthSummaryData = monthSummaryQuery.data ?? null;
    const monthExtracted = React.useMemo(
        () => extractWeekKpis(monthSummaryData),
        [monthSummaryData],
    );
    const comparisonExtracted = React.useMemo(
        () => extractWeekKpis(comparisonSummaryQuery.data ?? null),
        [comparisonSummaryQuery.data],
    );

    const monthDaysCount = getDaysCountFromSummary(monthSummaryData);
    const showMonthEmpty = monthSummaryQuery.isSuccess && monthDaysCount === 0;
    const monthIsFetching = monthSummaryQuery.isFetching || monthDetailsQuery.isFetching;
    const comparisonIsFetching = comparisonSummaryQuery.isFetching || comparisonDetailsQuery.isFetching;

    const activeSummaryData = tab === "week"
        ? weekQuery.data ?? null
        : tab === "range"
            ? rangeQuery.data ?? null
            : null;
    const activeSummaryFetching = tab === "week" ? weekQuery.isFetching : rangeQuery.isFetching;
    const activeSummaryError = tab === "week" ? weekQuery.error : rangeQuery.error;
    const activeSummaryIsError = tab === "week" ? weekQuery.isError : rangeQuery.isError;
    const activeSummaryIsSuccess = tab === "week" ? weekQuery.isSuccess : rangeQuery.isSuccess;
    const activeDetails = tab === "week" ? weekDetailsQuery : rangeDetailsQuery;
    const activeExtracted = React.useMemo(
        () => extractWeekKpis(activeSummaryData),
        [activeSummaryData],
    );
    const activeDaysCount = getDaysCountFromSummary(activeSummaryData);
    const showActiveEmpty = activeSummaryIsSuccess && activeDaysCount === 0;

    return (
        <AppPage title={t("pages.weeks.title")} subtitle={t("pages.weeks.subtitle")} maxWidth="lg">
            <AppToolbar>
                <AppResponsiveTabs
                    value={tab}
                    onChange={(nextValue) => setTab(nextValue as PeriodTab)}
                    ariaLabel={t("pages.weeks.title")}
                    tabs={[
                        { value: "month", label: t("tabs.month") },
                        { value: "week", label: t("tabs.week") },
                        { value: "range", label: t("tabs.range") },
                    ]}
                    sx={{ width: { xs: "100%", sm: "auto" }, borderBottom: 0 }}
                />

                {tab === "month" ? (
                    <>
                        <TextField
                            label={lang === "es" ? "Mes" : "Month"}
                            type="month"
                            size="small"
                            value={monthValue}
                            onChange={(event) => updateSelectedMonth(event.target.value)}
                            sx={{ width: { xs: "100%", sm: 180 } }}
                        />
                        <Button variant="outlined" onClick={goPrevMonth} disabled={monthIsFetching}>
                            {lang === "es" ? "← Mes anterior" : "← Previous month"}
                        </Button>
                        <Button variant="outlined" onClick={goNextMonth} disabled={monthIsFetching}>
                            {lang === "es" ? "Mes siguiente →" : "Next month →"}
                        </Button>
                        <TextField
                            label={lang === "es" ? "Comparar con" : "Compare with"}
                            type="month"
                            size="small"
                            value={comparisonMonthValue}
                            onChange={(event) => setComparisonMonthValue(event.target.value)}
                            sx={{ width: { xs: "100%", sm: 180 } }}
                        />
                        <Chip
                            label={`${currentMonthLabel} vs ${comparisonMonthLabel}`}
                            color="primary"
                            variant="outlined"
                        />
                    </>
                ) : null}

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
                        <Button sx={{ fontSize: { xs: "0.8rem", md: "1rem" } }} variant="outlined" onClick={goPrevWeek} disabled={activeSummaryFetching}>
                            {t("week.prev")}
                        </Button>
                        <Button sx={{ fontSize: { xs: "0.8rem", md: "1rem" } }} variant="outlined" onClick={goNextWeek} disabled={activeSummaryFetching}>
                            {t("week.next")}
                        </Button>
                        <Chip label={`${t("week.selectedWeekKey")}: ${derivedWeekKey}`} variant="outlined" />
                        <Chip label={`${t("week.weekRange")}: ${weekRangeLabel}`} variant="outlined" />
                        <Chip label={`${t("week.loaded")}: ${runWeekKey}`} color="primary" variant="outlined" />
                        <Button variant="text" onClick={() => jumpToWeekKey(runWeekKey)} disabled={activeSummaryFetching}>
                            {t("weeks.sync")}
                        </Button>
                    </>
                ) : null}

                {tab === "range" ? (
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
                ) : null}
            </AppToolbar>

            {tab === "month" ? (
                <AppCard>
                    {!monthSummaryData && !monthSummaryQuery.isFetching && !monthSummaryQuery.isError ? (
                        <AppEmptyState title={t("weeks.empty.title")} description={t("weeks.empty.desc")} variant="inline" />
                    ) : null}

                    {monthSummaryQuery.isFetching ? (
                        <Typography variant="body2" color="text.secondary">
                            {t("common.fetching")}
                        </Typography>
                    ) : null}

                    {monthSummaryQuery.isError ? (
                        <JsonDetails title={t("common.errorTitle")} data={monthSummaryQuery.error} defaultOpen />
                    ) : null}

                    {showMonthEmpty ? (
                        <AppEmptyState title={t("weeks.empty.title")} description={t("weeks.empty.desc")} />
                    ) : null}

                    {monthSummaryQuery.isSuccess && monthSummaryData && !showMonthEmpty ? (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 1.5, md: 2 } }}>
                            <WeekSummaryOverview
                                kpis={monthExtracted.kpis}
                                days={monthDetailsQuery.data?.days ?? []}
                                lang={lang}
                                loading={monthDetailsQuery.isLoading}
                                hasError={monthDetailsQuery.isError}
                                period="month"
                                periodDaysCount={monthRange?.daysCount}
                            />

                            <MonthComparisonCard
                                currentLabel={currentMonthLabel}
                                comparisonLabel={comparisonMonthLabel}
                                currentKpis={monthExtracted.kpis}
                                comparisonKpis={comparisonExtracted.kpis}
                                currentDays={monthDetailsQuery.data?.days ?? []}
                                comparisonDays={comparisonDetailsQuery.data?.days ?? []}
                                lang={lang}
                                loading={monthDetailsQuery.isFetching || comparisonIsFetching}
                                hasError={comparisonSummaryQuery.isError || comparisonDetailsQuery.isError}
                            />

                            <MonthWeekBreakdownTable
                                days={monthDetailsQuery.data?.days ?? []}
                                lang={lang}
                                loading={monthDetailsQuery.isLoading}
                                hasError={monthDetailsQuery.isError}
                            />

                            <SessionTypeSummaryTable rows={monthExtracted.bySessionType} t={t} />

                            <JsonDetails
                                title={t("weeks.json.monthTitle")}
                                data={{
                                    selectedMonth: monthSummaryData,
                                    comparisonMonth: comparisonSummaryQuery.data ?? null,
                                }}
                            />
                        </Box>
                    ) : null}
                </AppCard>
            ) : (
                <AppCard>
                    {!activeSummaryData && !activeSummaryFetching && !activeSummaryIsError ? (
                        <AppEmptyState title={t("weeks.empty.title")} description={t("weeks.empty.desc")} variant="inline" />
                    ) : null}

                    {activeSummaryFetching ? (
                        <Typography variant="body2" color="text.secondary">
                            {t("common.fetching")}
                        </Typography>
                    ) : null}

                    {activeSummaryIsError ? (
                        <JsonDetails title={t("common.errorTitle")} data={activeSummaryError} defaultOpen />
                    ) : null}

                    {showActiveEmpty ? (
                        <AppEmptyState title={t("weeks.empty.title")} description={t("weeks.empty.desc")} />
                    ) : null}

                    {activeSummaryIsSuccess && activeSummaryData && !showActiveEmpty ? (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 1.5, md: 2 } }}>
                            <WeekSummaryOverview
                                kpis={activeExtracted.kpis}
                                days={activeDetails.data?.days ?? []}
                                lang={lang}
                                loading={activeDetails.isLoading}
                                hasError={activeDetails.isError}
                                period={tab}
                                periodDaysCount={tab === "week" ? 7 : rangeDaysCount}
                            />

                            <WeekDayDetailsCard
                                days={activeDetails.data?.days ?? []}
                                loading={activeDetails.isLoading}
                                hasError={activeDetails.isError}
                                lang={lang}
                                t={t}
                                period={tab}
                            />

                            <SessionTypeSummaryTable rows={activeExtracted.bySessionType} t={t} />

                            <JsonDetails
                                title={tab === "week" ? t("weeks.json.weekTitle") : t("weeks.json.rangeTitle")}
                                data={activeSummaryData}
                            />
                        </Box>
                    ) : null}
                </AppCard>
            )}
        </AppPage>
    );
}

// src/pages/PlanVsActualPage.tsx
// MUI Plan vs Real page. Keeps usePlanVsActual and backend contract unchanged.

import * as React from "react";
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

import type { ApiError } from "@/api/httpErrors";
import { JsonDetails } from "@/components/JsonDetails";
import { AppCard, AppEmptyState, AppMetricCard, AppPage, AppToolbar } from "@/components/mui";
import { usePlanVsActual } from "@/hooks/usePlanVsActual";
import { useI18n } from "@/i18n/I18nProvider";
import { toWeekKey, weekKeyToStartDate } from "@/utils/weekKey";

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
    gymCheck?: GymCheckSummary;
};

type PlanVsActualResponse = {
    weekKey: string;
    range: { from: string; to: string };
    hasRoutineTemplate: boolean;
    days: PvaDay[];
};

type PvaStatusKey =
    | "pva.status.done"
    | "pva.status.rest"
    | "pva.status.missed"
    | "pva.status.extra"
    | "pva.status.unknown";

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function isStringArray(value: unknown): value is string[] {
    return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isGymCheckSummary(value: unknown): value is GymCheckSummary {
    if (!isRecord(value)) return false;

    const durationMin = value.durationMin;
    const notes = value.notes;
    const totalPlannedExercises = value.totalPlannedExercises;
    const doneExercises = value.doneExercises;
    const hasAnyCheck = value.hasAnyCheck;

    return (
        (durationMin === null || typeof durationMin === "number") &&
        (notes === null || typeof notes === "string") &&
        typeof totalPlannedExercises === "number" &&
        typeof doneExercises === "number" &&
        typeof hasAnyCheck === "boolean"
    );
}

function isPvaDay(value: unknown): value is PvaDay {
    if (!isRecord(value)) return false;

    const planned = value.planned;
    const actual = value.actual;
    const gymCheck = value.gymCheck;

    const plannedOk =
        planned === null ||
        (isRecord(planned) &&
            (planned.sessionType === null || typeof planned.sessionType === "string") &&
            (planned.focus === null || typeof planned.focus === "string") &&
            (planned.tags === null || isStringArray(planned.tags)));

    const actualOk =
        actual === null ||
        (isRecord(actual) &&
            Array.isArray(actual.sessions) &&
            actual.sessions.every(
                (session) =>
                    isRecord(session) &&
                    typeof session.id === "string" &&
                    typeof session.type === "string"
            ));

    const gymCheckOk = gymCheck === undefined || isGymCheckSummary(gymCheck);

    return (
        typeof value.date === "string" &&
        typeof value.dayKey === "string" &&
        plannedOk &&
        actualOk &&
        typeof value.status === "string" &&
        gymCheckOk
    );
}

function isPlanVsActualResponse(value: unknown): value is PlanVsActualResponse {
    if (!isRecord(value)) return false;
    if (typeof value.weekKey !== "string") return false;
    if (!isRecord(value.range)) return false;
    if (typeof value.range.from !== "string" || typeof value.range.to !== "string") return false;
    if (typeof value.hasRoutineTemplate !== "boolean") return false;
    if (!Array.isArray(value.days)) return false;

    return value.days.every(isPvaDay);
}

function toastApiError(error: unknown, fallback: string) {
    const maybeApiError = error as Partial<ApiError> | undefined;
    const message = maybeApiError?.message ?? fallback;
    const details = maybeApiError?.details ? JSON.stringify(maybeApiError.details, null, 2) : undefined;
    toast.error(message, { description: details });
}

function statusKey(status: string): PvaStatusKey {
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

function statusColor(status: string): "success" | "default" | "warning" | "primary" {
    if (status === "done") return "success";
    if (status === "missed") return "warning";
    if (status === "extra") return "primary";
    return "default";
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

function formatNumber(value: number): string {
    return Number(value.toFixed(2)).toString();
}

export function PlanVsActualPage() {
    const { t, lang } = useI18n();
    const today = React.useMemo(() => new Date(), []);

    const [weekDate, setWeekDate] = React.useState(() => format(today, "yyyy-MM-dd"));
    const derivedWeekKey = React.useMemo(() => {
        const date = new Date(`${weekDate}T00:00:00`);
        return toWeekKey(date);
    }, [weekDate]);

    const [runWeekKey, setRunWeekKey] = React.useState(() => toWeekKey(today));
    const query = usePlanVsActual(runWeekKey);
    const lastRunRef = React.useRef<string>("");
    const didMountRef = React.useRef(false);

    React.useEffect(() => {
        if (query.isError) toastApiError(query.error, t("pva.toast.loadFail"));
    }, [query.isError, query.error, t]);

    React.useEffect(() => {
        if (!query.isSuccess) return;
        if (lastRunRef.current === `week:${runWeekKey}`) toast.success(t("pva.toast.loaded"));
    }, [query.isSuccess, runWeekKey, t]);

    React.useEffect(() => {
        if (!didMountRef.current) {
            didMountRef.current = true;
            setRunWeekKey(derivedWeekKey);
            lastRunRef.current = "";
            return;
        }

        const handle = window.setTimeout(() => {
            setRunWeekKey(derivedWeekKey);
            lastRunRef.current = `week:${derivedWeekKey}`;
        }, 450);

        return () => window.clearTimeout(handle);
    }, [derivedWeekKey]);

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

    function syncToLoadedWeek() {
        const start = weekKeyToStartDate(runWeekKey);
        if (!start) return;
        setWeekDate(format(start, "yyyy-MM-dd"));
    }

    function refetch() {
        lastRunRef.current = `week:${runWeekKey}`;
        void query.refetch();
    }

    const pva = React.useMemo<PlanVsActualResponse | null>(() => {
        return isPlanVsActualResponse(query.data) ? query.data : null;
    }, [query.data]);

    const summary = React.useMemo(() => {
        if (!pva) return null;

        const total = pva.days.length;
        const done = pva.days.filter((day) => day.status === "done").length;
        const rest = pva.days.filter((day) => day.status === "rest").length;
        const extra = pva.days.filter((day) => day.status === "extra").length;
        const plannedCount = pva.days.filter(
            (day) => day.planned?.sessionType || day.planned?.focus || (day.planned?.tags?.length ?? 0) > 0
        ).length;
        const actualSessions = pva.days.reduce((acc, day) => acc + (day.actual?.sessions.length ?? 0), 0);
        const gymCheckedDays = pva.days.filter((day) => day.gymCheck?.hasAnyCheck).length;

        return { total, done, rest, extra, plannedCount, actualSessions, gymCheckedDays };
    }, [pva]);

    const shouldShowEmpty =
        Boolean(pva) && query.isSuccess && !query.isFetching && isPlanVsActualResponse(query.data) && (pva?.days.length ?? 0) === 0;

    return (
        <AppPage
            title={t("pages.pva.title")}
            subtitle="Aquí se ve lo planeado en Rutinas vs lo Real en Gym"
            maxWidth="xl"
            actions={
                <Button variant="outlined" onClick={refetch} disabled={query.isFetching}>
                    {t("common.refetch")}
                </Button>
            }
        >
            <AppToolbar>
                <TextField
                    label={t("pva.pickDateInWeek")}
                    type="date"
                    size="small"
                    value={weekDate}
                    onChange={(event) => setWeekDate(event.target.value)}
                    sx={{ width: { xs: "100%", sm: 190 } }}
                />
                <Button sx={{ fontSize: { xs: "0.8rem", md: "1rem" } }} variant="outlined" onClick={goPrevWeek} disabled={query.isFetching}>
                    ← {t("pva.prevWeek")}
                </Button>
                <Button sx={{ fontSize: { xs: "0.8rem", md: "1rem" } }} variant="outlined" onClick={goNextWeek} disabled={query.isFetching}>
                    {t("pva.nextWeek")} →
                </Button>
                <Chip sx={{ fontSize: { xs: "0.63rem", md: "1rem" } }} label={`${t("pva.selected")}: ${derivedWeekKey}`} variant="outlined" />
                <Chip sx={{ fontSize: { xs: "0.63rem", md: "1rem" } }} label={weekRangeLabel} variant="outlined" />
                <Chip sx={{ fontSize: { xs: "0.63rem", md: "1rem" } }} label={`${t("pva.loaded")}: ${runWeekKey}`} color="primary" variant="outlined" />
                <Button variant="text" onClick={syncToLoadedWeek} disabled={query.isFetching}>
                    {t("pva.sync")}
                </Button>
            </AppToolbar>

            {query.isFetching ? (
                <AppCard>
                    <Typography variant="body2" color="text.secondary">
                        {t("common.fetching")}
                    </Typography>
                </AppCard>
            ) : null}

            {query.isError ? <JsonDetails title={t("pva.error.jsonTitle")} data={query.error} defaultOpen /> : null}

            {!query.isFetching && query.isSuccess && !pva ? (
                <AppEmptyState
                    title={lang === "es" ? "No se pudo interpretar la respuesta" : "Could not interpret response"}
                    description={lang === "es" ? "Mostrando JSON de depuración." : "Showing debug JSON."}
                />
            ) : null}

            {shouldShowEmpty ? <AppEmptyState title={t("pva.empty.title")} description={t("pva.empty.desc")} /> : null}

            {pva && summary && !shouldShowEmpty ? (
                <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 1.5, md: 2 } }}>
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: {
                                xs: "repeat(2, minmax(0, 1fr))",
                                md: "repeat(4, minmax(0, 1fr))",
                                lg: "repeat(7, minmax(0, 1fr))",
                            },
                            gap: { xs: 1, md: 1.5 },
                        }}
                    >
                        <AppMetricCard label={t("pva.stats.days")} value={formatNumber(summary.total)} compact />
                        <AppMetricCard label={t("pva.stats.planned")} value={formatNumber(summary.plannedCount)} compact />
                        <AppMetricCard label={t("pva.stats.actualSessions")} value={formatNumber(summary.actualSessions)} compact />
                        <AppMetricCard label="Gym Check" value={formatNumber(summary.gymCheckedDays)} compact />
                        <AppMetricCard label={t("pva.stats.done")} value={formatNumber(summary.done)} compact />
                        <AppMetricCard label={t("pva.stats.rest")} value={formatNumber(summary.rest)} compact />
                        <AppMetricCard label={t("pva.stats.extra")} value={formatNumber(summary.extra)} compact />
                    </Box>

                    <AppCard padding="none">
                        <TableContainer sx={{ overflowX: "auto" }}>
                            <Table size="small" sx={{ minWidth: 920 }}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>{t("pva.table.day")}</TableCell>
                                        <TableCell>{t("pva.table.date")}</TableCell>
                                        <TableCell>{t("pva.table.plan")}</TableCell>
                                        <TableCell>Gym Check</TableCell>
                                        <TableCell>{t("pva.table.actual")}</TableCell>
                                        <TableCell align="right">{t("pva.table.status")}</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {pva.days.map((day) => {
                                        const planned = day.planned;
                                        const plannedText = planned
                                            ? [
                                                planned.sessionType ? `${t("pva.plan.type")}: ${planned.sessionType}` : null,
                                                planned.focus ? `${t("pva.plan.focus")}: ${planned.focus}` : null,
                                                planned.tags?.length ? `${t("pva.plan.tags")}: ${planned.tags.join(", ")}` : null,
                                            ]
                                                .filter((piece): piece is string => typeof piece === "string")
                                                .join(" • ")
                                            : "";

                                        const gymText = formatGymSummary(day.gymCheck, lang);
                                        const actualCount = day.actual?.sessions.length ?? 0;
                                        const actualText =
                                            actualCount === 0
                                                ? t("common.noDataDash")
                                                : day.actual?.sessions.map((session) => session.type).join(", ") ?? t("common.noDataDash");

                                        return (
                                            <TableRow key={day.date}>
                                                <TableCell sx={{ fontWeight: 750, whiteSpace: "nowrap" }}>{day.dayKey}</TableCell>
                                                <TableCell sx={{ fontFamily: "monospace", whiteSpace: "nowrap" }}>{day.date}</TableCell>
                                                <TableCell sx={{ minWidth: 230 }}>
                                                    {plannedText || <Typography color="text.secondary">{t("common.noDataDash")}</Typography>}
                                                </TableCell>
                                                <TableCell sx={{ minWidth: 180 }}>
                                                    {gymText ? (
                                                        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                                                            <Typography variant="body2" sx={{ fontFamily: "monospace", fontWeight: 700 }}>
                                                                {gymText.headline}
                                                            </Typography>
                                                            {gymText.notes ? (
                                                                <Typography variant="caption" color="text.secondary" title={gymText.notes} noWrap>
                                                                    {gymText.notes}
                                                                </Typography>
                                                            ) : null}
                                                        </Box>
                                                    ) : (
                                                        <Typography color="text.secondary">{t("common.noDataDash")}</Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell sx={{ minWidth: 240 }}>
                                                    {actualCount > 0 ? (
                                                        <Typography>
                                                            {actualCount} {t("pva.actual.sessionSuffix")} • {actualText}
                                                        </Typography>
                                                    ) : (
                                                        <Typography color="text.secondary">{t("common.noDataDash")}</Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Chip
                                                        size="small"
                                                        color={statusColor(day.status)}
                                                        variant="outlined"
                                                        label={t(statusKey(day.status))}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </AppCard>

                    <JsonDetails title={t("pva.debug.responseTitle")} data={query.data} />
                </Box>
            ) : null}
        </AppPage>
    );
}

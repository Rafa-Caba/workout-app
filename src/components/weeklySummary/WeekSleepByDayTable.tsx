// src/components/weeklySummary/WeekSleepByDayTable.tsx
// Weekly sleep-detail table shared by the web weekly summary page.

import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";

import { AppCard } from "@/components/mui";
import type { I18nKey } from "@/i18n/translations";
import type { CalendarDayFull, WorkoutSession } from "@/types/workoutDay.types";
import { calcSleepEfficiencyPct } from "@/utils/dayExplorer";
import { minutesToHhMm } from "@/utils/dashboard/format";

type Props = {
    days: readonly CalendarDayFull[];
    loading: boolean;
    hasError: boolean;
    lang: "es" | "en";
    t: (key: I18nKey) => string;
};

type SleepDayRow = {
    date: string;
    totalMinutes: number | null;
    score: number | null;
    efficiencyPct: number | null;
    readiness: number | null;
    remPct: number | null;
    deepPct: number | null;
    coreMinutes: number | null;
    awakeMinutes: number | null;
    source: string | null;
    sourceDevice: string | null;
};

function isFiniteNumber(value: unknown): value is number {
    return typeof value === "number" && Number.isFinite(value);
}

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

function computeAverageRpe(sessions: readonly WorkoutSession[]): number | null {
    const values = sessions
        .map((session) => session.effortRpe)
        .filter(isFiniteNumber);

    if (values.length === 0) return null;

    const average = values.reduce((sum, value) => sum + value, 0) / values.length;
    return Math.round(average * 10) / 10;
}

function computeReadiness(sleepScore: number | null, dayRpe: number | null): number | null {
    if (!isFiniteNumber(sleepScore)) return null;

    let readiness = sleepScore;

    if (isFiniteNumber(dayRpe)) {
        readiness += dayRpe >= 6 ? -(dayRpe - 5) * 6 : (5 - dayRpe) * 2;
    }

    return Math.round(clamp(readiness, 0, 100));
}

function computeStagePercent(stageMinutes: number | null, totalMinutes: number | null): number | null {
    if (!isFiniteNumber(stageMinutes) || !isFiniteNumber(totalMinutes) || totalMinutes <= 0) {
        return null;
    }

    return Math.round((stageMinutes / totalMinutes) * 100);
}

function formatMinutes(value: number | null): string {
    return isFiniteNumber(value) && value > 0 ? minutesToHhMm(value) : "—";
}

function formatNumber(value: number | null): string {
    return isFiniteNumber(value) ? String(Math.round(value * 100) / 100) : "—";
}

function formatPercent(value: number | null): string {
    return isFiniteNumber(value) ? `${Math.round(value)}%` : "—";
}

function formatDayLabel(dateIso: string, lang: "es" | "en"): string {
    const date = new Date(`${dateIso}T00:00:00`);
    if (Number.isNaN(date.getTime())) return dateIso;

    return new Intl.DateTimeFormat(lang === "es" ? "es-MX" : "en-US", {
        weekday: "short",
        day: "numeric",
        month: "short",
    }).format(date);
}

function toSleepDayRow(day: CalendarDayFull): SleepDayRow | null {
    const sleep = day.sleep ?? null;
    const summary = day.sleepSummary ?? null;

    if (!sleep && !summary) return null;

    const totalMinutes = sleep?.timeAsleepMinutes ?? summary?.timeAsleepMinutes ?? null;
    const timeInBedMinutes = sleep?.timeInBedMinutes ?? summary?.timeInBedMinutes ?? null;
    const score = sleep?.score ?? summary?.score ?? null;
    const remMinutes = sleep?.remMinutes ?? summary?.remMinutes ?? null;
    const deepMinutes = sleep?.deepMinutes ?? summary?.deepMinutes ?? null;
    const coreMinutes = sleep?.coreMinutes ?? summary?.coreMinutes ?? null;
    const awakeMinutes = sleep?.awakeMinutes ?? summary?.awakeMinutes ?? null;

    const sessions = Array.isArray(day.training?.sessions) ? day.training.sessions : [];
    const dayRpe = day.trainingSummary?.dayEffortRpe
        ?? day.training?.dayEffortRpe
        ?? computeAverageRpe(sessions);

    return {
        date: day.date ?? "—",
        totalMinutes,
        score,
        efficiencyPct: calcSleepEfficiencyPct(totalMinutes, timeInBedMinutes),
        readiness: computeReadiness(score, dayRpe),
        remPct: computeStagePercent(remMinutes, totalMinutes),
        deepPct: computeStagePercent(deepMinutes, totalMinutes),
        coreMinutes,
        awakeMinutes,
        source: sleep?.source ?? null,
        sourceDevice: sleep?.sourceDevice ?? null,
    };
}

export function WeekSleepByDayTable(props: Props) {
    const { days, loading, hasError, lang, t } = props;

    const rows = days
        .map(toSleepDayRow)
        .filter((row): row is SleepDayRow => row !== null);

    return (
        <AppCard
            title={lang === "es" ? "Sueño por día" : "Sleep by day"}
            subtitle={
                lang === "es"
                    ? "Comparación de los registros de sueño capturados durante la semana."
                    : "Comparison of the sleep records captured during the week."
            }
            padding="sm"
        >
            {loading ? (
                <Typography variant="body2" color="text.secondary">
                    {lang === "es" ? "Cargando sueño semanal…" : "Loading weekly sleep…"}
                </Typography>
            ) : null}

            {!loading && hasError ? (
                <Typography variant="body2" color="error">
                    {lang === "es"
                        ? "No se pudo cargar el detalle diario de sueño."
                        : "The daily sleep detail could not be loaded."}
                </Typography>
            ) : null}

            {!loading && !hasError ? (
                <TableContainer sx={{ overflowX: "auto" }}>
                    <Table size="small" sx={{ minWidth: 1320 }}>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ whiteSpace: "nowrap" }}>📅 {t("common.date")}</TableCell>
                                <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>🛌 {t("days.sleep.total")}</TableCell>
                                <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>🏆 {t("days.sleep.score")}</TableCell>
                                <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>💤 {t("days.sleep.efficiency")}</TableCell>
                                <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>🔁 {t("days.sleep.readiness")}</TableCell>
                                <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>🧠 {t("days.sleep.remPct")}</TableCell>
                                <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>🌙 {t("days.sleep.deepPct")}</TableCell>
                                <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>💤 {t("days.sleep.core")}</TableCell>
                                <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>⏱ {t("days.sleep.awake")}</TableCell>
                                <TableCell sx={{ whiteSpace: "nowrap" }}>📡 {t("days.sleep.source")}</TableCell>
                                <TableCell sx={{ whiteSpace: "nowrap" }}>⌚ {t("days.sleep.sourceDevice")}</TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {rows.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={11} align="center">
                                        {lang === "es"
                                            ? "No hay registros de sueño para esta semana."
                                            : "There are no sleep records for this week."}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                rows.map((row) => (
                                    <TableRow key={row.date} hover>
                                        <TableCell sx={{ fontWeight: 800, whiteSpace: "nowrap" }}>
                                            {formatDayLabel(row.date, lang)}
                                        </TableCell>
                                        <TableCell align="right">{formatMinutes(row.totalMinutes)}</TableCell>
                                        <TableCell align="right">{formatNumber(row.score)}</TableCell>
                                        <TableCell align="right">{formatPercent(row.efficiencyPct)}</TableCell>
                                        <TableCell align="right">{formatNumber(row.readiness)}</TableCell>
                                        <TableCell align="right">{formatPercent(row.remPct)}</TableCell>
                                        <TableCell align="right">{formatPercent(row.deepPct)}</TableCell>
                                        <TableCell align="right">{formatMinutes(row.coreMinutes)}</TableCell>
                                        <TableCell align="right">{formatMinutes(row.awakeMinutes)}</TableCell>
                                        <TableCell sx={{ whiteSpace: "nowrap" }}>{row.source ?? "—"}</TableCell>
                                        <TableCell sx={{ whiteSpace: "nowrap" }}>{row.sourceDevice ?? "—"}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            ) : null}
        </AppCard>
    );
}

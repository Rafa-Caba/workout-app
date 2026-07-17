// src/components/weeklySummary/WeekTrainingByDayTable.tsx
// Daily training-detail table used inside the weekly summary detail tabs.

import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";

import type { I18nKey } from "@/i18n/translations";
import type { CalendarDayFull } from "@/types/workoutDay.types";
import { buildTrainingDayRows, formatWeekDayLabel } from "@/utils/summaryPeriods/weeklySummary";

type Props = {
    days: readonly CalendarDayFull[];
    loading: boolean;
    hasError: boolean;
    lang: "es" | "en";
    t: (key: I18nKey) => string;
};

function isFiniteNumber(value: unknown): value is number {
    return typeof value === "number" && Number.isFinite(value);
}

function formatDuration(seconds: number | null): string {
    if (!isFiniteNumber(seconds) || seconds <= 0) return "—";

    const totalMinutes = Math.round(seconds / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes} min`;
}

function formatRoundedNumber(value: number | null): string {
    return isFiniteNumber(value) ? String(Math.round(value)) : "—";
}

function formatHr(avgHr: number | null, maxHr: number | null): string {
    if (!isFiniteNumber(avgHr) && !isFiniteNumber(maxHr)) return "—";

    return `${formatRoundedNumber(avgHr)} / ${formatRoundedNumber(maxHr)}`;
}

export function WeekTrainingByDayTable(props: Props) {
    const { days, loading, hasError, lang, t } = props;
    const rows = buildTrainingDayRows(days);

    if (loading) {
        return (
            <Typography variant="body2" color="text.secondary">
                {lang === "es" ? "Cargando entrenamiento semanal…" : "Loading weekly training…"}
            </Typography>
        );
    }

    if (hasError) {
        return (
            <Typography variant="body2" color="error">
                {lang === "es"
                    ? "No se pudo cargar el detalle diario de entrenamiento."
                    : "The daily training detail could not be loaded."}
            </Typography>
        );
    }

    return (
        <TableContainer sx={{ overflowX: "auto" }}>
            <Table size="small" sx={{ minWidth: 840 }}>
                <TableHead>
                    <TableRow>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>📅 {t("common.date")}</TableCell>
                        <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>🏋️ {t("weeks.kpi.sessions")}</TableCell>
                        <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>⏱️ {t("weeks.kpi.durationMin")}</TableCell>
                        <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>🔥 {t("weeks.kpi.activeKcal")}</TableCell>
                        <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>❤️ {t("weeks.kpi.hr")}</TableCell>
                        <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>📎 {t("weeks.kpi.media")}</TableCell>
                    </TableRow>
                </TableHead>

                <TableBody>
                    {rows.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} align="center">
                                {lang === "es"
                                    ? "No hay sesiones de entrenamiento para esta semana."
                                    : "There are no training sessions for this week."}
                            </TableCell>
                        </TableRow>
                    ) : (
                        rows.map((row) => (
                            <TableRow key={row.date} hover>
                                <TableCell sx={{ fontWeight: 800, whiteSpace: "nowrap" }}>
                                    {formatWeekDayLabel(row.date, lang)}
                                </TableCell>
                                <TableCell align="right">{row.sessionsCount}</TableCell>
                                <TableCell align="right">{formatDuration(row.durationSeconds)}</TableCell>
                                <TableCell align="right">{formatRoundedNumber(row.activeKcal)}</TableCell>
                                <TableCell align="right">{formatHr(row.avgHr, row.maxHr)}</TableCell>
                                <TableCell align="right">{row.mediaCount}</TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    );
}

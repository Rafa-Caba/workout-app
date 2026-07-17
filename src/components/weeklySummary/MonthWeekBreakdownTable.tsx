// src/components/weeklySummary/MonthWeekBreakdownTable.tsx
// Weekly rollup table for the selected calendar month.

import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";

import { AppCard, AppEmptyState } from "@/components/mui";
import type { CalendarDayFull } from "@/types/workoutDay.types";
import { buildMonthWeekRows } from "@/utils/summaryPeriods/monthlySummary";

type Props = {
    days: readonly CalendarDayFull[];
    lang: "es" | "en";
    loading: boolean;
    hasError: boolean;
};

function formatDuration(seconds: number | null): string {
    if (typeof seconds !== "number" || !Number.isFinite(seconds) || seconds <= 0) return "—";

    const minutes = Math.round(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    return hours > 0 ? `${hours}h ${remainingMinutes}m` : `${minutes} min`;
}

function formatKcal(value: number | null): string {
    return typeof value === "number" && Number.isFinite(value)
        ? Math.round(value).toString()
        : "—";
}

function formatSleepMinutes(value: number | null): string {
    if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return "—";

    const rounded = Math.round(value);
    const hours = Math.floor(rounded / 60);
    const minutes = rounded % 60;

    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes} min`;
}

export function MonthWeekBreakdownTable(props: Props) {
    const { days, lang, loading, hasError } = props;
    const rows = buildMonthWeekRows(days, lang);

    return (
        <AppCard
            title={lang === "es" ? "Distribución por semana" : "Weekly distribution"}
            subtitle={
                lang === "es"
                    ? "Muestra cómo se repartieron el entrenamiento y el sueño dentro del mes."
                    : "See how training and sleep were distributed throughout the month."
            }
            padding="sm"
        >
            {loading ? (
                <Typography variant="body2" color="text.secondary">
                    {lang === "es" ? "Cargando distribución mensual…" : "Loading monthly distribution…"}
                </Typography>
            ) : null}

            {hasError ? (
                <AppEmptyState
                    title={lang === "es" ? "No se pudo cargar el detalle mensual" : "Monthly detail could not be loaded"}
                    description={lang === "es" ? "Intenta volver a cargar el mes." : "Try loading the month again."}
                    variant="inline"
                />
            ) : null}

            {!loading && !hasError && rows.length === 0 ? (
                <AppEmptyState
                    title={lang === "es" ? "Sin datos por semana" : "No weekly data"}
                    description={lang === "es" ? "Este mes todavía no tiene registros." : "This month has no records yet."}
                    variant="inline"
                />
            ) : null}

            {!loading && !hasError && rows.length > 0 ? (
                <TableContainer sx={{ overflowX: "auto" }}>
                    <Table size="small" sx={{ minWidth: 720 }}>
                        <TableHead>
                            <TableRow>
                                <TableCell>{lang === "es" ? "📅 Semana" : "📅 Week"}</TableCell>
                                <TableCell align="right">{lang === "es" ? "🏋️ Sesiones" : "🏋️ Sessions"}</TableCell>
                                <TableCell align="right">{lang === "es" ? "⏱️ Duración" : "⏱️ Duration"}</TableCell>
                                <TableCell align="right">🔥 Kcal</TableCell>
                                <TableCell align="right">{lang === "es" ? "🛏️ Sueño prom" : "🛏️ Avg sleep"}</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {rows.map((row) => (
                                <TableRow key={row.key}>
                                    <TableCell sx={{ fontWeight: 750 }}>{row.label}</TableCell>
                                    <TableCell align="right">{row.sessionsCount}</TableCell>
                                    <TableCell align="right">{formatDuration(row.durationSeconds)}</TableCell>
                                    <TableCell align="right">{formatKcal(row.activeKcal)}</TableCell>
                                    <TableCell align="right">{formatSleepMinutes(row.avgSleepMinutes)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            ) : null}
        </AppCard>
    );
}

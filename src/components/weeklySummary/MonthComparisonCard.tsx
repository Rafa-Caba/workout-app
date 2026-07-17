// src/components/weeklySummary/MonthComparisonCard.tsx
// Side-by-side comparison between the selected month and another month.

import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";

import { AppCard, AppEmptyState } from "@/components/mui";
import type { CalendarDayFull } from "@/types/workoutDay.types";
import { countTrainingDays } from "@/utils/summaryPeriods/monthlySummary";
import type { WeekKpis } from "@/utils/summaryPeriods/weeksExplorer";

type Props = {
    currentLabel: string;
    comparisonLabel: string;
    currentKpis: WeekKpis;
    comparisonKpis: WeekKpis;
    currentDays: readonly CalendarDayFull[];
    comparisonDays: readonly CalendarDayFull[];
    lang: "es" | "en";
    loading: boolean;
    hasError: boolean;
};

type NumberOrDash = number | "—";
type MetricFormat = "integer" | "decimal" | "duration" | "sleepMinutes";
type ChangeFormat = "absolute" | "percent" | "minutes";

type ComparisonMetric = {
    key: string;
    label: string;
    current: NumberOrDash;
    comparison: NumberOrDash;
    format: MetricFormat;
    changeFormat: ChangeFormat;
};

function toFiniteNumber(value: NumberOrDash): number | null {
    return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function formatMinutes(value: number): string {
    const rounded = Math.round(value);
    const hours = Math.floor(rounded / 60);
    const minutes = Math.abs(rounded % 60);

    return hours > 0 ? `${hours}h ${minutes}m` : `${rounded} min`;
}

function formatMetricValue(value: NumberOrDash, formatType: MetricFormat): string {
    const numeric = toFiniteNumber(value);
    if (numeric === null) return "—";

    if (formatType === "duration" || formatType === "sleepMinutes") {
        return formatMinutes(numeric);
    }

    if (formatType === "decimal") {
        return Number(numeric.toFixed(2)).toString();
    }

    return Math.round(numeric).toString();
}

function formatSigned(value: number, maximumDecimals = 0): string {
    const rounded = Number(value.toFixed(maximumDecimals));
    if (rounded > 0) return `+${rounded}`;
    return rounded.toString();
}

function formatChange(metric: ComparisonMetric): string {
    const current = toFiniteNumber(metric.current);
    const comparison = toFiniteNumber(metric.comparison);

    if (current === null || comparison === null) return "—";

    const difference = current - comparison;

    if (metric.changeFormat === "minutes") {
        const rounded = Math.round(difference);
        if (rounded === 0) return "0 min";
        return `${rounded > 0 ? "+" : ""}${rounded} min`;
    }

    if (metric.changeFormat === "percent") {
        const absolute = formatSigned(difference, metric.format === "decimal" ? 2 : 0);
        if (comparison === 0) return absolute;

        const percentage = (difference / Math.abs(comparison)) * 100;
        return `${absolute} (${formatSigned(percentage, 1)}%)`;
    }

    return formatSigned(difference, metric.format === "decimal" ? 2 : 0);
}

function ComparisonTable(props: {
    title: string;
    currentLabel: string;
    comparisonLabel: string;
    metrics: readonly ComparisonMetric[];
    lang: "es" | "en";
}) {
    const { title, currentLabel, comparisonLabel, metrics, lang } = props;

    return (
        <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 850, mb: 1 }}>
                {title}
            </Typography>

            <TableContainer sx={{ overflowX: "auto" }}>
                <Table size="small" sx={{ minWidth: 620 }}>
                    <TableHead>
                        <TableRow>
                            <TableCell>{lang === "es" ? "Métrica" : "Metric"}</TableCell>
                            <TableCell align="right">{currentLabel}</TableCell>
                            <TableCell align="right">{comparisonLabel}</TableCell>
                            <TableCell align="right">{lang === "es" ? "Cambio" : "Change"}</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {metrics.map((metric) => (
                            <TableRow key={metric.key}>
                                <TableCell sx={{ fontWeight: 700 }}>{metric.label}</TableCell>
                                <TableCell align="right">{formatMetricValue(metric.current, metric.format)}</TableCell>
                                <TableCell align="right">{formatMetricValue(metric.comparison, metric.format)}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 800 }}>
                                    {formatChange(metric)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}

export function MonthComparisonCard(props: Props) {
    const {
        currentLabel,
        comparisonLabel,
        currentKpis,
        comparisonKpis,
        currentDays,
        comparisonDays,
        lang,
        loading,
        hasError,
    } = props;

    const trainingMetrics: ComparisonMetric[] = [
        {
            key: "trainingDays",
            label: lang === "es" ? "Días entrenados" : "Training days",
            current: countTrainingDays(currentDays),
            comparison: countTrainingDays(comparisonDays),
            format: "integer",
            changeFormat: "percent",
        },
        {
            key: "sessions",
            label: lang === "es" ? "Sesiones" : "Sessions",
            current: currentKpis.sessionsCount,
            comparison: comparisonKpis.sessionsCount,
            format: "integer",
            changeFormat: "percent",
        },
        {
            key: "duration",
            label: lang === "es" ? "Duración" : "Duration",
            current: currentKpis.durationMinutes,
            comparison: comparisonKpis.durationMinutes,
            format: "duration",
            changeFormat: "percent",
        },
        {
            key: "activeKcal",
            label: lang === "es" ? "Kcal activas" : "Active kcal",
            current: currentKpis.activeKcal,
            comparison: comparisonKpis.activeKcal,
            format: "integer",
            changeFormat: "percent",
        },
        {
            key: "media",
            label: "Media",
            current: currentKpis.mediaCount,
            comparison: comparisonKpis.mediaCount,
            format: "integer",
            changeFormat: "percent",
        },
    ];

    const sleepMetrics: ComparisonMetric[] = [
        {
            key: "sleepDays",
            label: lang === "es" ? "Días con sueño" : "Sleep days",
            current: currentKpis.sleepDays,
            comparison: comparisonKpis.sleepDays,
            format: "integer",
            changeFormat: "absolute",
        },
        {
            key: "sleepAverage",
            label: lang === "es" ? "Sueño promedio" : "Average sleep",
            current: currentKpis.sleepAvgTotal,
            comparison: comparisonKpis.sleepAvgTotal,
            format: "sleepMinutes",
            changeFormat: "minutes",
        },
        {
            key: "sleepScore",
            label: "Sleep Score",
            current: currentKpis.sleepAvgScore,
            comparison: comparisonKpis.sleepAvgScore,
            format: "decimal",
            changeFormat: "absolute",
        },
        {
            key: "remAverage",
            label: lang === "es" ? "REM promedio" : "Average REM",
            current: currentKpis.sleepAvgRem,
            comparison: comparisonKpis.sleepAvgRem,
            format: "sleepMinutes",
            changeFormat: "minutes",
        },
        {
            key: "deepAverage",
            label: lang === "es" ? "Deep promedio" : "Average deep",
            current: currentKpis.sleepAvgDeep,
            comparison: comparisonKpis.sleepAvgDeep,
            format: "sleepMinutes",
            changeFormat: "minutes",
        },
    ];

    return (
        <AppCard
            title={lang === "es" ? "Comparación mensual" : "Monthly comparison"}
            subtitle={
                lang === "es"
                    ? `Compara ${currentLabel} contra ${comparisonLabel}.`
                    : `Compare ${currentLabel} against ${comparisonLabel}.`
            }
            padding="sm"
            tone="accent"
        >
            {loading ? (
                <Typography variant="body2" color="text.secondary">
                    {lang === "es" ? "Cargando comparación…" : "Loading comparison…"}
                </Typography>
            ) : null}

            {hasError ? (
                <AppEmptyState
                    title={lang === "es" ? "No se pudo cargar la comparación" : "Comparison could not be loaded"}
                    description={lang === "es" ? "Prueba con otro mes." : "Try another month."}
                    variant="inline"
                />
            ) : null}

            {!loading && !hasError ? (
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", xl: "repeat(2, minmax(0, 1fr))" },
                        gap: { xs: 2, xl: 2.5 },
                        minWidth: 0,
                    }}
                >
                    <ComparisonTable
                        title={lang === "es" ? "🏋️ Entrenamiento" : "🏋️ Training"}
                        currentLabel={currentLabel}
                        comparisonLabel={comparisonLabel}
                        metrics={trainingMetrics}
                        lang={lang}
                    />
                    <ComparisonTable
                        title={lang === "es" ? "😴 Sueño" : "😴 Sleep"}
                        currentLabel={currentLabel}
                        comparisonLabel={comparisonLabel}
                        metrics={sleepMetrics}
                        lang={lang}
                    />
                </Box>
            ) : null}
        </AppCard>
    );
}

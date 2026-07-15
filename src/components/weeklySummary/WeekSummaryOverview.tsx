// src/components/weeklySummary/WeekSummaryOverview.tsx
// Grouped weekly KPIs and three concise highlights for training and sleep.

import Box from "@mui/material/Box";

import { AppCard, AppMetricCard } from "@/components/mui";
import {
    buildTrainingDayRows,
    formatWeekDayLabel,
    type TrainingDayRow,
} from "@/utils/weeklySummary";
import type { CalendarDayFull } from "@/types/workoutDay.types";
import type { WeekKpis } from "@/utils/weeksExplorer";

type Props = {
    kpis: WeekKpis;
    days: readonly CalendarDayFull[];
    lang: "es" | "en";
    loading: boolean;
    hasError: boolean;
};

type SleepScoreHighlight = {
    date: string;
    score: number;
};

function isFiniteNumber(value: unknown): value is number {
    return typeof value === "number" && Number.isFinite(value);
}

function formatStatValue(value: number | "—"): string {
    if (typeof value === "number" && Number.isFinite(value)) {
        return Number(value.toFixed(2)).toString();
    }

    return "—";
}

function formatDuration(seconds: number | null): string {
    if (!isFiniteNumber(seconds) || seconds <= 0) return "—";

    const minutes = Math.round(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    return hours > 0 ? `${hours}h ${remainingMinutes}m` : `${minutes} min`;
}

function compareActivity(a: TrainingDayRow, b: TrainingDayRow): number {
    const kcalDifference = (a.activeKcal ?? -1) - (b.activeKcal ?? -1);
    if (kcalDifference !== 0) return kcalDifference;

    const durationDifference = (a.durationSeconds ?? -1) - (b.durationSeconds ?? -1);
    if (durationDifference !== 0) return durationDifference;

    return a.sessionsCount - b.sessionsCount;
}

function findMostActiveDay(days: readonly CalendarDayFull[]): TrainingDayRow | null {
    const rows = buildTrainingDayRows(days);
    if (rows.length === 0) return null;

    return rows.reduce((best, current) => compareActivity(current, best) > 0 ? current : best);
}

function findBestSleepScore(days: readonly CalendarDayFull[]): SleepScoreHighlight | null {
    const rows = days.flatMap((day) => {
        const score = day.sleep?.score ?? day.sleepSummary?.score ?? null;
        if (!isFiniteNumber(score)) return [];

        return [{ date: day.date ?? "—", score }];
    });

    if (rows.length === 0) return null;

    return rows.reduce((best, current) => current.score > best.score ? current : best);
}

function countDaysWithRecords(days: readonly CalendarDayFull[]): number {
    return days.filter((day) => {
        const hasSleep = Boolean(day.sleep || day.sleepSummary);
        const sessionsCount = Array.isArray(day.training?.sessions)
            ? day.training.sessions.length
            : day.trainingSummary?.sessionsCount ?? 0;

        return hasSleep || sessionsCount > 0;
    }).length;
}

export function WeekSummaryOverview(props: Props) {
    const { kpis, days, lang, loading, hasError } = props;
    const mostActiveDay = findMostActiveDay(days);
    const bestSleepScore = findBestSleepScore(days);
    const daysWithRecords = countDaysWithRecords(days);
    const detailValueFallback = loading ? "…" : "—";

    const mostActiveHelper = mostActiveDay
        ? [
            isFiniteNumber(mostActiveDay.activeKcal) ? `${Math.round(mostActiveDay.activeKcal)} kcal` : null,
            formatDuration(mostActiveDay.durationSeconds) !== "—" ? formatDuration(mostActiveDay.durationSeconds) : null,
        ].filter((value): value is string => Boolean(value)).join(" · ") || undefined
        : undefined;

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 1.5, md: 2 } }}>
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
                    gap: { xs: 1.5, md: 2 },
                    minWidth: 0,
                }}
            >
                <AppCard title={lang === "es" ? "🏋️ Entrenamiento" : "🏋️ Training"} padding="sm" tone="soft">
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                            gap: 1,
                            "& > :last-child": { gridColumn: "span 2" },
                        }}
                    >
                        <AppMetricCard label={lang === "es" ? "Sesiones" : "Sessions"} value={formatStatValue(kpis.sessionsCount)} compact />
                        <AppMetricCard label={lang === "es" ? "Duración (min)" : "Duration (min)"} value={formatStatValue(kpis.durationMinutes)} compact />
                        <AppMetricCard label={lang === "es" ? "Kcal activas" : "Active kcal"} value={formatStatValue(kpis.activeKcal)} compact />
                        <AppMetricCard label="Media" value={formatStatValue(kpis.mediaCount)} compact />
                        <AppMetricCard
                            label={lang === "es" ? "HR prom / máx" : "Avg / max HR"}
                            value={`${formatStatValue(kpis.avgHr)} / ${formatStatValue(kpis.maxHr)}`}
                            compact
                        />
                    </Box>
                </AppCard>

                <AppCard title={lang === "es" ? "😴 Sueño" : "😴 Sleep"} padding="sm" tone="soft">
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                            gap: 1,
                            "& > :last-child": { gridColumn: "span 2" },
                        }}
                    >
                        <AppMetricCard label={lang === "es" ? "Días con sueño" : "Sleep days"} value={formatStatValue(kpis.sleepDays)} compact />
                        <AppMetricCard label={lang === "es" ? "Sueño avg (min)" : "Avg sleep (min)"} value={formatStatValue(kpis.sleepAvgTotal)} compact />
                        <AppMetricCard label="Sleep Score" value={formatStatValue(kpis.sleepAvgScore)} compact />
                        <AppMetricCard label={lang === "es" ? "REM prom (min)" : "Avg REM (min)"} value={formatStatValue(kpis.sleepAvgRem)} compact />
                        <AppMetricCard label={lang === "es" ? "Deep prom (min)" : "Avg deep (min)"} value={formatStatValue(kpis.sleepAvgDeep)} compact />
                    </Box>
                </AppCard>
            </Box>

            <AppCard title={lang === "es" ? "Highlights de la semana" : "Weekly highlights"} padding="sm">
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" },
                        gap: 1,
                    }}
                >
                    <AppMetricCard
                        label={lang === "es" ? "🔥 Día más activo" : "🔥 Most active day"}
                        value={mostActiveDay
                            ? formatWeekDayLabel(mostActiveDay.date, lang)
                            : detailValueFallback}
                        helper={mostActiveHelper}
                        tone="warning"
                        compact
                    />
                    <AppMetricCard
                        label={lang === "es" ? "🏆 Mejor Sleep Score" : "🏆 Best Sleep Score"}
                        value={bestSleepScore
                            ? formatWeekDayLabel(bestSleepScore.date, lang)
                            : detailValueFallback}
                        helper={bestSleepScore ? `${Math.round(bestSleepScore.score)}` : undefined}
                        tone="success"
                        compact
                    />
                    <AppMetricCard
                        label={lang === "es" ? "📅 Días con registro" : "📅 Days with records"}
                        value={loading ? "…" : hasError ? "—" : `${daysWithRecords} / 7`}
                        helper={
                            hasError
                                ? (lang === "es" ? "Detalle diario no disponible" : "Daily detail unavailable")
                                : (lang === "es" ? "Entrenamiento o sueño" : "Training or sleep")
                        }
                        tone="info"
                        compact
                    />
                </Box>
            </AppCard>
        </Box>
    );
}

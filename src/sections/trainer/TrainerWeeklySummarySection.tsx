// src/sections/trainer/TrainerWeeklySummarySection.tsx
// MUI weekly summary for trainer view.

import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";

import { AppCard, AppEmptyState, AppMetricCard } from "@/components/mui";
import { useI18n } from "@/i18n/I18nProvider";
import { useTrainerWeekSummary } from "@/hooks/trainer/useTrainerWeekSummary";
import { defaultTrainerWeekSummaryParams } from "@/services/workout/trainer.service";
import type { CalendarDayFull } from "@/types/workoutDay.types";

function fmtMaybe(value: number | null | undefined, suffix = ""): string {
    if (value === null || value === undefined || !Number.isFinite(value)) return "—";
    const rounded = Math.round(value * 100) / 100;
    return `${rounded}${suffix}`;
}

function minutesToHhMm(minutes: number | null | undefined): string {
    if (minutes === null || minutes === undefined || !Number.isFinite(minutes)) return "—";
    const safe = Math.max(0, Math.round(minutes));
    const h = Math.floor(safe / 60);
    const m = safe % 60;
    if (h <= 0) return `${m}m`;
    return `${h}h ${m}m`;
}

function secondsToHhMm(seconds: number | null | undefined): string {
    if (seconds === null || seconds === undefined || !Number.isFinite(seconds)) return "—";
    return minutesToHhMm(seconds / 60);
}

function yesNo(lang: string, value: boolean): string {
    if (lang === "es") return value ? "sí" : "no";
    return value ? "yes" : "no";
}

function DayRow({ day, lang }: { day: CalendarDayFull; lang: string }) {
    const hasSleep = Boolean(day.hasSleep ?? day.sleep != null);
    const hasTraining = Boolean(day.hasTraining ?? day.training != null);
    const hasPlanned = Boolean(day.hasPlanned ?? day.plannedRoutine != null);
    const sleepScore = day.sleepSummary?.score ?? day.sleep?.score ?? null;
    const asleepMin = day.sleepSummary?.timeAsleepMinutes ?? day.sleep?.timeAsleepMinutes ?? null;
    const sessionsCount = day.trainingSummary?.sessionsCount ?? (day.training?.sessions?.length ?? 0);
    const effortRpe = day.trainingSummary?.dayEffortRpe ?? day.training?.dayEffortRpe ?? null;
    const plannedType = day.plannedRoutine?.sessionType ?? "—";
    const plannedFocus = day.plannedRoutine?.focus ?? null;

    return (
        <TableRow>
            <TableCell sx={{ fontWeight: 800, whiteSpace: "nowrap" }}>{day.date ?? "—"}</TableCell>
            <TableCell>
                <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
                    <Chip size="small" color={hasSleep ? "primary" : "default"} label={`${lang === "es" ? "Sueño" : "Sleep"}: ${yesNo(lang, hasSleep)}`} />
                    <Chip size="small" color={hasTraining ? "primary" : "default"} label={`${lang === "es" ? "Entrenado" : "Training"}: ${yesNo(lang, hasTraining)}`} />
                    <Chip size="small" color={hasPlanned ? "primary" : "default"} label={`${lang === "es" ? "Planeado" : "Planned"}: ${yesNo(lang, hasPlanned)}`} />
                </Box>
            </TableCell>
            <TableCell>{minutesToHhMm(asleepMin)} · {fmtMaybe(sleepScore)}</TableCell>
            <TableCell>{sessionsCount} · RPE {fmtMaybe(effortRpe)}</TableCell>
            <TableCell>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{plannedType}</Typography>
                {plannedFocus ? <Typography variant="caption" color="text.secondary">{plannedFocus}</Typography> : null}
            </TableCell>
        </TableRow>
    );
}

export function TrainerWeeklySummarySection({ traineeId, weekKey }: { traineeId: string; weekKey: string }) {
    const { lang } = useI18n();

    const q = useTrainerWeekSummary({
        traineeId,
        ...defaultTrainerWeekSummaryParams(weekKey),
    });

    if (q.isLoading) {
        return <AppEmptyState title={lang === "es" ? "Cargando resumen semanal…" : "Loading weekly summary…"} variant="inline" />;
    }

    if (q.isError) {
        return (
            <AppEmptyState
                title={lang === "es" ? "No se pudo cargar el resumen semanal." : "Failed to load weekly summary."}
                description={lang === "es" ? "Intenta recargar o cambia de trainee." : "Try reloading or switching trainee."}
                variant="inline"
            />
        );
    }

    const data = q.data;
    if (!data) {
        return <AppEmptyState title={lang === "es" ? "Sin datos para esta semana" : "No data for this week"} variant="inline" />;
    }

    const trainingTotals = data.rollups?.trainingTotals;
    const sleepAvg = data.rollups?.sleepAverages;
    const days = data.days ?? [];

    return (
        <Box sx={{ display: "grid", gap: { xs: 1.5, md: 2 } }}>
            <AppCard
                title={lang === "es" ? `Semana ${data.weekKey}` : `Week ${data.weekKey}`}
                subtitle={`${data.range.from} → ${data.range.to}`}
            >
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", lg: "repeat(4, 1fr)" }, gap: 1.25 }}>
                    <AppMetricCard label={lang === "es" ? "Sesiones" : "Sessions"} value={fmtMaybe(trainingTotals?.totalSessions)} />
                    <AppMetricCard label={lang === "es" ? "Duración" : "Duration"} value={secondsToHhMm(trainingTotals?.totalDurationSeconds)} />
                    <AppMetricCard label="Kcal" value={fmtMaybe(trainingTotals?.totalActiveKcal)} />
                    <AppMetricCard label={lang === "es" ? "Días sueño" : "Sleep days"} value={fmtMaybe(sleepAvg?.daysWithSleep ?? 0)} />
                    <AppMetricCard label={lang === "es" ? "Sueño promedio" : "Avg sleep"} value={minutesToHhMm(sleepAvg?.avgTimeAsleepMinutes)} />
                    <AppMetricCard label="Sleep score" value={fmtMaybe(sleepAvg?.avgScore)} />
                    <AppMetricCard label="REM" value={minutesToHhMm(sleepAvg?.avgRemMinutes)} />
                    <AppMetricCard label="Deep" value={minutesToHhMm(sleepAvg?.avgDeepMinutes)} />
                </Box>
            </AppCard>

            <AppCard title={lang === "es" ? "Días de la semana" : "Week days"}>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>{lang === "es" ? "Fecha" : "Date"}</TableCell>
                                <TableCell>{lang === "es" ? "Estado" : "Status"}</TableCell>
                                <TableCell>{lang === "es" ? "Sueño" : "Sleep"}</TableCell>
                                <TableCell>{lang === "es" ? "Entreno" : "Training"}</TableCell>
                                <TableCell>{lang === "es" ? "Plan" : "Plan"}</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {days.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center">—</TableCell>
                                </TableRow>
                            ) : (
                                days.map((day) => <DayRow key={day.date ?? Math.random()} day={day} lang={lang} />)
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </AppCard>
        </Box>
    );
}

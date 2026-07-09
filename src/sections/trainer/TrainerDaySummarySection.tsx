// src/sections/trainer/TrainerDaySummarySection.tsx
// MUI daily trainer summary. Keeps trainer day hook unchanged.

import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";

import { AppCard, AppEmptyState, AppMetricCard } from "@/components/mui";
import { useI18n } from "@/i18n/I18nProvider";
import { useTrainerDay } from "@/hooks/trainer/useTrainerDay";
import type { ISODate, WorkoutDay } from "@/types/workoutDay.types";

function minutesToHhMm(minutes: number | null | undefined): string {
    if (minutes === null || minutes === undefined || !Number.isFinite(minutes)) return "—";
    const safe = Math.max(0, Math.round(minutes));
    const h = Math.floor(safe / 60);
    const m = safe % 60;
    if (h <= 0) return `${m}m`;
    return `${h}h ${m}m`;
}

function fmt(value: number | null | undefined, suffix = ""): string {
    if (value === null || value === undefined || !Number.isFinite(value)) return "—";
    const rounded = Math.round(value * 100) / 100;
    return `${rounded}${suffix}`;
}

function calcEfficiency(sleep: WorkoutDay["sleep"]): number | null {
    if (!sleep) return null;
    const asleep = sleep.timeAsleepMinutes ?? null;
    const inBed = sleep.timeInBedMinutes ?? null;
    if (asleep === null || inBed === null || inBed <= 0) return null;
    return (asleep / inBed) * 100;
}

function hasTrainingSessions(day: WorkoutDay | null): boolean {
    return Array.isArray(day?.training?.sessions) && day.training.sessions.length > 0;
}

export function TrainerDaySummarySection({ traineeId, date }: { traineeId: string; date: ISODate }) {
    const { lang } = useI18n();
    const q = useTrainerDay({ traineeId, date });

    if (q.isLoading) {
        return <AppEmptyState title={lang === "es" ? "Cargando resumen del día…" : "Loading day summary…"} variant="inline" />;
    }

    if (q.isError) {
        return (
            <AppEmptyState
                title={lang === "es" ? "No se pudo cargar el día." : "Failed to load day."}
                description={lang === "es" ? "Intenta recargar o cambia de fecha." : "Try reloading or changing the date."}
                variant="inline"
            />
        );
    }

    const day = q.data?.day ?? null;
    if (!day) {
        return (
            <AppEmptyState
                title={lang === "es" ? "Sin datos para este día" : "No data for this day"}
                description={lang === "es" ? "No existe WorkoutDay para esta fecha." : "No WorkoutDay exists for this date."}
                variant="inline"
            />
        );
    }

    const sleep = day.sleep ?? null;
    const planned = day.plannedRoutine ?? null;
    const trainingExists = hasTrainingSessions(day);
    const plannedExercises = planned?.exercises ?? [];
    const sessions = day.training?.sessions ?? [];
    const sleepEfficiency = calcEfficiency(sleep);

    return (
        <Box sx={{ display: "grid", gap: { xs: 1.5, md: 2 } }}>
            <AppCard
                title={lang === "es" ? "Resumen del día" : "Day summary"}
                subtitle={`${day.date} · ${day.weekKey}`}
            >
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                    <Chip size="small" color={sleep ? "primary" : "default"} label={sleep ? (lang === "es" ? "Sueño" : "Sleep") : (lang === "es" ? "Sin sueño" : "No sleep")} />
                    <Chip size="small" color={planned ? "primary" : "default"} label={planned ? (lang === "es" ? "Plan asignado" : "Assigned plan") : (lang === "es" ? "Sin plan" : "No plan")} />
                    <Chip size="small" color={trainingExists ? "success" : "default"} label={trainingExists ? (lang === "es" ? "Entrenó" : "Trained") : (lang === "es" ? "Sin entrenamiento" : "No training")} />
                </Box>
            </AppCard>

            <AppCard title={lang === "es" ? "Sueño" : "Sleep"}>
                {!sleep ? (
                    <Typography variant="body2" color="text.secondary">{lang === "es" ? "No hay registro de sueño." : "No sleep record."}</Typography>
                ) : (
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", lg: "repeat(4, 1fr)" }, gap: 1.25 }}>
                        <AppMetricCard label="Score" value={fmt(sleep.score)} />
                        <AppMetricCard label={lang === "es" ? "Dormido" : "Asleep"} value={minutesToHhMm(sleep.timeAsleepMinutes)} />
                        <AppMetricCard label={lang === "es" ? "En cama" : "In bed"} value={minutesToHhMm(sleep.timeInBedMinutes)} />
                        <AppMetricCard label={lang === "es" ? "Eficiencia" : "Efficiency"} value={fmt(sleepEfficiency, "%")} />
                        <AppMetricCard label="REM" value={minutesToHhMm(sleep.remMinutes)} />
                        <AppMetricCard label="Core" value={minutesToHhMm(sleep.coreMinutes)} />
                        <AppMetricCard label="Deep" value={minutesToHhMm(sleep.deepMinutes)} />
                        <AppMetricCard label="Awake" value={minutesToHhMm(sleep.awakeMinutes)} />
                    </Box>
                )}
            </AppCard>

            <AppCard title={lang === "es" ? "Plan asignado" : "Assigned plan"}>
                {!planned ? (
                    <Typography variant="body2" color="text.secondary">{lang === "es" ? "No hay plan asignado." : "No assigned plan."}</Typography>
                ) : (
                    <Box sx={{ display: "grid", gap: 1.25 }}>
                        <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
                            <Chip size="small" color="primary" label={planned.sessionType ?? "—"} />
                            {planned.focus ? <Chip size="small" label={planned.focus} /> : null}
                            <Chip size="small" label={`${plannedExercises.length} ${lang === "es" ? "ejercicio(s)" : "exercise(s)"}`} />
                        </Box>
                        {planned.notes ? <Typography variant="body2">{planned.notes}</Typography> : null}
                        <Divider />
                        <Box sx={{ display: "grid", gap: 1 }}>
                            {plannedExercises.length === 0 ? (
                                <Typography variant="body2" color="text.secondary">—</Typography>
                            ) : (
                                plannedExercises.map((exercise) => (
                                    <Box key={exercise.id} sx={{ p: 1.25, border: 1, borderColor: "divider", borderRadius: 2 }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 850 }}>{exercise.name}</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {exercise.sets ?? "—"} sets · {exercise.reps ?? "—"} reps · RPE {exercise.rpe ?? "—"} · {exercise.load ?? "—"}
                                        </Typography>
                                    </Box>
                                ))
                            )}
                        </Box>
                    </Box>
                )}
            </AppCard>

            <AppCard title={lang === "es" ? "Entrenamiento real" : "Actual training"}>
                {sessions.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">{lang === "es" ? "No hay sesiones reales." : "No actual sessions."}</Typography>
                ) : (
                    <Box sx={{ display: "grid", gap: 1 }}>
                        {sessions.map((session) => (
                            <Box key={session.id} sx={{ p: 1.25, border: 1, borderColor: "divider", borderRadius: 2 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 850 }}>{session.type}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {fmt(session.durationSeconds ? session.durationSeconds / 60 : null, "m")} · {fmt(session.activeKcal, " kcal")} · HR {fmt(session.avgHr)} / {fmt(session.maxHr)}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                )}
            </AppCard>
        </Box>
    );
}

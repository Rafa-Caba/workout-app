// src/sections/trainer/TrainerRecoverySection.tsx
// MUI recovery view for trainer weekly range.

import { addDays, format } from "date-fns";

import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";

import { AppCard, AppEmptyState, AppMetricCard } from "@/components/mui";
import { useI18n } from "@/i18n/I18nProvider";
import { useTrainerRecovery } from "@/hooks/trainer/useTrainerRecovery";
import { weekKeyToStartDate } from "@/utils/weekKey";

function fmt(value: number | null | undefined, suffix = ""): string {
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

function dayLabelFromIso(date: string, lang: string): string {
    const parsed = new Date(`${date}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return date;

    try {
        return new Intl.DateTimeFormat(lang === "es" ? "es-MX" : "en-US", {
            weekday: "short",
            month: "short",
            day: "2-digit",
        }).format(parsed);
    } catch {
        return date;
    }
}

function getWeekRange(weekKey: string): { from: string; to: string } {
    try {
        const start = weekKeyToStartDate(weekKey);
        return {
            from: format(start, "yyyy-MM-dd"),
            to: format(addDays(start, 6), "yyyy-MM-dd"),
        };
    } catch {
        const now = new Date();
        return {
            from: format(now, "yyyy-MM-dd"),
            to: format(addDays(now, 6), "yyyy-MM-dd"),
        };
    }
}

export function TrainerRecoverySection({ traineeId, weekKey }: { traineeId: string; weekKey: string }) {
    const { lang } = useI18n();
    const range = getWeekRange(weekKey);
    const q = useTrainerRecovery({ traineeId, from: range.from, to: range.to });

    if (q.isLoading) {
        return <AppEmptyState title={lang === "es" ? "Cargando recuperación…" : "Loading recovery…"} variant="inline" />;
    }

    if (q.isError) {
        return (
            <AppEmptyState
                title={lang === "es" ? "No se pudo cargar recuperación." : "Failed to load recovery."}
                description={lang === "es" ? "Intenta recargar o cambia de semana." : "Try reloading or switching week."}
                variant="inline"
            />
        );
    }

    const days = q.data?.days ?? [];
    const sleepDays = days.filter((day) => Boolean(day.sleep));
    const trainingDays = days.filter((day) => Boolean(day.hasTraining));
    const avgSleep =
        sleepDays.length > 0
            ? sleepDays.reduce((sum, day) => sum + (day.sleep?.timeAsleepMinutes ?? 0), 0) / sleepDays.length
            : null;
    const avgScore =
        sleepDays.length > 0
            ? sleepDays.reduce((sum, day) => sum + (day.sleep?.score ?? 0), 0) / sleepDays.length
            : null;

    return (
        <Box sx={{ display: "grid", gap: { xs: 1.5, md: 2 } }}>
            <AppCard title={lang === "es" ? "Recuperación" : "Recovery"} subtitle={`${range.from} → ${range.to}`}>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 1.25 }}>
                    <AppMetricCard label={lang === "es" ? "Días con sueño" : "Sleep days"} value={fmt(sleepDays.length)} />
                    <AppMetricCard label={lang === "es" ? "Días entreno" : "Training days"} value={fmt(trainingDays.length)} />
                    <AppMetricCard label={lang === "es" ? "Sueño prom" : "Avg sleep"} value={minutesToHhMm(avgSleep)} />
                    <AppMetricCard label="Sleep score" value={fmt(avgScore)} />
                </Box>
            </AppCard>

            <AppCard title={lang === "es" ? "Días" : "Days"}>
                <Box sx={{ display: "grid", gap: 1 }}>
                    {days.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">—</Typography>
                    ) : (
                        days.map((day) => {
                            const asleep = day.sleep?.timeAsleepMinutes ?? null;
                            const inBed = day.sleep?.timeInBedMinutes ?? null;
                            const efficiency = asleep !== null && inBed !== null && inBed > 0 ? (asleep / inBed) * 100 : null;

                            return (
                                <Box key={day.date} sx={{ p: 1.25, border: 1, borderColor: "divider", borderRadius: 2 }}>
                                    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 850 }}>{dayLabelFromIso(day.date, lang)}</Typography>
                                        <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
                                            <Chip size="small" color={day.sleep ? "primary" : "default"} label={day.sleep ? (lang === "es" ? "Sueño" : "Sleep") : (lang === "es" ? "Sin sueño" : "No sleep")} />
                                            <Chip size="small" color={day.hasTraining ? "success" : "default"} label={day.hasTraining ? (lang === "es" ? "Entrenó" : "Trained") : "Rest"} />
                                        </Box>
                                    </Box>
                                    <Box sx={{ mt: 1, display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 1 }}>
                                        <AppMetricCard label={lang === "es" ? "Dormido" : "Asleep"} value={minutesToHhMm(asleep)} />
                                        <AppMetricCard label={lang === "es" ? "En cama" : "In bed"} value={minutesToHhMm(inBed)} />
                                        <AppMetricCard label={lang === "es" ? "Eficiencia" : "Efficiency"} value={fmt(efficiency, "%")} />
                                        <AppMetricCard label="Score" value={fmt(day.sleep?.score)} />
                                    </Box>
                                </Box>
                            );
                        })
                    )}
                </Box>
            </AppCard>
        </Box>
    );
}

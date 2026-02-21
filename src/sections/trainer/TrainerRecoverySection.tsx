import React from "react";
import { addDays, format } from "date-fns";

import { EmptyState } from "@/components/EmptyState";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useI18n } from "@/i18n/I18nProvider";

import { useTrainerRecovery } from "@/hooks/trainer/useTrainerRecovery";
import { weekKeyToStartDate } from "@/utils/weekKey";

import type { TraineeRecoveryDay } from "@/types/trainer.types";
import type { ISODate } from "@/types/workoutDay.types";

/**
 * Notes:
 * - Recovery endpoint expects from/to as ISODate (YYYY-MM-DD).
 * - For an ISO weekKey, we display Mon..Sun (7 days).
 */

function mmToHhMm(min: number | null | undefined): string {
    if (min == null) return "—";
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${h}h ${String(m).padStart(2, "0")}m`;
}

function pct(n: number | null | undefined): string {
    if (n == null) return "—";
    return `${Math.round(n)}%`;
}

function avg(nums: Array<number | null | undefined>): number | null {
    const v = nums.filter((x): x is number => typeof x === "number" && Number.isFinite(x));
    if (v.length === 0) return null;
    return v.reduce((a, b) => a + b, 0) / v.length;
}

function safeIsoDate(d: Date): ISODate {
    return format(d, "yyyy-MM-dd") as ISODate;
}

function dayLabelFromIso(iso: ISODate, lang: string): string {
    // No locale imports; keep a simple label
    // YYYY-MM-DD -> show same; dayKey is not available here.
    return lang === "es" ? iso : iso;
}

type SleepAgg = {
    daysWithSleep: number;
    avgScore: number | null;
    avgAsleepMin: number | null;
    avgInBedMin: number | null;
    avgEfficiencyPct: number | null;

    avgRemMin: number | null;
    avgCoreMin: number | null;
    avgDeepMin: number | null;
    avgAwakeMin: number | null;
};

function buildSleepAgg(days: TraineeRecoveryDay[]): SleepAgg {
    const withSleep = days.filter((d) => d.sleep != null);
    const daysWithSleep = withSleep.length;

    const avgScore = avg(withSleep.map((d) => d.sleep?.score ?? null));
    const avgAsleepMin = avg(withSleep.map((d) => d.sleep?.timeAsleepMinutes ?? null));
    const avgInBedMin = avg(withSleep.map((d) => d.sleep?.timeInBedMinutes ?? null));

    const efficiencies = withSleep.map((d) => {
        const asleep = d.sleep?.timeAsleepMinutes ?? null;
        const inBed = d.sleep?.timeInBedMinutes ?? null;
        if (asleep == null || inBed == null || inBed <= 0) return null;
        return (asleep / inBed) * 100;
    });

    const avgEfficiencyPct = avg(efficiencies);

    return {
        daysWithSleep,
        avgScore,
        avgAsleepMin,
        avgInBedMin,
        avgEfficiencyPct,

        avgRemMin: avg(withSleep.map((d) => d.sleep?.remMinutes ?? null)),
        avgCoreMin: avg(withSleep.map((d) => d.sleep?.coreMinutes ?? null)),
        avgDeepMin: avg(withSleep.map((d) => d.sleep?.deepMinutes ?? null)),
        avgAwakeMin: avg(withSleep.map((d) => d.sleep?.awakeMinutes ?? null)),
    };
}

export function TrainerRecoverySection({
    traineeId,
    weekKey,
}: {
    traineeId: string;
    weekKey: string;
}) {
    const { lang } = useI18n();

    const weekStart = React.useMemo(() => {
        const d = weekKeyToStartDate(weekKey);
        return d ?? new Date();
    }, [weekKey]);

    // ISO week: Mon..Sun (7 days)
    const from = React.useMemo<ISODate>(() => safeIsoDate(weekStart), [weekStart]);
    const to = React.useMemo<ISODate>(() => safeIsoDate(addDays(weekStart, 6)), [weekStart]);

    const q = useTrainerRecovery({ traineeId, from, to });

    if (q.isLoading) {
        return (
            <EmptyState
                title={lang === "es" ? "Cargando recuperación…" : "Loading recovery…"}
                description={lang === "es" ? "Esto puede tardar unos segundos." : "This can take a few seconds."}
            />
        );
    }

    if (q.isError) {
        const status = (q.error as any)?.status;
        const msg =
            status === 403
                ? lang === "es"
                    ? "No tienes acceso a este trainee."
                    : "You don't have access to this trainee."
                : lang === "es"
                    ? "No se pudo cargar recuperación."
                    : "Failed to load recovery.";

        return (
            <EmptyState
                title={msg}
                description={lang === "es" ? "Intenta recargar o cambia de semana." : "Try reloading or switching week."}
            />
        );
    }

    const data = q.data ?? null;
    const days = Array.isArray(data?.days) ? data!.days : [];

    if (days.length === 0) {
        return (
            <EmptyState
                title={lang === "es" ? "Sin datos de recuperación" : "No recovery data"}
                description={lang === "es" ? "No hay días en este rango." : "No days found for this range."}
            />
        );
    }

    const agg = buildSleepAgg(days);

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>{lang === "es" ? "Recuperación (sueño)" : "Recovery (sleep)"}</CardTitle>
                    <CardDescription>
                        {lang === "es"
                            ? `Semana ${weekKey} · ${from} → ${to}`
                            : `Week ${weekKey} · ${from} → ${to}`}
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-lg border bg-background p-3">
                            <div className="text-xs text-muted-foreground">{lang === "es" ? "Días con sueño" : "Days with sleep"}</div>
                            <div className="mt-1 text-lg font-semibold">{agg.daysWithSleep}</div>
                        </div>

                        <div className="rounded-lg border bg-background p-3">
                            <div className="text-xs text-muted-foreground">{lang === "es" ? "Score promedio" : "Avg score"}</div>
                            <div className="mt-1 text-lg font-semibold">{agg.avgScore == null ? "—" : Math.round(agg.avgScore)}</div>
                        </div>

                        <div className="rounded-lg border bg-background p-3">
                            <div className="text-xs text-muted-foreground">{lang === "es" ? "Tiempo dormido" : "Time asleep"}</div>
                            <div className="mt-1 text-lg font-semibold">{mmToHhMm(agg.avgAsleepMin)}</div>
                        </div>

                        <div className="rounded-lg border bg-background p-3">
                            <div className="text-xs text-muted-foreground">{lang === "es" ? "Eficiencia" : "Efficiency"}</div>
                            <div className="mt-1 text-lg font-semibold">{pct(agg.avgEfficiencyPct)}</div>
                        </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-lg border bg-background p-3">
                            <div className="text-xs text-muted-foreground">REM</div>
                            <div className="mt-1 text-sm font-semibold">{mmToHhMm(agg.avgRemMin)}</div>
                        </div>
                        <div className="rounded-lg border bg-background p-3">
                            <div className="text-xs text-muted-foreground">{lang === "es" ? "Core" : "Core"}</div>
                            <div className="mt-1 text-sm font-semibold">{mmToHhMm(agg.avgCoreMin)}</div>
                        </div>
                        <div className="rounded-lg border bg-background p-3">
                            <div className="text-xs text-muted-foreground">{lang === "es" ? "Deep" : "Deep"}</div>
                            <div className="mt-1 text-sm font-semibold">{mmToHhMm(agg.avgDeepMin)}</div>
                        </div>
                        <div className="rounded-lg border bg-background p-3">
                            <div className="text-xs text-muted-foreground">{lang === "es" ? "Awake" : "Awake"}</div>
                            <div className="mt-1 text-sm font-semibold">{mmToHhMm(agg.avgAwakeMin)}</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{lang === "es" ? "Detalle por día" : "Per-day detail"}</CardTitle>
                    <CardDescription>
                        {lang === "es"
                            ? "Sueño + indicador de entrenamiento"
                            : "Sleep + training indicator"}
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <div className="space-y-2">
                        {days.map((d) => {
                            const asleep = d.sleep?.timeAsleepMinutes ?? null;
                            const inBed = d.sleep?.timeInBedMinutes ?? null;
                            const eff =
                                asleep != null && inBed != null && inBed > 0 ? (asleep / inBed) * 100 : null;

                            const hasSleep = Boolean(d.sleep);
                            const hasTraining = Boolean(d.hasTraining);

                            return (
                                <div key={d.date} className="rounded-lg border bg-background p-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="font-mono text-sm font-semibold">
                                            {dayLabelFromIso(d.date, lang)}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span
                                                className={[
                                                    "text-[11px] px-2 py-0.5 rounded-full border",
                                                    hasSleep ? "bg-primary/10 border-primary/20" : "bg-muted/30",
                                                ].join(" ")}
                                            >
                                                {hasSleep ? (lang === "es" ? "Sueño" : "Sleep") : (lang === "es" ? "Sin sueño" : "No sleep")}
                                            </span>

                                            <span
                                                className={[
                                                    "text-[11px] px-2 py-0.5 rounded-full border",
                                                    hasTraining ? "bg-accent/20 border-accent/30" : "bg-muted/30",
                                                ].join(" ")}
                                            >
                                                {hasTraining ? (lang === "es" ? "Entrenó" : "Trained") : (lang === "es" ? "Rest" : "Rest")}
                                            </span>
                                        </div>
                                    </div>

                                    {hasSleep ? (
                                        <div className="mt-2 grid gap-2 sm:grid-cols-4">
                                            <div className="text-xs">
                                                <div className="text-muted-foreground">{lang === "es" ? "Score" : "Score"}</div>
                                                <div className="font-semibold">{d.sleep?.score ?? "—"}</div>
                                            </div>
                                            <div className="text-xs">
                                                <div className="text-muted-foreground">{lang === "es" ? "Dormido" : "Asleep"}</div>
                                                <div className="font-semibold">{mmToHhMm(d.sleep?.timeAsleepMinutes ?? null)}</div>
                                            </div>
                                            <div className="text-xs">
                                                <div className="text-muted-foreground">{lang === "es" ? "Deep" : "Deep"}</div>
                                                <div className="font-semibold">{mmToHhMm(d.sleep?.deepMinutes ?? null)}</div>
                                            </div>
                                            <div className="text-xs">
                                                <div className="text-muted-foreground">{lang === "es" ? "Eficiencia" : "Efficiency"}</div>
                                                <div className="font-semibold">{pct(eff)}</div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mt-2 text-xs text-muted-foreground">
                                            {lang === "es" ? "No hay registro de sueño para este día." : "No sleep record for this day."}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
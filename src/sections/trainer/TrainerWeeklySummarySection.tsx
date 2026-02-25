// src/sections/trainer/TrainerWeeklySummarySection.tsx
import React from "react";

import { EmptyState } from "@/components/EmptyState";
import { useI18n } from "@/i18n/I18nProvider";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

import { useTrainerWeekSummary } from "@/hooks/trainer/useTrainerWeekSummary";
import { defaultTrainerWeekSummaryParams } from "@/services/workout/trainer.service";

import type { CalendarDayFull } from "@/types/workoutDay.types";

function fmtMaybe(n: number | null | undefined, suffix = ""): string {
    if (n === null || n === undefined) return "—";
    return `${n}${suffix}`;
}

function minutesToHhMm(minutes: number | null | undefined): string {
    if (minutes === null || minutes === undefined) return "—";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h <= 0) return `${m}m`;
    return `${h}h ${m}m`;
}

function secondsToHhMm(seconds: number | null | undefined): string {
    if (seconds === null || seconds === undefined) return "—";
    const totalMin = Math.round(seconds / 60);
    return minutesToHhMm(totalMin);
}

function badgeClass(kind: "ok" | "muted" | "warn") {
    if (kind === "ok") return "bg-primary/10 text-primary border-primary/20";
    if (kind === "warn") return "bg-destructive/10 text-destructive border-destructive/20";
    return "bg-muted text-muted-foreground border-border";
}

function yesNo(lang: string, v: boolean): string {
    if (lang === "es") return v ? "sí" : "no";
    return v ? "yes" : "no";
}

function DayRow({ day, lang }: { day: CalendarDayFull; lang: string }) {
    const date = day.date ?? "—";
    const hasSleep = Boolean(day.hasSleep ?? day.sleep != null);
    const hasTraining = Boolean(day.hasTraining ?? day.training != null);

    const sleepScore = day.sleepSummary?.score ?? day.sleep?.score ?? null;
    const asleepMin = day.sleepSummary?.timeAsleepMinutes ?? day.sleep?.timeAsleepMinutes ?? null;

    const sessionsCount = day.trainingSummary?.sessionsCount ?? (day.training?.sessions?.length ?? 0);
    const effortRpe = day.trainingSummary?.dayEffortRpe ?? day.training?.dayEffortRpe ?? null;

    const plannedType = day.plannedRoutine?.sessionType ?? null;
    const plannedFocus = day.plannedRoutine?.focus ?? null;
    const plannedExercises = day.plannedRoutine?.exercises?.length ?? null;

    const plannedKind: "ok" | "muted" = plannedType || plannedFocus || plannedExercises ? "ok" : "muted";
    const sleepKind: "ok" | "muted" = hasSleep ? "ok" : "muted";
    const trainingKind: "ok" | "muted" = hasTraining ? "ok" : "muted";

    return (
        <div className="rounded-lg border bg-background p-3 sm:p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <div className="text-sm font-semibold">{date}</div>
                    <div className="mt-1 flex flex-wrap gap-2">
                        <span
                            className={[
                                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs",
                                badgeClass(sleepKind),
                            ].join(" ")}
                        >
                            {lang == "es" ? "Sueño" : "Sleep"}: {yesNo(lang, hasSleep)}
                        </span>
                        <span
                            className={[
                                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs",
                                badgeClass(trainingKind),
                            ].join(" ")}
                        >
                            {lang == "es" ? "Entrenado" : "Training"}: {yesNo(lang, hasTraining)}
                        </span>
                        <span
                            className={[
                                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs",
                                badgeClass(plannedKind),
                            ].join(" ")}
                        >
                            {lang == "es" ? "Planeado" : "Planned"}: {yesNo(lang, plannedKind === "ok")}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-3">
                    <div className="rounded-md border bg-card px-3 py-2">
                        <div className="text-[11px] text-muted-foreground">{lang == "es" ? "Sueño" : "Sleep"}</div>
                        <div className="text-sm font-semibold">
                            {minutesToHhMm(asleepMin)}{" "}
                            <span className="text-xs text-muted-foreground">({fmtMaybe(sleepScore)})</span>
                        </div>
                    </div>

                    <div className="rounded-md border bg-card px-3 py-2">
                        <div className="text-[11px] text-muted-foreground">{lang == "es" ? "Entrenado" : "Training"}</div>
                        <div className="text-sm font-semibold">
                            {sessionsCount}{" "}
                            <span className="text-xs text-muted-foreground">
                                {lang === "es" ? "sesión(es)" : "session(s)"}
                            </span>{" "}
                            <span className="text-xs text-muted-foreground">RPE {fmtMaybe(effortRpe)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {plannedKind === "ok" ? (
                <div className="mt-3 rounded-md border bg-card px-3 py-2">
                    <div className="text-[11px] text-muted-foreground">Planned routine</div>
                    <div className="text-sm">
                        <span className="font-semibold">{plannedType ?? "—"}</span>
                        {plannedFocus ? <span className="text-muted-foreground"> · {plannedFocus}</span> : null}
                        {plannedExercises != null ? (
                            <span className="text-muted-foreground">
                                {" "}
                                · {plannedExercises} {lang === "es" ? "ejercicio(s)" : "exercise(s)"}
                            </span>
                        ) : null}
                    </div>
                </div>
            ) : null}
        </div>
    );
}

export function TrainerWeeklySummarySection({
    traineeId,
    weekKey,
}: {
    traineeId: string;
    weekKey: string;
}) {
    const { lang } = useI18n();

    const q = useTrainerWeekSummary({
        traineeId,
        ...defaultTrainerWeekSummaryParams(weekKey),
    });

    if (q.isLoading) {
        return (
            <EmptyState
                title={lang === "es" ? "Cargando resumen semanal…" : "Loading weekly summary…"}
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
                    ? "No se pudo cargar el resumen semanal."
                    : "Failed to load weekly summary.";

        return (
            <EmptyState
                title={msg}
                description={lang === "es" ? "Intenta recargar o cambia de trainee." : "Try reloading or switching trainee."}
            />
        );
    }

    const data = q.data;

    // React Query types data as T | undefined; guard explicitly for TS correctness.
    if (!data) {
        return (
            <EmptyState
                title={lang === "es" ? "Sin datos para esta semana" : "No data for this week"}
                description={lang === "es" ? "Intenta recargar o cambia de semana." : "Try reloading or switching week."}
            />
        );
    }

    const rollups = data.rollups;

    const trainingTotals = rollups?.trainingTotals;
    const sleepAvg = rollups?.sleepAverages;

    const weekTitle = lang === "es" ? `Semana ${data.weekKey}` : `Week ${data.weekKey}`;
    const weekSubtitle =
        lang === "es" ? `Rango: ${data.range.from} → ${data.range.to}` : `Range: ${data.range.from} → ${data.range.to}`;

    const totalSessions = trainingTotals?.totalSessions ?? null;
    const totalDuration = trainingTotals?.totalDurationSeconds ?? null;
    const totalActiveKcal = trainingTotals?.totalActiveKcal ?? null;
    const totalKcal = trainingTotals?.totalKcal ?? null;

    const daysWithSleep = sleepAvg?.daysWithSleep ?? 0;

    const days = data.days ?? [];

    return (
        <div className="space-y-4">
            {/* Rollups / KPIs */}
            <Card>
                <CardHeader>
                    <CardTitle>{weekTitle}</CardTitle>
                    <CardDescription>{weekSubtitle}</CardDescription>
                </CardHeader>

                <CardContent>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-lg border bg-background p-3">
                            <div className="text-xs text-muted-foreground">{lang === "es" ? "Sesiones" : "Sessions"}</div>
                            <div className="mt-1 text-lg font-semibold">{fmtMaybe(totalSessions)}</div>
                        </div>

                        <div className="rounded-lg border bg-background p-3">
                            <div className="text-xs text-muted-foreground">
                                {lang === "es" ? "Duración total" : "Total duration"}
                            </div>
                            <div className="mt-1 text-lg font-semibold">{secondsToHhMm(totalDuration)}</div>
                        </div>

                        <div className="rounded-lg border bg-background p-3">
                            <div className="text-xs text-muted-foreground">{lang === "es" ? "Kcal activas" : "Active kcal"}</div>
                            <div className="mt-1 text-lg font-semibold">{fmtMaybe(totalActiveKcal)}</div>
                        </div>

                        <div className="rounded-lg border bg-background p-3">
                            <div className="text-xs text-muted-foreground">{lang === "es" ? "Kcal totales" : "Total kcal"}</div>
                            <div className="mt-1 text-lg font-semibold">{fmtMaybe(totalKcal)}</div>
                        </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-lg border bg-background p-3">
                            <div className="text-xs text-muted-foreground">
                                {lang === "es" ? "Días con sueño" : "Days with sleep"}
                            </div>
                            <div className="mt-1 text-lg font-semibold">{daysWithSleep}</div>
                        </div>

                        <div className="rounded-lg border bg-background p-3">
                            <div className="text-xs text-muted-foreground">
                                {lang === "es" ? "Prom. horas dormidas" : "Avg time asleep"}
                            </div>
                            <div className="mt-1 text-lg font-semibold">{minutesToHhMm(sleepAvg?.avgTimeAsleepMinutes ?? null)}</div>
                        </div>

                        <div className="rounded-lg border bg-background p-3">
                            <div className="text-xs text-muted-foreground">
                                {lang === "es" ? "Prom. Sleep Score" : "Avg sleep score"}
                            </div>
                            <div className="mt-1 text-lg font-semibold">{fmtMaybe(sleepAvg?.avgScore ?? null)}</div>
                        </div>

                        <div className="rounded-lg border bg-background p-3">
                            <div className="text-xs text-muted-foreground">{lang === "es" ? "Prom. Deep" : "Avg deep"}</div>
                            <div className="mt-1 text-lg font-semibold">{fmtMaybe(sleepAvg?.avgDeepMinutes ?? null, "m")}</div>
                        </div>
                    </div>

                    {/* Training types */}
                    {rollups?.trainingTypes?.length ? (
                        <div className="mt-4">
                            <div className="text-sm font-semibold">{lang === "es" ? "Tipos de entrenamiento" : "Training types"}</div>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {rollups.trainingTypes.map((tt) => (
                                    <span
                                        key={tt.type}
                                        className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs"
                                    >
                                        <span className="font-semibold">{tt.type}</span>
                                        <span className="text-muted-foreground">
                                            {tt.sessions} {lang === "es" ? "sesión(es)" : "session(s)"}
                                        </span>
                                    </span>
                                ))}
                            </div>
                        </div>
                    ) : null}
                </CardContent>
            </Card>

            {/* Days list */}
            {days.length === 0 ? (
                <EmptyState
                    title={lang === "es" ? "Sin días en esta semana" : "No days in this week"}
                    description={lang === "es" ? "No hay información para mostrar." : "No data to display."}
                />
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>{lang === "es" ? "Días" : "Days"}</CardTitle>
                        <CardDescription>
                            {lang === "es"
                                ? "Vista rápida de sueño, entrenamiento y rutina planificada por día."
                                : "Quick view of sleep, training and planned routine per day."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {days.map((d, idx) => (
                                <DayRow key={(d.date ?? "") + ":" + idx} day={d} lang={lang} />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
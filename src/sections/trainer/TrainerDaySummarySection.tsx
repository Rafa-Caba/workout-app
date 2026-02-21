import React from "react";
import { EmptyState } from "@/components/EmptyState";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/i18n/I18nProvider";
import { useTrainerDay } from "@/hooks/trainer/useTrainerDay";

import type { ISODate, WorkoutDay } from "@/types/workoutDay.types";

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

function calcEfficiency(sleep: WorkoutDay["sleep"]): number | null {
    if (!sleep) return null;
    const asleep = sleep.timeAsleepMinutes ?? null;
    const inBed = sleep.timeInBedMinutes ?? null;
    if (asleep == null || inBed == null || inBed <= 0) return null;
    return (asleep / inBed) * 100;
}

function hasTrainingSessions(day: WorkoutDay | null): boolean {
    const sessions: any[] = Array.isArray(day?.training?.sessions) ? (day as any).training.sessions : [];
    return sessions.length > 0;
}

export function TrainerDaySummarySection({
    traineeId,
    date,
}: {
    traineeId: string;
    date: ISODate;
}) {
    const { lang } = useI18n();

    const q = useTrainerDay({ traineeId, date });

    if (q.isLoading) {
        return (
            <EmptyState
                title={lang === "es" ? "Cargando resumen del día…" : "Loading day summary…"}
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
                    ? "No se pudo cargar el día."
                    : "Failed to load day.";

        return (
            <EmptyState
                title={msg}
                description={lang === "es" ? "Intenta recargar o cambia de fecha." : "Try reloading or changing the date."}
            />
        );
    }

    const day = q.data?.day ?? null;

    if (!day) {
        return (
            <EmptyState
                title={lang === "es" ? "Sin datos para este día" : "No data for this day"}
                description={lang === "es" ? "No existe WorkoutDay para esta fecha." : "No WorkoutDay exists for this date."}
            />
        );
    }

    const eff = calcEfficiency(day.sleep);
    const trainingExists = hasTrainingSessions(day);

    const planned = day.plannedRoutine ?? null;
    const plannedExercises = Array.isArray(planned?.exercises) ? planned!.exercises : [];
    const plannedCount = plannedExercises.length;

    const sleep = day.sleep ?? null;

    return (
        <div className="space-y-4">
            {/* Header mini */}
            <Card>
                <CardHeader>
                    <CardTitle>{lang === "es" ? "Resumen del día" : "Day summary"}</CardTitle>
                    <CardDescription>
                        {lang === "es" ? `Fecha: ${day.date}` : `Date: ${day.date}`} · {lang === "es" ? `Semana: ${day.weekKey}` : `Week: ${day.weekKey}`}
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        <span
                            className={[
                                "text-[11px] px-2 py-0.5 rounded-full border",
                                sleep ? "bg-primary/10 border-primary/20" : "bg-muted/30",
                            ].join(" ")}
                        >
                            {sleep ? (lang === "es" ? "Sueño" : "Sleep") : (lang === "es" ? "Sin sueño" : "No sleep")}
                        </span>

                        <span
                            className={[
                                "text-[11px] px-2 py-0.5 rounded-full border",
                                planned ? "bg-accent/20 border-accent/30" : "bg-muted/30",
                            ].join(" ")}
                        >
                            {planned ? (lang === "es" ? "Plan asignado" : "Assigned plan") : (lang === "es" ? "Sin plan" : "No plan")}
                        </span>

                        <span
                            className={[
                                "text-[11px] px-2 py-0.5 rounded-full border",
                                trainingExists ? "bg-emerald-500/15 border-emerald-500/30" : "bg-muted/30",
                            ].join(" ")}
                        >
                            {trainingExists ? (lang === "es" ? "Entrenó" : "Trained") : (lang === "es" ? "Sin entrenamiento" : "No training")}
                        </span>
                    </div>
                </CardContent>
            </Card>

            {/* Sleep */}
            <Card>
                <CardHeader>
                    <CardTitle>{lang === "es" ? "Sueño" : "Sleep"}</CardTitle>
                    <CardDescription>{lang === "es" ? "Bloque de sueño del día" : "Day sleep block"}</CardDescription>
                </CardHeader>

                <CardContent>
                    {!sleep ? (
                        <div className="text-sm text-muted-foreground">
                            {lang === "es" ? "No hay registro de sueño." : "No sleep record."}
                        </div>
                    ) : (
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="rounded-lg border bg-background p-3">
                                <div className="text-xs text-muted-foreground">{lang === "es" ? "Score" : "Score"}</div>
                                <div className="mt-1 text-lg font-semibold">{sleep.score ?? "—"}</div>
                            </div>

                            <div className="rounded-lg border bg-background p-3">
                                <div className="text-xs text-muted-foreground">{lang === "es" ? "Dormido" : "Asleep"}</div>
                                <div className="mt-1 text-lg font-semibold">{mmToHhMm(sleep.timeAsleepMinutes)}</div>
                            </div>

                            <div className="rounded-lg border bg-background p-3">
                                <div className="text-xs text-muted-foreground">{lang === "es" ? "En cama" : "In bed"}</div>
                                <div className="mt-1 text-lg font-semibold">{mmToHhMm(sleep.timeInBedMinutes)}</div>
                            </div>

                            <div className="rounded-lg border bg-background p-3">
                                <div className="text-xs text-muted-foreground">{lang === "es" ? "Eficiencia" : "Efficiency"}</div>
                                <div className="mt-1 text-lg font-semibold">{pct(eff)}</div>
                            </div>

                            <div className="rounded-lg border bg-background p-3">
                                <div className="text-xs text-muted-foreground">REM</div>
                                <div className="mt-1 text-sm font-semibold">{mmToHhMm(sleep.remMinutes)}</div>
                            </div>

                            <div className="rounded-lg border bg-background p-3">
                                <div className="text-xs text-muted-foreground">{lang === "es" ? "Core" : "Core"}</div>
                                <div className="mt-1 text-sm font-semibold">{mmToHhMm(sleep.coreMinutes)}</div>
                            </div>

                            <div className="rounded-lg border bg-background p-3">
                                <div className="text-xs text-muted-foreground">{lang === "es" ? "Deep" : "Deep"}</div>
                                <div className="mt-1 text-sm font-semibold">{mmToHhMm(sleep.deepMinutes)}</div>
                            </div>

                            <div className="rounded-lg border bg-background p-3">
                                <div className="text-xs text-muted-foreground">{lang === "es" ? "Awake" : "Awake"}</div>
                                <div className="mt-1 text-sm font-semibold">{mmToHhMm(sleep.awakeMinutes)}</div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Planned routine */}
            <Card>
                <CardHeader>
                    <CardTitle>{lang === "es" ? "Plan asignado" : "Assigned plan"}</CardTitle>
                    <CardDescription>{lang === "es" ? "plannedRoutine + plannedMeta" : "plannedRoutine + plannedMeta"}</CardDescription>
                </CardHeader>

                <CardContent>
                    {!planned ? (
                        <div className="text-sm text-muted-foreground">
                            {lang === "es" ? "No hay plan asignado para este día." : "No plan assigned for this day."}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="rounded-lg border bg-background p-3">
                                <div className="text-xs text-muted-foreground">{lang === "es" ? "Resumen" : "Summary"}</div>
                                <div className="mt-1 text-sm">
                                    <span className="font-semibold">{planned.sessionType ?? "—"}</span>
                                    {planned.focus ? <span className="text-muted-foreground"> · {planned.focus}</span> : null}
                                </div>

                                {planned.tags?.length ? (
                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                        {planned.tags.map((tag) => (
                                            <span key={tag} className="text-[11px] px-2 py-0.5 rounded-full border bg-muted/30">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                ) : null}

                                {planned.notes ? (
                                    <div className="mt-2 text-xs text-muted-foreground whitespace-pre-wrap">
                                        {planned.notes}
                                    </div>
                                ) : null}

                                <div className="mt-2 text-xs text-muted-foreground">
                                    {lang === "es" ? "Ejercicios:" : "Exercises:"}{" "}
                                    <span className="font-semibold">{plannedCount}</span>
                                </div>
                            </div>

                            {plannedCount > 0 ? (
                                <div className="space-y-2">
                                    {plannedExercises.map((ex: any) => (
                                        <div key={String(ex.id)} className="rounded-lg border bg-background p-3">
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="text-sm font-semibold">
                                                    {ex.movementName ?? ex.name ?? "—"}
                                                </div>
                                                <div className="text-xs text-muted-foreground font-mono">
                                                    {ex.sets != null ? `${ex.sets}x` : ""}
                                                    {ex.reps ? ` ${ex.reps}` : ""}
                                                    {ex.rpe != null ? ` · RPE ${ex.rpe}` : ""}
                                                </div>
                                            </div>

                                            <div className="mt-1 text-xs text-muted-foreground">
                                                {ex.load ? (lang === "es" ? `Carga: ${ex.load}` : `Load: ${ex.load}`) : null}
                                                {ex.load && ex.notes ? " · " : null}
                                                {ex.notes ? ex.notes : null}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : null}

                            {day.plannedMeta ? (
                                <div className="text-xs text-muted-foreground">
                                    {lang === "es" ? "Asignado:" : "Planned:"}{" "}
                                    <span className="font-mono">{day.plannedMeta.plannedAt}</span>
                                    {day.plannedMeta.source ? (
                                        <>
                                            {" "}
                                            · {lang === "es" ? "Fuente:" : "Source:"}{" "}
                                            <span className="font-mono">{day.plannedMeta.source}</span>
                                        </>
                                    ) : null}
                                </div>
                            ) : null}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Training */}
            <Card>
                <CardHeader>
                    <CardTitle>{lang === "es" ? "Entrenamiento (real)" : "Training (actual)"}</CardTitle>
                    <CardDescription>{lang === "es" ? "training.sessions" : "training.sessions"}</CardDescription>
                </CardHeader>

                <CardContent>
                    {!trainingExists ? (
                        <div className="text-sm text-muted-foreground">
                            {lang === "es" ? "No hay sesiones registradas." : "No sessions recorded."}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {(day.training?.sessions ?? []).map((s: any) => (
                                <div key={String(s.id ?? s._id)} className="rounded-lg border bg-background p-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="text-sm font-semibold">{s.type ?? "—"}</div>
                                        <div className="text-xs text-muted-foreground font-mono">
                                            {s.durationSeconds != null ? `${Math.round(s.durationSeconds / 60)} min` : "—"}
                                        </div>
                                    </div>

                                    <div className="mt-1 text-xs text-muted-foreground">
                                        {s.activeKcal != null ? `${s.activeKcal} kcal` : null}
                                        {s.activeKcal != null && s.avgHr != null ? " · " : null}
                                        {s.avgHr != null ? `HR ${s.avgHr}` : null}
                                        {s.maxHr != null ? `/${s.maxHr}` : null}
                                    </div>

                                    {s.notes ? (
                                        <div className="mt-2 text-xs text-muted-foreground whitespace-pre-wrap">
                                            {s.notes}
                                        </div>
                                    ) : null}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
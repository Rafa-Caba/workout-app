// src/components/outdoor/OutdoorSessionCard.tsx

/**
 * OutdoorSessionCard
 *
 * Read-only card for a single outdoor session.
 * Actions:
 * - edit
 * - delete
 */

import React from "react";

import { Button } from "@/components/ui/button";
import type { WorkoutSession } from "@/types/workoutDay.types";

type Props = {
    session: WorkoutSession;
    onEdit: (session: WorkoutSession) => void;
    onDelete: (session: WorkoutSession) => void;
};

function isFiniteNumber(value: unknown): value is number {
    return typeof value === "number" && Number.isFinite(value);
}

function formatDateTime(iso: string | null): string {
    if (!iso) return "—";

    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "—";

    return new Intl.DateTimeFormat("es-MX", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);
}

function formatDuration(seconds: number | null): string {
    if (!isFiniteNumber(seconds) || seconds <= 0) return "—";

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }

    return `${minutes}m`;
}

function formatDistanceKm(distanceKm: number | null): string {
    if (!isFiniteNumber(distanceKm) || distanceKm <= 0) return "—";
    return `${distanceKm.toFixed(2)} km`;
}

function formatPace(secPerKm: number | null): string {
    if (!isFiniteNumber(secPerKm) || secPerKm <= 0) return "—";

    const totalSeconds = Math.round(secPerKm);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${String(seconds).padStart(2, "0")} min/km`;
}

function formatNullableNumber(value: number | null, suffix?: string): string {
    if (!isFiniteNumber(value)) return "—";
    return suffix ? `${value} ${suffix}` : `${value}`;
}

function getSessionTitle(session: WorkoutSession): string {
    if (session.activityType === "walking") return "Walking";
    if (session.activityType === "running") return "Running";

    return session.type?.trim() || "Outdoor";
}

export function OutdoorSessionCard({ session, onEdit, onDelete }: Props) {
    const source = typeof session.meta?.source === "string" ? session.meta.source : null;
    const sourceDevice =
        typeof session.meta?.sourceDevice === "string" ? session.meta.sourceDevice : null;
    const sessionKind =
        typeof session.meta?.sessionKind === "string" ? session.meta.sessionKind : null;

    return (
        <div className="rounded-2xl border bg-card p-4 space-y-4">
            <div className="flex flex-col gap-3 md:items-start md:justify-between">
                <div className="space-y-2 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-foreground">
                            {getSessionTitle(session)}
                        </h3>

                        {session.activityType ? (
                            <span className="rounded-full border bg-background px-2.5 py-1 text-xs text-muted-foreground">
                                {session.activityType === "walking" ? "Walking" : "Running"}
                            </span>
                        ) : null}

                        {sessionKind ? (
                            <span className="rounded-full border bg-background px-2.5 py-1 text-xs text-muted-foreground">
                                {sessionKind}
                            </span>
                        ) : null}

                        {source ? (
                            <span className="rounded-full border bg-background px-2.5 py-1 text-xs text-muted-foreground">
                                {source}
                            </span>
                        ) : null}
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 xl:grid-cols-4">
                        <Metric label="Inicio" value={formatDateTime(session.startAt)} />
                        <Metric label="Fin" value={formatDateTime(session.endAt)} />
                        <Metric label="Duración" value={formatDuration(session.durationSeconds)} />
                        <Metric label="Distancia" value={formatDistanceKm(session.distanceKm)} />

                        <Metric label="Pasos" value={formatNullableNumber(session.steps)} />
                        <Metric label="Kcal activas" value={formatNullableNumber(session.activeKcal)} />
                        <Metric label="FC prom" value={formatNullableNumber(session.avgHr)} />
                        <Metric label="FC máx" value={formatNullableNumber(session.maxHr)} />

                        <Metric label="Ritmo" value={formatPace(session.paceSecPerKm)} />
                        <Metric label="Cadencia" value={formatNullableNumber(session.cadenceRpm, "rpm")} />
                        <Metric label="Elevación" value={formatNullableNumber(session.elevationGainM, "m")} />
                        <Metric label="Dispositivo" value={sourceDevice ?? "—"} />

                        <Metric
                            label="Vel. prom"
                            value={formatNullableNumber(session.outdoorMetrics?.avgSpeedKmh ?? null, "km/h")}
                        />
                        <Metric
                            label="Vel. máx"
                            value={formatNullableNumber(session.outdoorMetrics?.maxSpeedKmh ?? null, "km/h")}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 xl:grid-cols-4">
                        <Metric label="Ruta" value={session.hasRoute ? "Sí" : "No"} />
                        <Metric
                            label="Puntos de ruta"
                            value={formatNullableNumber(session.routeSummary?.pointCount ?? null)}
                        />
                    </div>

                    <div className="rounded-xl border bg-background p-3">
                        <div className="text-xs font-medium text-muted-foreground">Notas</div>
                        <div className="mt-1 text-sm text-foreground whitespace-pre-wrap">
                            {session.notes?.trim() ? session.notes : "—"}
                        </div>
                    </div>
                </div>

                <div className="flex shrink-0 gap-2 self-center md:self-end md:w-[35]">
                    <Button type="button" variant="outline" onClick={() => onEdit(session)}>
                        Editar
                    </Button>

                    <Button type="button" variant="destructive" onClick={() => onDelete(session)}>
                        Eliminar
                    </Button>
                </div>
            </div>
        </div>
    );
}

function Metric({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl border bg-background px-3 py-2">
            <div className="text-[11px] font-medium text-muted-foreground">{label}</div>
            <div className="mt-1 text-xs sm:text-sm font-medium text-foreground">{value}</div>
        </div>
    );
}
// src/components/outdoor/OutdoorDaySummaryCard.tsx

/**
 * OutdoorDaySummaryCard
 *
 * Lightweight dashboard summary for the selected day.
 * This is intentionally small and focused:
 * - sessions
 * - duration
 * - distance
 * - steps
 * - active kcal
 */

import React from "react";

import type { OutdoorDayStats } from "@/types/outdoor.types";

type Props = {
    stats: OutdoorDayStats;
};

function isFiniteNumber(value: unknown): value is number {
    return typeof value === "number" && Number.isFinite(value);
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

function formatDistance(distanceKm: number | null): string {
    if (!isFiniteNumber(distanceKm) || distanceKm <= 0) return "—";
    return `${distanceKm.toFixed(2)} km`;
}

function formatInt(value: number | null): string {
    if (!isFiniteNumber(value) || value <= 0) return "—";
    return Math.round(value).toLocaleString();
}

export function OutdoorDaySummaryCard({ stats }: Props) {
    return (
        <div className="rounded-2xl border bg-card p-4 space-y-4">
            <div>
                <h2 className="text-base font-semibold text-foreground">
                    Dashboard outdoor del día
                </h2>
                <p className="text-sm text-muted-foreground">
                    Resumen rápido de walking y running para la fecha seleccionada.
                </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 xl:grid-cols-5">
                <Metric label="Sesiones" value={String(stats.sessionsCount)} />
                <Metric label="Duración total" value={formatDuration(stats.totalDurationSeconds)} />
                <Metric label="Distancia total" value={formatDistance(stats.totalDistanceKm)} />
                <Metric label="Pasos totales" value={formatInt(stats.totalSteps)} />
                <Metric label="Kcal activas" value={formatInt(stats.totalActiveKcal)} />
            </div>
        </div>
    );
}

function Metric({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl border bg-background px-3 py-3">
            <div className="text-xs font-medium text-muted-foreground">{label}</div>
            <div className="mt-1 text-lg font-semibold text-foreground">{value}</div>
        </div>
    );
}
// src/components/cardio/CardioDaySummaryCard.tsx
// MUI daily Cardio dashboard summary for walking/running indoor and outdoor.

import Box from "@mui/material/Box";

import { AppCard, AppMetricCard } from "@/components/mui";
import type { CardioDayStats } from "@/types/cardio.types";

type Props = {
    stats: CardioDayStats;
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

export function CardioDaySummaryCard({ stats }: Props) {
    return (
        <AppCard
            title="Dashboard Cardio del día"
            subtitle="Resumen rápido de walking/running indoor y outdoor para la fecha seleccionada."
        >
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: {
                        xs: "repeat(2, minmax(0, 1fr))",
                        sm: "repeat(4, minmax(0, 1fr))",
                        xl: "repeat(8, minmax(0, 1fr))",
                    },
                    gap: { xs: 1.25, md: 1.5 },
                }}
            >
                <AppMetricCard compact label="Sesiones" value={String(stats.sessionsCount)} />
                <AppMetricCard compact label="Outdoor" value={String(stats.outdoorSessions)} />
                <AppMetricCard compact label="Indoor" value={String(stats.indoorSessions)} />
                <AppMetricCard compact label="Walking" value={String(stats.walkingSessions)} />
                <AppMetricCard compact label="Running" value={String(stats.runningSessions)} />
                <AppMetricCard compact label="Duración" value={formatDuration(stats.totalDurationSeconds)} />
                <AppMetricCard compact label="Distancia" value={formatDistance(stats.totalDistanceKm)} />
                <AppMetricCard compact label="Kcal activas" value={formatInt(stats.totalActiveKcal)} />
            </Box>
        </AppCard>
    );
}

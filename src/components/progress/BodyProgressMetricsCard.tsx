// src/components/progress/BodyProgressMetricsCard.tsx
// MUI card with body progress comparison metrics.

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { AppCard, AppMetricCard } from "@/components/mui";
import type { BodyProgressMetric } from "@/types/bodyProgress.types";

function formatMetricValue(value: number | null, unit: "kg" | "percent" | "cm"): string {
    if (value === null || Number.isNaN(value)) return "—";
    if (unit === "percent") return `${value.toFixed(1)}%`;
    if (unit === "cm") return `${value.toFixed(1)} cm`;
    return `${value.toFixed(1)} kg`;
}

function formatDelta(metric: BodyProgressMetric): string {
    if (metric.deltaVsPrevious === null && metric.percentDeltaVsPrevious === null) return "Sin comparación";
    if (metric.unit === "percent") {
        const value = metric.deltaVsPrevious ?? 0;
        return `${value > 0 ? "+" : ""}${value.toFixed(1)} pts`;
    }
    if (metric.percentDeltaVsPrevious !== null) {
        const value = metric.percentDeltaVsPrevious;
        return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
    }
    return "Sin comparación";
}

function getTone(metric: BodyProgressMetric): "default" | "success" | "warning" {
    if (metric.deltaVsPrevious === null || Math.abs(metric.deltaVsPrevious) < 0.0001) return "default";
    if (metric.isPositiveWhenUp) return metric.deltaVsPrevious > 0 ? "success" : "warning";
    return metric.deltaVsPrevious < 0 ? "success" : "warning";
}

export function BodyProgressMetricsCard({
    title,
    subtitle,
    metrics,
}: {
    title: string;
    subtitle: string;
    metrics: BodyProgressMetric[];
}) {
    return (
        <AppCard title={title} subtitle={subtitle}>
            {metrics.length ? (
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", xl: "repeat(3, minmax(0, 1fr))" },
                        gap: 1,
                    }}
                >
                    {metrics.map((metric) => (
                        <AppMetricCard
                            key={metric.key}
                            label={metric.label}
                            value={formatMetricValue(metric.currentLatest, metric.unit)}
                            helper={formatDelta(metric)}
                            tone={getTone(metric)}
                            compact
                        />
                    ))}
                </Box>
            ) : (
                <Typography variant="body2" color="text.secondary">Sin métricas corporales comparables.</Typography>
            )}
        </AppCard>
    );
}

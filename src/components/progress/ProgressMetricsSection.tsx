// src/components/progress/ProgressMetricsSection.tsx
// MUI metric grid for workout progress groups.

import Box from "@mui/material/Box";

import { AppCard, AppMetricCard } from "@/components/mui";
import type { WorkoutProgressMetric } from "@/types/workoutProgress.types";
import { formatMetricDelta, formatMetricValue, getTrendTone } from "./progressFormatters";

type Props = {
    title: string;
    subtitle: string;
    metrics: WorkoutProgressMetric[];
};

function mapTone(metric: WorkoutProgressMetric): "default" | "success" | "warning" {
    const tone = getTrendTone(metric.delta, metric.isPositiveWhenUp);
    if (tone === "positive") return "success";
    if (tone === "attention") return "warning";
    return "default";
}

export function ProgressMetricsSection({ title, subtitle, metrics }: Props) {
    return (
        <AppCard title={title} subtitle={subtitle}>
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(3, minmax(0, 1fr))" },
                    gap: 1,
                }}
            >
                {metrics.map((metric) => (
                    <AppMetricCard
                        key={metric.key}
                        compact
                        label={metric.shortLabel ?? metric.label}
                        value={formatMetricValue(metric)}
                        helper={formatMetricDelta(metric)}
                        tone={mapTone(metric)}
                    />
                ))}
            </Box>
        </AppCard>
    );
}

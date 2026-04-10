// src/components/progress/BodyProgressMetricsCard.tsx

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { BodyProgressMetric } from "@/types/bodyProgress.types";

function formatMetricValue(value: number | null, unit: "kg" | "percent" | "cm"): string {
    if (value === null || Number.isNaN(value)) {
        return "—";
    }

    if (unit === "percent") {
        return `${value.toFixed(1)}%`;
    }

    if (unit === "cm") {
        return `${value.toFixed(1)} cm`;
    }

    return `${value.toFixed(1)} kg`;
}

function formatDelta(metric: BodyProgressMetric): string {
    if (metric.deltaVsPrevious === null && metric.percentDeltaVsPrevious === null) {
        return "Sin comparación";
    }

    if (metric.unit === "percent") {
        const value = metric.deltaVsPrevious ?? 0;
        const prefix = value > 0 ? "+" : "";
        return `${prefix}${value.toFixed(1)} pts`;
    }

    if (metric.percentDeltaVsPrevious !== null) {
        const value = metric.percentDeltaVsPrevious;
        const prefix = value > 0 ? "+" : "";
        return `${prefix}${value.toFixed(1)}%`;
    }

    return "Sin comparación";
}

function getToneClasses(metric: BodyProgressMetric): string {
    if (metric.deltaVsPrevious === null || Math.abs(metric.deltaVsPrevious) < 0.0001) {
        return "text-muted-foreground";
    }

    if (metric.isPositiveWhenUp) {
        return metric.deltaVsPrevious > 0 ? "text-primary" : "text-amber-600";
    }

    return metric.deltaVsPrevious < 0 ? "text-primary" : "text-amber-600";
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
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{subtitle}</CardDescription>
            </CardHeader>

            <CardContent>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {metrics.map((metric) => (
                        <div
                            key={metric.key}
                            className="rounded-xl border bg-background p-4"
                        >
                            <div className="text-xs font-semibold text-muted-foreground">
                                {metric.label}
                            </div>

                            <div className="mt-1 text-xl font-semibold">
                                {formatMetricValue(metric.currentLatest, metric.unit)}
                            </div>

                            <div className={`mt-1 text-sm font-semibold ${getToneClasses(metric)}`}>
                                {formatDelta(metric)}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
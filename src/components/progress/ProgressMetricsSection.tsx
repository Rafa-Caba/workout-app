// src/components/progress/ProgressMetricsSection.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { WorkoutProgressMetric } from "@/types/workoutProgress.types";
import {
    formatMetricDelta,
    formatMetricValue,
    getTrendTone,
} from "./progressFormatters";
import { cn } from "@/lib/utils";
import { themedPanelCard, themedNestedCard } from "@/theme/cardHierarchy";

type Props = {
    title: string;
    subtitle: string;
    metrics: WorkoutProgressMetric[];
};

export function ProgressMetricsSection({ title, subtitle, metrics }: Props) {
    return (
        <Card className={themedPanelCard}>
            <CardHeader>
                <CardTitle className="text-base">{title}</CardTitle>
                <p className="text-sm text-muted-foreground">{subtitle}</p>
            </CardHeader>

            <CardContent>
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-5 xl:grid-cols-3">
                    {metrics.map((metric) => {
                        const tone = getTrendTone(metric.delta, metric.isPositiveWhenUp);

                        const toneClass =
                            tone === "positive"
                                ? "text-emerald-600"
                                : tone === "attention"
                                    ? "text-amber-600"
                                    : "text-muted-foreground";

                        return (
                            <div key={metric.key} className={cn("rounded-xl border p-3 space-y-1", themedNestedCard)}>
                                <div className="text-xs font-semibold text-muted-foreground">
                                    {metric.shortLabel ?? metric.label}
                                </div>
                                <div className="text-xl font-semibold">
                                    {formatMetricValue(metric)}
                                </div>
                                <div className={`text-xs font-semibold ${toneClass}`}>
                                    {formatMetricDelta(metric)}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
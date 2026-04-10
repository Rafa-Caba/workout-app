// src/components/progress/ExerciseProgressSection.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";
import { themedPanelCard, themedNestedCard } from "@/theme/cardHierarchy";

import type {
    WorkoutExerciseComparisonBasis,
    WorkoutExerciseProgressItem,
} from "@/types/workoutProgress.types";
import {
    formatExerciseBasisLabel,
    formatUnitValue,
} from "./progressFormatters";

type FilterValue = WorkoutExerciseComparisonBasis | "all";

type Props = {
    items: WorkoutExerciseProgressItem[];
};

const FILTERS: FilterValue[] = [
    "all",
    "topSetLoad",
    "volumeLoad",
    "bestRepsAtSameLoad",
    "estimatedStrength",
];

export function ExerciseProgressSection({ items }: Props) {
    const [filter, setFilter] = React.useState<FilterValue>("all");

    const filteredItems = React.useMemo(() => {
        if (filter === "all") {
            return items;
        }

        return items.filter((item) => item.bestMetricKey === filter);
    }, [filter, items]);

    return (
        <Card className={themedPanelCard}>
            <CardHeader>
                <CardTitle className="text-base">Detalle por ejercicio</CardTitle>
                <p className="text-sm text-muted-foreground">
                    Progreso por movimiento comparando el periodo actual vs previo.
                </p>
            </CardHeader>

            <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                    {FILTERS.map((option) => {
                        const active = option === filter;
                        const label = option === "all" ? "Todo" : formatExerciseBasisLabel(option);

                        return (
                            <Button
                                key={option}
                                type="button"
                                variant={active ? "default" : "outline"}
                                onClick={() => setFilter(option)}
                            >
                                {label}
                            </Button>
                        );
                    })}
                </div>

                <div className="space-y-3">
                    {filteredItems.length ? (
                        filteredItems.slice(0, 10).map((item) => {
                            const bestMetric = item.metrics.find(
                                (metric) => metric.key === item.bestMetricKey
                            );

                            return (
                                <div
                                    key={item.exerciseKey}
                                    className={cn("rounded-xl border p-3 flex items-center gap-3", themedNestedCard)}
                                >
                                    <div className="flex-1 min-w-0 space-y-1">
                                        <div className="font-semibold truncate">{item.exerciseLabel}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {item.bestMetricKey
                                                ? formatExerciseBasisLabel(item.bestMetricKey)
                                                : "Sin base comparable"}
                                        </div>
                                    </div>

                                    <div className="text-right shrink-0">
                                        <div className="font-semibold text-primary">
                                            {bestMetric?.percentDelta !== null &&
                                                bestMetric?.percentDelta !== undefined
                                                ? `${bestMetric.percentDelta > 0 ? "+" : ""}${bestMetric.percentDelta.toFixed(1)}%`
                                                : "—"}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {bestMetric
                                                ? `${formatUnitValue(bestMetric.previous, bestMetric.unit)} → ${formatUnitValue(bestMetric.current, bestMetric.unit)}`
                                                : "Sin comparación"}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-sm text-muted-foreground">
                            No hay ejercicios para el filtro seleccionado.
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
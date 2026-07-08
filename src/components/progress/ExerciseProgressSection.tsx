// src/components/progress/ExerciseProgressSection.tsx
// MUI filterable exercise progress details.

import React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

import { AppCard } from "@/components/mui";
import type { WorkoutExerciseComparisonBasis, WorkoutExerciseProgressItem } from "@/types/workoutProgress.types";
import { formatExerciseBasisLabel, formatUnitValue } from "./progressFormatters";

type FilterValue = WorkoutExerciseComparisonBasis | "all";

type Props = {
    items: WorkoutExerciseProgressItem[];
};

const FILTERS: FilterValue[] = ["all", "topSetLoad", "volumeLoad", "bestRepsAtSameLoad", "estimatedStrength"];

export function ExerciseProgressSection({ items }: Props) {
    const [filter, setFilter] = React.useState<FilterValue>("all");

    const filteredItems = React.useMemo(() => {
        if (filter === "all") return items;
        return items.filter((item) => item.bestMetricKey === filter);
    }, [filter, items]);

    return (
        <AppCard title="Detalle por ejercicio" subtitle="Progreso por movimiento comparando el periodo actual vs previo.">
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 1.5 }}>
                {FILTERS.map((option) => {
                    const active = option === filter;
                    const label = option === "all" ? "Todo" : formatExerciseBasisLabel(option);

                    return (
                        <Button
                            key={option}
                            type="button"
                            size="small"
                            variant={active ? "contained" : "outlined"}
                            onClick={() => setFilter(option)}
                        >
                            {label}
                        </Button>
                    );
                })}
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {filteredItems.length ? (
                    filteredItems.slice(0, 10).map((item) => {
                        const bestMetric = item.metrics.find((metric) => metric.key === item.bestMetricKey);

                        return (
                            <Box
                                key={item.exerciseKey}
                                sx={{ display: "flex", alignItems: "center", gap: 1.5, border: 1, borderColor: "divider", borderRadius: 2, p: 1.25, bgcolor: "background.default" }}
                            >
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }} noWrap>{item.exerciseLabel}</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {item.bestMetricKey ? formatExerciseBasisLabel(item.bestMetricKey) : "Sin base comparable"}
                                    </Typography>
                                </Box>

                                <Box sx={{ textAlign: "right", flexShrink: 0 }}>
                                    <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 800 }}>
                                        {bestMetric?.percentDelta !== null && bestMetric?.percentDelta !== undefined
                                            ? `${bestMetric.percentDelta > 0 ? "+" : ""}${bestMetric.percentDelta.toFixed(1)}%`
                                            : "—"}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {bestMetric ? `${formatUnitValue(bestMetric.previous, bestMetric.unit)} → ${formatUnitValue(bestMetric.current, bestMetric.unit)}` : "Sin comparación"}
                                    </Typography>
                                </Box>
                            </Box>
                        );
                    })
                ) : (
                    <Typography variant="body2" color="text.secondary">No hay ejercicios para el filtro seleccionado.</Typography>
                )}
            </Box>
        </AppCard>
    );
}

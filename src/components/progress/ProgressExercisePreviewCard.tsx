// src/components/progress/ProgressExercisePreviewCard.tsx
import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { WorkoutProgressOverviewResponse } from "@/types/workoutProgress.types";
import { Button } from "@/components/ui/button";
import { formatExerciseBasisLabel } from "./progressFormatters";

type Props = {
    data: WorkoutProgressOverviewResponse | null;
    isLoading?: boolean;
};

export function ProgressExercisePreviewCard({
    data,
    isLoading = false,
}: Props) {
    const rows = data?.exerciseTable ?? [];

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Progreso</CardTitle>
                <p className="text-sm text-muted-foreground">
                    Preview rápido de las mejores mejoras del periodo.
                </p>
            </CardHeader>

            <CardContent className="space-y-3">
                {isLoading ? (
                    <div className="text-sm text-muted-foreground">Cargando progreso...</div>
                ) : rows.length ? (
                    <>
                        {rows.slice(0, 3).map((row) => (
                            <div
                                key={row.exerciseKey}
                                className="rounded-xl border bg-background p-3 flex items-center gap-3"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold truncate">{row.exerciseLabel}</div>
                                    <div className="text-xs text-muted-foreground">
                                        {formatExerciseBasisLabel(row.basis)}
                                    </div>
                                </div>

                                <div className="font-semibold text-primary shrink-0">
                                    {row.improvementPct !== null
                                        ? `${row.improvementPct > 0 ? "+" : ""}${row.improvementPct.toFixed(1)}%`
                                        : "—"}
                                </div>
                            </div>
                        ))}

                        <Button asChild variant="outline" className="w-full">
                            <Link to="/progress">Ver sección completa</Link>
                        </Button>
                    </>
                ) : (
                    <>
                        <div className="text-sm text-muted-foreground">
                            Aún no hay datos comparables suficientes para mostrar preview.
                        </div>

                        <Button asChild variant="outline" className="w-full">
                            <Link to="/progress">Abrir progreso</Link>
                        </Button>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
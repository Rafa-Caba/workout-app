// src/components/progress/ProgressExerciseTableCard.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { WorkoutProgressExerciseTableRow } from "@/types/workoutProgress.types";
import {
    formatExerciseBasisLabel,
    formatUnitValue,
} from "./progressFormatters";

type Props = {
    rows: WorkoutProgressExerciseTableRow[];
};

export function ProgressExerciseTableCard({ rows }: Props) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Top ejercicios</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
                {!rows.length ? (
                    <div className="text-sm text-muted-foreground">
                        Todavía no hay comparaciones suficientes.
                    </div>
                ) : (
                    rows.map((row) => {
                        const improvementText =
                            row.improvementPct !== null
                                ? `${row.improvementPct > 0 ? "+" : ""}${row.improvementPct.toFixed(1)}%`
                                : row.improvementAbsolute !== null
                                    ? `${row.improvementAbsolute > 0 ? "+" : ""}${formatUnitValue(
                                        row.improvementAbsolute,
                                        row.unit
                                    )}`
                                    : "—";

                        return (
                            <div
                                key={row.exerciseKey}
                                className="rounded-xl border bg-background p-3 flex items-center gap-3"
                            >
                                <div className="flex-1 space-y-1 min-w-0">
                                    <div className="font-semibold truncate">{row.exerciseLabel}</div>
                                    <div className="text-xs text-muted-foreground">
                                        {formatExerciseBasisLabel(row.basis)} · {row.periodLabel}
                                    </div>
                                </div>

                                <div className="text-right shrink-0">
                                    <div className="font-semibold text-primary">{improvementText}</div>
                                    <div className="text-xs text-muted-foreground">
                                        {formatUnitValue(row.previous, row.unit)} →{" "}
                                        {formatUnitValue(row.current, row.unit)}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </CardContent>
        </Card>
    );
}
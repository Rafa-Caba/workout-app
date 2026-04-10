// src/components/progress/SessionTypeProgressCard.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { cn } from "@/lib/utils";
import { themedPanelCard, themedNestedCard } from "@/theme/cardHierarchy";

import type { WorkoutSessionTypeProgressItem } from "@/types/workoutProgress.types";
import { formatMetricDelta, formatMetricValue } from "./progressFormatters";

type Props = {
    items: WorkoutSessionTypeProgressItem[];
};

export function SessionTypeProgressCard({ items }: Props) {
    return (
        <Card className={themedPanelCard}>
            <CardHeader>
                <CardTitle className="text-base">Progreso por tipo de sesión</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3 grid sm:grid-cols-2 xl:grid-cols-3 sm:gap-3">
                {!items.length ? (
                    <div className="text-sm text-muted-foreground">
                        No hay tipos de sesión comparables todavía.
                    </div>
                ) : (
                    items.slice(0, 8).map((item) => (
                        <div
                            key={item.sessionType}
                            className={cn("rounded-xl border p-3 flex items-center gap-3", themedNestedCard)}
                        >
                            <div className="flex-1 min-w-0 space-y-1">
                                <div className="font-semibold truncate">{item.sessionType}</div>
                                <div className="text-xs text-muted-foreground">
                                    {formatMetricValue(item.sessionsCount)} ·{" "}
                                    {formatMetricDelta(item.sessionsCount)}
                                </div>
                            </div>

                            <div className="text-right shrink-0 text-xs space-y-1">
                                <div>Duración: {formatMetricValue(item.durationSeconds)}</div>
                                <div>Kcal: {formatMetricValue(item.activeKcal)}</div>
                                {item.completionPct ? (
                                    <div className="font-semibold text-primary">
                                        Cumplimiento: {formatMetricValue(item.completionPct)}
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    ))
                )}
            </CardContent>
        </Card>
    );
}
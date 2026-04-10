// src/components/progress/TopExerciseHighlightsCard.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { themedPanelCard, themedNestedCard } from "@/theme/cardHierarchy";

import type { WorkoutExerciseHighlightsItem } from "@/types/workoutProgress.types";

type Props = {
    items: WorkoutExerciseHighlightsItem[];
};

export function TopExerciseHighlightsCard({ items }: Props) {
    return (
        <Card className={themedPanelCard}>
            <CardHeader>
                <CardTitle className="text-base">Highlights por ejercicio</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
                {!items.length ? (
                    <div className="text-sm text-muted-foreground">
                        Aún no hay mejoras comparables suficientes.
                    </div>
                ) : (
                    items.map((item) => (
                        <div key={item.id} className={cn("rounded-xl border p-3 space-y-1", themedNestedCard)}>
                            <div className="font-semibold">{item.title}</div>
                            <div className="text-sm text-muted-foreground">{item.message}</div>
                        </div>
                    ))
                )}
            </CardContent>
        </Card>
    );
}
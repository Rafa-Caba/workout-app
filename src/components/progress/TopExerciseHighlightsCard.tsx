// src/components/progress/TopExerciseHighlightsCard.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { WorkoutExerciseHighlightsItem } from "@/types/workoutProgress.types";

type Props = {
    items: WorkoutExerciseHighlightsItem[];
};

export function TopExerciseHighlightsCard({ items }: Props) {
    return (
        <Card>
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
                        <div key={item.id} className="rounded-xl border bg-background p-3 space-y-1">
                            <div className="font-semibold">{item.title}</div>
                            <div className="text-sm text-muted-foreground">{item.message}</div>
                        </div>
                    ))
                )}
            </CardContent>
        </Card>
    );
}
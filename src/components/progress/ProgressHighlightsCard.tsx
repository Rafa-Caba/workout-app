// src/components/progress/ProgressHighlightsCard.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { WorkoutProgressHighlightsItem } from "@/types/workoutProgress.types";
import { cn } from "@/lib/utils";
import { themedPanelCard, themedNestedCard } from "@/theme/cardHierarchy";

type Props = {
    title?: string;
    items: WorkoutProgressHighlightsItem[];
};

export function ProgressHighlightsCard({
    title = "Highlights",
    items,
}: Props) {
    return (
        <Card className={themedPanelCard}>
            <CardHeader>
                <CardTitle className="text-base">{title}</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
                {items.map((item) => {
                    const dotClass =
                        item.tone === "positive"
                            ? "bg-emerald-500"
                            : item.tone === "attention"
                                ? "bg-amber-500"
                                : "bg-muted-foreground";

                    return (
                        <div key={item.id} className={cn("rounded-xl border p-3 flex gap-3", themedNestedCard)}>
                            <div className={`mt-1 h-2.5 w-2.5 rounded-full shrink-0 ${dotClass}`} />
                            <div className="space-y-1">
                                <div className="font-semibold">{item.title}</div>
                                <div className="text-sm text-muted-foreground">{item.message}</div>
                            </div>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}
// src/components/progress/ProgressHeroCard.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
    WorkoutProgressComparisonRange,
    WorkoutProgressHero,
} from "@/types/workoutProgress.types";
import { formatRangeLabel } from "./progressFormatters";

type Props = {
    hero: WorkoutProgressHero;
    range: WorkoutProgressComparisonRange;
    compareRange: WorkoutProgressComparisonRange | null;
};

export function ProgressHeroCard({ hero, range, compareRange }: Props) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">{hero.title}</CardTitle>
                <p className="text-sm text-muted-foreground">{hero.subtitle}</p>
            </CardHeader>

            <CardContent className="space-y-4">
                <div className="rounded-xl border bg-background p-3 text-sm space-y-2">
                    <div>
                        <span className="font-semibold">Rango actual:</span>{" "}
                        <span className="font-mono">{formatRangeLabel(range)}</span>
                    </div>

                    {compareRange ? (
                        <div>
                            <span className="font-semibold">Comparado:</span>{" "}
                            <span className="font-mono">{formatRangeLabel(compareRange)}</span>
                        </div>
                    ) : null}
                </div>

                {hero.items.length ? (
                    <div className="flex flex-wrap gap-2">
                        {hero.items.map((item) => (
                            <span
                                key={item}
                                className="rounded-full border bg-background px-3 py-1 text-xs font-semibold"
                            >
                                {item}
                            </span>
                        ))}
                    </div>
                ) : null}

                <div className="space-y-2">
                    <p className="font-semibold">{hero.message}</p>

                    {hero.bullets.map((bullet) => (
                        <p key={bullet} className="text-sm text-muted-foreground">
                            • {bullet}
                        </p>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
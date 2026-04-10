// src/components/progress/BodyProgressHighlightsCard.tsx

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BodyProgressHighlight } from "@/types/bodyProgress.types";

function getToneClasses(tone: BodyProgressHighlight["tone"]): string {
    if (tone === "positive") return "text-primary";
    if (tone === "attention") return "text-amber-600";
    return "text-muted-foreground";
}

export function BodyProgressHighlightsCard({
    title,
    items,
}: {
    title: string;
    items: BodyProgressHighlight[];
}) {
    if (!items.length) {
        return null;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
                {items.map((item) => (
                    <div
                        key={item.id}
                        className="rounded-xl border bg-background p-4"
                    >
                        <div className={`font-semibold ${getToneClasses(item.tone)}`}>
                            {item.title}
                        </div>
                        <div className="mt-1 text-sm text-foreground">{item.message}</div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
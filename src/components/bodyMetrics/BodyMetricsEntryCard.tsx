// src/components/bodyMetrics/BodyMetricsEntryCard.tsx

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { UserMetricEntry } from "@/types/bodyMetrics.types";

function formatValue(value: number | null, suffix: string): string {
    if (value === null || Number.isNaN(value)) {
        return "—";
    }

    return `${value.toFixed(1)} ${suffix}`.trim();
}

export function BodyMetricsEntryCard({
    entry,
    onEdit,
    onDelete,
}: {
    entry: UserMetricEntry;
    onEdit: () => void;
    onDelete: () => void;
}) {
    return (
        <Card>
            <CardContent className="p-0">
                <div className="space-y-4 px-4 pb-4 pt-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-1">
                            <div className="text-base font-semibold leading-none tracking-tight">
                                {entry.date}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                Fuente: {entry.source}
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Button variant="outline" onClick={onEdit}>
                                Editar
                            </Button>
                            <Button variant="destructive" onClick={onDelete}>
                                Eliminar
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2 rounded-xl border bg-background p-3 text-sm sm:grid-cols-3">
                        <div className="grid grid-cols-[1fr_auto] items-center gap-3">
                            <span className="text-muted-foreground">Peso</span>
                            <span className="font-medium">{formatValue(entry.weightKg, "kg")}</span>
                        </div>

                        <div className="grid grid-cols-[1fr_auto] items-center gap-3">
                            <span className="text-muted-foreground">Grasa corporal</span>
                            <span className="font-medium">{formatValue(entry.bodyFatPct, "%")}</span>
                        </div>

                        <div className="grid grid-cols-[1fr_auto] items-center gap-3">
                            <span className="text-muted-foreground">Cintura</span>
                            <span className="font-medium">{formatValue(entry.waistCm, "cm")}</span>
                        </div>
                    </div>

                    {entry.notes ? (
                        <div className="rounded-xl border bg-background p-3">
                            <div className="mb-1 text-xs font-semibold text-muted-foreground">
                                Notas
                            </div>
                            <div className="whitespace-pre-wrap text-sm">{entry.notes}</div>
                        </div>
                    ) : null}

                    {entry.customMetrics.length ? (
                        <div className="flex flex-wrap gap-2">
                            {entry.customMetrics.map((metric) => (
                                <div
                                    key={`${entry.id}-${metric.key}`}
                                    className="rounded-full border bg-background px-3 py-1.5 text-xs font-medium"
                                >
                                    {metric.label}: {metric.value} {metric.unit}
                                </div>
                            ))}
                        </div>
                    ) : null}
                </div>
            </CardContent>
        </Card>
    );
}
// src/components/bodyMetrics/BodyMetricsHeroCard.tsx

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { UserMetricEntry } from "@/types/bodyMetrics.types";

function formatMetricValue(
    value: number | null,
    unit: "kg" | "%" | "cm"
): string {
    if (value === null || Number.isNaN(value)) {
        return "—";
    }

    if (unit === "%") {
        return `${value.toFixed(1)}%`;
    }

    return `${value.toFixed(1)} ${unit}`;
}

export function BodyMetricsHeroCard({
    latest,
    onCreate,
}: {
    latest: UserMetricEntry | null;
    onCreate: () => void;
}) {
    return (
        <Card className="border-primary/40 bg-primary/10">
            <CardHeader>
                <CardTitle>Métricas corporales</CardTitle>
                <CardDescription>
                    Sigue tu evolución corporal y úsala dentro del módulo de progreso.
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
                <div className="rounded-xl border bg-background p-4">
                    <div className="mb-3 text-sm font-semibold">
                        {latest ? `Último registro: ${latest.date}` : "Sin registros todavía"}
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-lg border bg-card p-3">
                            <div className="text-xs font-semibold text-muted-foreground">Peso</div>
                            <div className="mt-1 text-lg font-semibold">
                                {formatMetricValue(latest?.weightKg ?? null, "kg")}
                            </div>
                        </div>

                        <div className="rounded-lg border bg-card p-3">
                            <div className="text-xs font-semibold text-muted-foreground">Grasa corporal</div>
                            <div className="mt-1 text-lg font-semibold">
                                {formatMetricValue(latest?.bodyFatPct ?? null, "%")}
                            </div>
                        </div>

                        <div className="rounded-lg border bg-card p-3">
                            <div className="text-xs font-semibold text-muted-foreground">Cintura</div>
                            <div className="mt-1 text-lg font-semibold">
                                {formatMetricValue(latest?.waistCm ?? null, "cm")}
                            </div>
                        </div>

                        <div className="rounded-lg border bg-card p-3">
                            <div className="text-xs font-semibold text-muted-foreground">Origen</div>
                            <div className="mt-1 text-lg font-semibold">
                                {latest?.source ?? "—"}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <Button onClick={onCreate}>Nuevo registro</Button>
                </div>
            </CardContent>
        </Card>
    );
}
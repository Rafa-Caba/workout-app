// src/components/bodyMetrics/BodyMetricsEmptyState.tsx

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BodyMetricsIllustration } from "./BodyMetricsIllustration";

export function BodyMetricsEmptyState({
    onCreate,
}: {
    onCreate: () => void;
}) {
    return (
        <Card>
            <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
                <BodyMetricsIllustration />

                <div className="space-y-2">
                    <div className="text-lg font-semibold">
                        Aún no has registrado métricas corporales
                    </div>
                    <div className="mx-auto max-w-xl text-sm text-muted-foreground">
                        Empieza con tu peso, cintura o porcentaje de grasa para enriquecer el módulo de progreso y comparar cambios entre periodos.
                    </div>
                </div>

                <Button onClick={onCreate}>Crear primer registro</Button>
            </CardContent>
        </Card>
    );
}
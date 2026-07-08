// src/components/bodyMetrics/BodyMetricsEmptyState.tsx
// MUI empty state for body metrics history.

import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

import { AppCard } from "@/components/mui";
import { BodyMetricsIllustration } from "./BodyMetricsIllustration";

export function BodyMetricsEmptyState({ onCreate }: { onCreate: () => void }) {
    return (
        <AppCard
            padding="lg"
            contentSx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
                textAlign: "center",
            }}
        >
            <BodyMetricsIllustration />

            <div>
                <Typography variant="h6" component="h2" sx={{ fontWeight: 800 }}>
                    Aún no has registrado métricas corporales
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, maxWidth: 640 }}>
                    Empieza con tu peso, cintura o porcentaje de grasa para enriquecer el módulo de progreso y comparar cambios entre periodos.
                </Typography>
            </div>

            <Button variant="contained" onClick={onCreate}>
                Crear primer registro
            </Button>
        </AppCard>
    );
}

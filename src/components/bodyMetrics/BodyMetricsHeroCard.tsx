// src/components/bodyMetrics/BodyMetricsHeroCard.tsx
// MUI hero card for the latest body metrics entry.

import Button from "@mui/material/Button";
import Box from "@mui/material/Box";

import { AppCard, AppMetricCard } from "@/components/mui";
import type { UserMetricEntry } from "@/types/bodyMetrics.types";

function formatMetricValue(value: number | null, unit: "kg" | "%" | "cm"): string {
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
        <AppCard
            title="Métricas corporales"
            subtitle="Sigue tu evolución corporal y úsala dentro del módulo de progreso."
            tone="accent"
            action={<Button variant="contained" onClick={onCreate}>Nuevo registro</Button>}
        >
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: {
                        xs: "1fr 1fr",
                        md: "repeat(4, minmax(0, 1fr))",
                    },
                    gap: { xs: 1, md: 1.25 },
                }}
            >
                <AppMetricCard
                    compact
                    label="Peso"
                    value={formatMetricValue(latest?.weightKg ?? null, "kg")}
                    helper={latest ? `Último: ${latest.date}` : "Sin registros"}
                />
                <AppMetricCard
                    compact
                    label="Grasa corporal"
                    value={formatMetricValue(latest?.bodyFatPct ?? null, "%")}
                />
                <AppMetricCard
                    compact
                    label="Cintura"
                    value={formatMetricValue(latest?.waistCm ?? null, "cm")}
                />
                <AppMetricCard compact label="Origen" value={latest?.source ?? "—"} />
            </Box>
        </AppCard>
    );
}

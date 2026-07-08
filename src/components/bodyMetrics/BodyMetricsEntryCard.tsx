// src/components/bodyMetrics/BodyMetricsEntryCard.tsx
// MUI card for a saved body metric entry.

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";

import { AppActionRow, AppCard, AppMetricCard } from "@/components/mui";
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
        <AppCard
            title={entry.date}
            subtitle={`Fuente: ${entry.source}`}
            action={
                <AppActionRow dense>
                    <Button variant="outlined" onClick={onEdit}>Editar</Button>
                    <Button variant="contained" color="error" onClick={onDelete}>Eliminar</Button>
                </AppActionRow>
            }
        >
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" },
                    gap: 1,
                }}
            >
                <AppMetricCard compact label="Peso" value={formatValue(entry.weightKg, "kg")} />
                <AppMetricCard compact label="Grasa corporal" value={formatValue(entry.bodyFatPct, "%")} />
                <AppMetricCard compact label="Cintura" value={formatValue(entry.waistCm, "cm")} />
            </Box>

            {entry.notes ? (
                <Box sx={{ mt: 1.25, p: 1.25, border: 1, borderColor: "divider", borderRadius: 2, bgcolor: "background.default" }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
                        Notas
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: "pre-wrap" }}>
                        {entry.notes}
                    </Typography>
                </Box>
            ) : null}

            {entry.customMetrics.length ? (
                <Box sx={{ mt: 1.25, display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                    {entry.customMetrics.map((metric) => (
                        <Chip
                            key={`${entry.id}-${metric.key}`}
                            label={`${metric.label}: ${metric.value} ${metric.unit}`}
                            size="small"
                        />
                    ))}
                </Box>
            ) : null}
        </AppCard>
    );
}

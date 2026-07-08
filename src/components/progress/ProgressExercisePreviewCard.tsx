// src/components/progress/ProgressExercisePreviewCard.tsx
// MUI quick preview card for dashboard progress.

import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

import { AppCard } from "@/components/mui";
import type { WorkoutProgressOverviewResponse } from "@/types/workoutProgress.types";
import { formatExerciseBasisLabel } from "./progressFormatters";

type Props = {
    data: WorkoutProgressOverviewResponse | null;
    isLoading?: boolean;
};

export function ProgressExercisePreviewCard({ data, isLoading = false }: Props) {
    const navigate = useNavigate();
    const rows = data?.exerciseTable ?? [];

    return (
        <AppCard title="Progreso" subtitle="Preview rápido de las mejores mejoras del periodo.">
            {isLoading ? (
                <Typography variant="body2" color="text.secondary">Cargando progreso...</Typography>
            ) : rows.length ? (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    {rows.slice(0, 3).map((row) => (
                        <Box key={row.exerciseKey} sx={{ display: "flex", alignItems: "center", gap: 1.5, border: 1, borderColor: "divider", borderRadius: 2, p: 1.25, bgcolor: "background.default" }}>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800 }} noWrap>{row.exerciseLabel}</Typography>
                                <Typography variant="caption" color="text.secondary">{formatExerciseBasisLabel(row.basis)}</Typography>
                            </Box>
                            <Typography color="primary" sx={{ fontWeight: 800, flexShrink: 0 }}>
                                {row.improvementPct !== null ? `${row.improvementPct > 0 ? "+" : ""}${row.improvementPct.toFixed(1)}%` : "—"}
                            </Typography>
                        </Box>
                    ))}
                    <Button variant="outlined" fullWidth onClick={() => navigate("/progress")}>Ver sección completa</Button>
                </Box>
            ) : (
                <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                        Aún no hay datos comparables suficientes para mostrar preview.
                    </Typography>
                    <Button variant="outlined" fullWidth onClick={() => navigate("/progress")}>Abrir progreso</Button>
                </Box>
            )}
        </AppCard>
    );
}

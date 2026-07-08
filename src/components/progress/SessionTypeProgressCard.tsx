// src/components/progress/SessionTypeProgressCard.tsx
// MUI card for progress grouped by session type.

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { AppCard } from "@/components/mui";
import type { WorkoutSessionTypeProgressItem } from "@/types/workoutProgress.types";
import { formatMetricDelta, formatMetricValue } from "./progressFormatters";

type Props = {
    items: WorkoutSessionTypeProgressItem[];
};

export function SessionTypeProgressCard({ items }: Props) {
    return (
        <AppCard title="Progreso por tipo de sesión">
            {!items.length ? (
                <Typography variant="body2" color="text.secondary">No hay tipos de sesión comparables todavía.</Typography>
            ) : (
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", xl: "repeat(3, minmax(0, 1fr))" }, gap: 1 }}>
                    {items.slice(0, 8).map((item) => (
                        <Box
                            key={item.sessionType}
                            sx={{ display: "flex", gap: 1.5, border: 1, borderColor: "divider", borderRadius: 2, p: 1.25, bgcolor: "background.default" }}
                        >
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800 }} noWrap>{item.sessionType}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {formatMetricValue(item.sessionsCount)} · {formatMetricDelta(item.sessionsCount)}
                                </Typography>
                            </Box>

                            <Box sx={{ textAlign: "right", flexShrink: 0 }}>
                                <Typography variant="caption" sx={{ display: "block" }}>Duración: {formatMetricValue(item.durationSeconds)}</Typography>
                                <Typography variant="caption" sx={{ display: "block" }}>Kcal: {formatMetricValue(item.activeKcal)}</Typography>
                                {item.completionPct ? (
                                    <Typography variant="caption" color="primary" sx={{ display: "block", fontWeight: 800 }}>
                                        Cumplimiento: {formatMetricValue(item.completionPct)}
                                    </Typography>
                                ) : null}
                            </Box>
                        </Box>
                    ))}
                </Box>
            )}
        </AppCard>
    );
}

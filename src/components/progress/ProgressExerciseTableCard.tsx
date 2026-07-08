// src/components/progress/ProgressExerciseTableCard.tsx
// MUI top exercise comparison list.

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { AppCard } from "@/components/mui";
import type { WorkoutProgressExerciseTableRow } from "@/types/workoutProgress.types";
import { formatExerciseBasisLabel, formatUnitValue } from "./progressFormatters";

type Props = {
    rows: WorkoutProgressExerciseTableRow[];
};

export function ProgressExerciseTableCard({ rows }: Props) {
    return (
        <AppCard title="Top ejercicios">
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {!rows.length ? (
                    <Typography variant="body2" color="text.secondary">Todavía no hay comparaciones suficientes.</Typography>
                ) : (
                    rows.map((row) => {
                        const improvementText =
                            row.improvementPct !== null
                                ? `${row.improvementPct > 0 ? "+" : ""}${row.improvementPct.toFixed(1)}%`
                                : row.improvementAbsolute !== null
                                    ? `${row.improvementAbsolute > 0 ? "+" : ""}${formatUnitValue(row.improvementAbsolute, row.unit)}`
                                    : "—";

                        return (
                            <Box
                                key={row.exerciseKey}
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1.5,
                                    border: 1,
                                    borderColor: "divider",
                                    borderRadius: 2,
                                    p: 1.25,
                                    bgcolor: "background.default",
                                }}
                            >
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }} noWrap>{row.exerciseLabel}</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {formatExerciseBasisLabel(row.basis)} · {row.periodLabel}
                                    </Typography>
                                </Box>

                                <Box sx={{ textAlign: "right", flexShrink: 0 }}>
                                    <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 800 }}>{improvementText}</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {formatUnitValue(row.previous, row.unit)} → {formatUnitValue(row.current, row.unit)}
                                    </Typography>
                                </Box>
                            </Box>
                        );
                    })
                )}
            </Box>
        </AppCard>
    );
}

// src/components/progress/TopExerciseHighlightsCard.tsx
// MUI highlights by exercise.

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { AppCard } from "@/components/mui";
import type { WorkoutExerciseHighlightsItem } from "@/types/workoutProgress.types";

type Props = {
    items: WorkoutExerciseHighlightsItem[];
};

export function TopExerciseHighlightsCard({ items }: Props) {
    return (
        <AppCard title="Highlights por ejercicio">
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {!items.length ? (
                    <Typography variant="body2" color="text.secondary">Aún no hay mejoras comparables suficientes.</Typography>
                ) : (
                    items.map((item) => (
                        <Box key={item.id} sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 1.25, bgcolor: "background.default" }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{item.title}</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>{item.message}</Typography>
                        </Box>
                    ))
                )}
            </Box>
        </AppCard>
    );
}

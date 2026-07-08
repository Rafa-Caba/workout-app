// src/components/progress/ProgressHighlightsCard.tsx
// MUI highlights card for automatic workout progress insights.

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { AppCard } from "@/components/mui";
import type { WorkoutProgressHighlightsItem } from "@/types/workoutProgress.types";

type Props = {
    title?: string;
    items: WorkoutProgressHighlightsItem[];
};

function dotColor(tone: WorkoutProgressHighlightsItem["tone"]): string {
    if (tone === "positive") return "success.main";
    if (tone === "attention") return "warning.main";
    return "text.secondary";
}

export function ProgressHighlightsCard({ title = "Highlights", items }: Props) {
    return (
        <AppCard title={title}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {items.length ? (
                    items.map((item) => (
                        <Box
                            key={item.id}
                            sx={{
                                display: "flex",
                                gap: 1.25,
                                border: 1,
                                borderColor: "divider",
                                borderRadius: 2,
                                p: 1.25,
                                bgcolor: "background.default",
                            }}
                        >
                            <Box sx={{ mt: 0.75, width: 10, height: 10, borderRadius: 999, bgcolor: dotColor(item.tone), flexShrink: 0 }} />
                            <Box sx={{ minWidth: 0 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{item.title}</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>{item.message}</Typography>
                            </Box>
                        </Box>
                    ))
                ) : (
                    <Typography variant="body2" color="text.secondary">Sin highlights por ahora.</Typography>
                )}
            </Box>
        </AppCard>
    );
}

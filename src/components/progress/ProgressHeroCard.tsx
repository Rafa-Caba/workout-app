// src/components/progress/ProgressHeroCard.tsx
// MUI hero summary for the Progress page.

import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";

import { AppCard } from "@/components/mui";
import type { WorkoutProgressComparisonRange, WorkoutProgressHero } from "@/types/workoutProgress.types";
import { formatRangeLabel } from "./progressFormatters";

type Props = {
    hero: WorkoutProgressHero;
    range: WorkoutProgressComparisonRange;
    compareRange: WorkoutProgressComparisonRange | null;
};

export function ProgressHeroCard({ hero, range, compareRange }: Props) {
    return (
        <AppCard title={hero.title} subtitle={hero.subtitle} tone="accent">
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
                <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 1.25, bgcolor: "background.default" }}>
                    <Typography variant="body2">
                        <strong>Rango actual:</strong> <Box component="span" sx={{ fontFamily: "monospace" }}>{formatRangeLabel(range)}</Box>
                    </Typography>
                    {compareRange ? (
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                            <strong>Comparado:</strong> <Box component="span" sx={{ fontFamily: "monospace" }}>{formatRangeLabel(compareRange)}</Box>
                        </Typography>
                    ) : null}
                </Box>

                {hero.items.length ? (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                        {hero.items.map((item) => (
                            <Chip key={item} label={item} size="small" color="primary" variant="outlined" />
                        ))}
                    </Box>
                ) : null}

                <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 1.25, bgcolor: "background.default" }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{hero.message}</Typography>
                    {hero.bullets.map((bullet) => (
                        <Typography key={bullet} variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            • {bullet}
                        </Typography>
                    ))}
                </Box>
            </Box>
        </AppCard>
    );
}

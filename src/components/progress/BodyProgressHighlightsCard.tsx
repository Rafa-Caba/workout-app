// src/components/progress/BodyProgressHighlightsCard.tsx
// MUI highlights card for body progress insights.

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";

import { AppCard } from "@/components/mui";
import type { BodyProgressHighlight } from "@/types/bodyProgress.types";

function toneColor(tone: BodyProgressHighlight["tone"]): "success.main" | "warning.main" | "text.secondary" {
    if (tone === "positive") return "success.main";
    if (tone === "attention") return "warning.main";
    return "text.secondary";
}

export function BodyProgressHighlightsCard({
    title,
    items,
}: {
    title: string;
    items: BodyProgressHighlight[];
}) {
    if (!items.length) return null;

    return (
        <AppCard title={title}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {items.map((item) => (
                    <Box
                        key={item.id}
                        sx={(theme) => ({
                            border: 1,
                            borderColor: "divider",
                            borderRadius: 2,
                            p: { xs: 1.25, md: 1.5 },
                            bgcolor: alpha(theme.palette.primary.main, 0.025),
                        })}
                    >
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: toneColor(item.tone) }}>
                            {item.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {item.message}
                        </Typography>
                    </Box>
                ))}
            </Box>
        </AppCard>
    );
}

// src/components/dayExplorer/BadgePill.tsx
// Compact MUI metric row used inside Day Explorer panels.

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

type Props = {
    emoji: string;
    label: string;
    value: string | null;
};

export function BadgePill({ emoji, label, value }: Props) {
    return (
        <Box
            sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1.25,
                minWidth: 0,
                border: 1,
                borderColor: "divider",
                borderRadius: 2,
                bgcolor: "background.paper",
                px: { xs: 1.25, md: 1.5 },
                py: 1,
            }}
        >
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, minWidth: 0 }}>
                <Typography component="span" aria-hidden="true" sx={{ flexShrink: 0, fontSize: 14 }}>
                    {emoji}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 0 }}>
                    {label}
                </Typography>
            </Box>
            <Typography
                variant="body2"
                sx={{
                    fontWeight: 750,
                    textAlign: "right",
                    overflowWrap: "anywhere",
                    minWidth: 0,
                }}
            >
                {value ?? "—"}
            </Typography>
        </Box>
    );
}

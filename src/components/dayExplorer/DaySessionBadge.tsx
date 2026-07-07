// src/components/dayExplorer/DaySessionBadge.tsx
// Legacy-compatible MUI metric badge for Day Explorer session rows.

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

export function DaySessionBadge({
    emoji,
    label,
    value,
}: {
    emoji: string;
    label: string;
    value: string | null;
}) {
    return (
        <Box
            sx={{
                width: "100%",
                minWidth: 0,
                border: 1,
                borderColor: "divider",
                borderRadius: 999,
                bgcolor: "background.paper",
                px: { xs: 1.25, sm: 1.75 },
                py: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1,
            }}
        >
            <Box sx={{ minWidth: 0, display: "flex", flex: 1, alignItems: "center", gap: 1 }}>
                <Typography component="span" aria-hidden="true" sx={{ flexShrink: 0 }}>
                    {emoji}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap sx={{ minWidth: 0 }}>
                    {label}
                </Typography>
            </Box>

            <Typography variant="body2" sx={{ flexShrink: 0, fontWeight: 750, fontVariantNumeric: "tabular-nums" }}>
                {value ?? "—"}
            </Typography>
        </Box>
    );
}

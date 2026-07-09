// src/components/dayExplorer/BadgePill.tsx
// Compact MUI metric row used inside Day Explorer panels.
// Supports dense two-column mobile grids without wasting vertical space.

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";

type Props = {
    emoji?: string;
    label: string;
    value: string | null;
    dense?: boolean;
    sx?: SxProps<Theme>;
};

export function BadgePill({ emoji, label, value, dense = false, sx }: Props) {
    return (
        <Box
            sx={[
                {
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: { xs: 0.75, md: 1 },
                    minWidth: 0,
                    border: 1,
                    borderColor: "divider",
                    borderRadius: 2,
                    bgcolor: "background.paper",
                    px: { xs: dense ? 0.9 : 1, md: dense ? 1.05 : 1.25 },
                    py: { xs: dense ? 0.7 : 0.8, md: dense ? 0.75 : 0.9 },
                },
                ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
            ]}
        >
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.6, minWidth: 0 }}>
                {emoji ? (
                    <Typography component="span" aria-hidden="true" sx={{ flexShrink: 0, fontSize: { xs: 12, md: 13 } }}>
                        {emoji}
                    </Typography>
                ) : null}
                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                        minWidth: 0,
                        fontSize: { xs: dense ? "0.76rem" : "0.8rem", md: dense ? "0.8rem" : "0.84rem" },
                        lineHeight: 1.25,
                        overflowWrap: "anywhere",
                    }}
                >
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
                    fontSize: { xs: dense ? "0.78rem" : "0.84rem", md: dense ? "0.82rem" : "0.88rem" },
                    lineHeight: 1.25,
                }}
            >
                {value ?? "—"}
            </Typography>
        </Box>
    );
}

// src/components/mui/AppSectionHeader.tsx
// Shared section heading with optional description, meta content, and actions.

import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";

type AppSectionHeaderProps = {
    title: ReactNode;
    description?: ReactNode;
    eyebrow?: ReactNode;
    meta?: ReactNode;
    actions?: ReactNode;
    dense?: boolean;
    sx?: SxProps<Theme>;
};

export function AppSectionHeader({
    title,
    description,
    eyebrow,
    meta,
    actions,
    dense = false,
    sx,
}: AppSectionHeaderProps) {
    return (
        <Box
            sx={[
                {
                    display: "flex",
                    flexDirection: { xs: "column", md: "row" },
                    alignItems: { xs: "stretch", md: "flex-start" },
                    justifyContent: "space-between",
                    gap: dense ? 1 : 2,
                    minWidth: 0,
                },
                ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
            ]}
        >
            <Box sx={{ minWidth: 0 }}>
                {eyebrow ? (
                    <Typography
                        variant="overline"
                        color="primary"
                        sx={{ fontWeight: 800, letterSpacing: 0.75 }}
                    >
                        {eyebrow}
                    </Typography>
                ) : null}

                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        flexWrap: "wrap",
                        minWidth: 0,
                    }}
                >
                    <Typography
                        variant={dense ? "h6" : "h5"}
                        component="h2"
                        sx={{ fontWeight: 850, letterSpacing: "-0.025em" }}
                    >
                        {title}
                    </Typography>
                    {meta ? <Box sx={{ flexShrink: 0 }}>{meta}</Box> : null}
                </Box>

                {description ? (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {description}
                    </Typography>
                ) : null}
            </Box>

            {actions ? (
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: { xs: "flex-start", md: "flex-end" },
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: 1,
                        flexShrink: 0,
                    }}
                >
                    {actions}
                </Box>
            ) : null}
        </Box>
    );
}

export type { AppSectionHeaderProps };

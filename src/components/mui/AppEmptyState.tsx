// src/components/mui/AppEmptyState.tsx
// Shared empty/loading/no-results state for MUI pages and cards.

import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";

import { AppCard } from "./AppCard";

type AppEmptyStateProps = {
    title: ReactNode;
    description?: ReactNode;
    icon?: ReactNode;
    action?: ReactNode;
    compact?: boolean;
    sx?: SxProps<Theme>;
};

export function AppEmptyState({
    title,
    description,
    icon,
    action,
    compact = false,
    sx,
}: AppEmptyStateProps) {
    return (
        <AppCard
            padding={compact ? "sm" : "md"}
            tone="soft"
            sx={sx}
            contentSx={{
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: compact ? 1 : 1.5,
            }}
        >
            {icon ? (
                <Box
                    sx={{
                        width: compact ? 40 : 52,
                        height: compact ? 40 : 52,
                        display: "grid",
                        placeItems: "center",
                        borderRadius: 999,
                        bgcolor: "action.hover",
                        color: "primary.main",
                    }}
                >
                    {icon}
                </Box>
            ) : null}

            <Box sx={{ maxWidth: 560 }}>
                <Typography variant={compact ? "subtitle1" : "h6"} sx={{ fontWeight: 850 }}>
                    {title}
                </Typography>
                {description ? (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                        {description}
                    </Typography>
                ) : null}
            </Box>

            {action ? <Box sx={{ mt: compact ? 0.5 : 1 }}>{action}</Box> : null}
        </AppCard>
    );
}

export type { AppEmptyStateProps };

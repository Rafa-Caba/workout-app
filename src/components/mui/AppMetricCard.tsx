// src/components/mui/AppMetricCard.tsx
// Shared metric card primitive for dashboards, summaries, and detail panels.

import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import type { SxProps, Theme } from "@mui/material/styles";

import { AppCard } from "./AppCard";

type AppMetricTone = "default" | "primary" | "success" | "warning" | "danger" | "info";

type AppMetricCardProps = {
    label: ReactNode;
    value: ReactNode;
    helper?: ReactNode;
    icon?: ReactNode;
    tone?: AppMetricTone;
    compact?: boolean;
    sx?: SxProps<Theme>;
};

type ToneColors = {
    main: string;
    soft: string;
};

function resolveTone(theme: Theme, tone: AppMetricTone): ToneColors {
    if (tone === "primary") {
        return {
            main: theme.palette.primary.main,
            soft: alpha(theme.palette.primary.main, 0.1),
        };
    }

    if (tone === "success") {
        return {
            main: theme.palette.success.main,
            soft: alpha(theme.palette.success.main, 0.1),
        };
    }

    if (tone === "warning") {
        return {
            main: theme.palette.warning.main,
            soft: alpha(theme.palette.warning.main, 0.12),
        };
    }

    if (tone === "danger") {
        return {
            main: theme.palette.error.main,
            soft: alpha(theme.palette.error.main, 0.1),
        };
    }

    if (tone === "info") {
        return {
            main: theme.palette.info.main,
            soft: alpha(theme.palette.info.main, 0.1),
        };
    }

    return {
        main: theme.palette.text.secondary,
        soft: alpha(theme.palette.text.secondary, 0.08),
    };
}

export function AppMetricCard({
    label,
    value,
    helper,
    icon,
    tone = "default",
    compact = false,
    sx,
}: AppMetricCardProps) {
    return (
        <AppCard
            padding={compact ? "sm" : "md"}
            sx={[
                {
                    minWidth: 0,
                    height: "100%",
                },
                ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
            ]}
            contentSx={{ height: "100%" }}
        >
            <Box
                sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 1.25,
                    height: "100%",
                    minWidth: 0,
                }}
            >
                <Box sx={{ minWidth: 0 }}>
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontWeight: 650, mb: 0.5 }}
                    >
                        {label}
                    </Typography>
                    <Typography
                        variant={compact ? "h6" : "h5"}
                        component="p"
                        sx={{
                            fontWeight: 750,
                            letterSpacing: "-0.025em",
                            overflowWrap: "anywhere",
                        }}
                    >
                        {value}
                    </Typography>
                    {helper ? (
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>
                            {helper}
                        </Typography>
                    ) : null}
                </Box>

                {icon ? (
                    <Box
                        sx={(theme) => {
                            const colors = resolveTone(theme, tone);
                            return {
                                width: compact ? 32 : 38,
                                height: compact ? 32 : 38,
                                borderRadius: 999,
                                display: "grid",
                                placeItems: "center",
                                flexShrink: 0,
                                color: colors.main,
                                bgcolor: colors.soft,
                            };
                        }}
                    >
                        {icon}
                    </Box>
                ) : null}
            </Box>
        </AppCard>
    );
}

export type { AppMetricCardProps, AppMetricTone };

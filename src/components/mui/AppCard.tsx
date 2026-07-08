// src/components/mui/AppCard.tsx
// Shared MUI card primitive for page panels, nested sections, and form blocks.
// The accent tone reads from the active MUI theme palette instead of using hardcoded colors.

import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { alpha, type SxProps, type Theme } from "@mui/material/styles";

type AppCardTone = "default" | "soft" | "accent";
type AppCardPadding = "none" | "sm" | "md" | "lg";

type AppCardProps = {
    title?: ReactNode;
    subtitle?: ReactNode;
    eyebrow?: ReactNode;
    action?: ReactNode;
    children: ReactNode;
    tone?: AppCardTone;
    padding?: AppCardPadding;
    interactive?: boolean;
    onClick?: () => void;
    sx?: SxProps<Theme>;
    contentSx?: SxProps<Theme>;
    headerSx?: SxProps<Theme>;
};

const CONTENT_PADDING: Record<AppCardPadding, SxProps<Theme>> = {
    none: {
        p: 0,
        "&:last-child": { pb: 0 },
    },
    sm: {
        p: { xs: 1.25, md: 2 },
        "&:last-child": { pb: { xs: 1.25, md: 2 } },
    },
    md: {
        p: { xs: 1.5, md: 2.25 },
        "&:last-child": { pb: { xs: 1.5, md: 2.25 } },
    },
    lg: {
        p: { xs: 1.75, md: 2.75 },
        "&:last-child": { pb: { xs: 1.75, md: 2.75 } },
    },
};

/**
 * Builds visual styles for AppCard tone variants.
 * Accent uses the active theme primary color so palette changes like Red,
 * Blue, Violet, Emerald and Mint are reflected automatically.
 */
function buildToneSx(tone: AppCardTone): SxProps<Theme> {
    if (tone === "accent") {
        return (theme) => {
            const primarySoft =
                theme.palette.mode === "dark"
                    ? alpha(theme.palette.primary.main, 0.16)
                    : alpha(theme.palette.primary.main, 0.08);

            const primaryFaint =
                theme.palette.mode === "dark"
                    ? alpha(theme.palette.primary.main, 0.05)
                    : alpha(theme.palette.primary.main, 0.025);

            return {
                borderColor:
                    theme.palette.mode === "dark"
                        ? alpha(theme.palette.primary.main, 0.46)
                        : alpha(theme.palette.primary.main, 0.38),
                background: `linear-gradient(135deg, ${primarySoft}, ${primaryFaint})`,
            };
        };
    }

    if (tone === "soft") {
        return {
            bgcolor: "background.default",
        };
    }

    return {};
}

export function AppCard({
    title,
    subtitle,
    eyebrow,
    action,
    children,
    tone = "default",
    padding = "md",
    interactive = false,
    onClick,
    sx,
    contentSx,
    headerSx,
}: AppCardProps) {
    const hasHeader = Boolean(title || subtitle || eyebrow || action);

    return (
        <Card
            onClick={onClick}
            role={interactive || onClick ? "button" : undefined}
            tabIndex={interactive || onClick ? 0 : undefined}
            sx={[
                {
                    overflow: "hidden",
                    ...(interactive || onClick
                        ? {
                            cursor: "pointer",
                            transition:
                                "border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease",
                            "&:hover": {
                                borderColor: "primary.main",
                                boxShadow: "0 12px 30px rgba(0, 0, 0, 0.12)",
                                transform: "translateY(-1px)",
                            },
                        }
                        : {}),
                },
                buildToneSx(tone),
                ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
            ]}
        >
            <CardContent
                sx={[
                    CONTENT_PADDING[padding],
                    ...(Array.isArray(contentSx) ? contentSx : contentSx ? [contentSx] : []),
                ]}
            >
                {hasHeader ? (
                    <Box
                        sx={[
                            {
                                display: "flex",
                                alignItems: { xs: "flex-start", sm: "center" },
                                justifyContent: "space-between",
                                flexDirection: { xs: "column", sm: "row" },
                                gap: { xs: 1.25, md: 1.5 },
                                mb: { xs: 1.5, md: 2 },
                                minWidth: 0,
                            },
                            ...(Array.isArray(headerSx) ? headerSx : headerSx ? [headerSx] : []),
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

                            {title ? (
                                <Typography variant="h6" component="h2" sx={{ fontWeight: 800 }}>
                                    {title}
                                </Typography>
                            ) : null}

                            {subtitle ? (
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                                    {subtitle}
                                </Typography>
                            ) : null}
                        </Box>

                        {action ? (
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "flex-end",
                                    gap: 1,
                                    flexWrap: "wrap",
                                    flexShrink: 0,
                                }}
                            >
                                {action}
                            </Box>
                        ) : null}
                    </Box>
                ) : null}

                {children}
            </CardContent>
        </Card>
    );
}

export type { AppCardProps, AppCardPadding, AppCardTone };
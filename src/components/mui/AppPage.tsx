// src/components/mui/AppPage.tsx
// Reusable MUI page shell for Workout Web pages.
// Keeps page spacing, max-width, title area, and action placement consistent.

import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";

type AppPageWidth = "sm" | "md" | "lg" | "xl" | "full";

type AppPageProps = {
    title?: ReactNode;
    subtitle?: ReactNode;
    eyebrow?: ReactNode;
    actions?: ReactNode;
    children: ReactNode;
    maxWidth?: AppPageWidth;
    disableGutters?: boolean;
    sx?: SxProps<Theme>;
    headerSx?: SxProps<Theme>;
    contentSx?: SxProps<Theme>;
};

const PAGE_MAX_WIDTH: Record<AppPageWidth, string> = {
    sm: "760px",
    md: "980px",
    lg: "1200px",
    xl: "1440px",
    full: "100%",
};

export function AppPage({
    title,
    subtitle,
    eyebrow,
    actions,
    children,
    maxWidth = "lg",
    disableGutters = false,
    sx,
    headerSx,
    contentSx,
}: AppPageProps) {
    const hasHeader = Boolean(title || subtitle || eyebrow || actions);

    return (
        <Box
            sx={[
                {
                    width: "100%",
                    maxWidth: PAGE_MAX_WIDTH[maxWidth],
                    mx: "auto",
                    px: disableGutters ? 0 : { xs: 2, sm: 3, lg: 4 },
                    py: { xs: 3, md: 4 },
                },
                ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
            ]}
        >
            {hasHeader ? (
                <Box
                    sx={[
                        {
                            display: "flex",
                            flexDirection: { xs: "column", md: "row" },
                            alignItems: { xs: "stretch", md: "flex-start" },
                            justifyContent: "space-between",
                            gap: 2,
                            mb: { xs: 2.5, md: 3 },
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
                                sx={{ fontWeight: 900, letterSpacing: 0.9 }}
                            >
                                {eyebrow}
                            </Typography>
                        ) : null}

                        {title ? (
                            <Typography
                                variant="h4"
                                component="h1"
                                sx={{
                                    fontWeight: 950,
                                    letterSpacing: "-0.04em",
                                    lineHeight: 1.08,
                                }}
                            >
                                {title}
                            </Typography>
                        ) : null}

                        {subtitle ? (
                            <Typography
                                variant="body1"
                                color="text.secondary"
                                sx={{ mt: 0.75, maxWidth: 760 }}
                            >
                                {subtitle}
                            </Typography>
                        ) : null}
                    </Box>

                    {actions ? (
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: { xs: "flex-start", md: "flex-end" },
                                flexWrap: "wrap",
                                gap: 1,
                                flexShrink: 0,
                            }}
                        >
                            {actions}
                        </Box>
                    ) : null}
                </Box>
            ) : null}

            <Box
                sx={[
                    {
                        display: "flex",
                        flexDirection: "column",
                        gap: { xs: 2, md: 2.5 },
                        minWidth: 0,
                    },
                    ...(Array.isArray(contentSx) ? contentSx : contentSx ? [contentSx] : []),
                ]}
            >
                {children}
            </Box>
        </Box>
    );
}

export type { AppPageProps, AppPageWidth };

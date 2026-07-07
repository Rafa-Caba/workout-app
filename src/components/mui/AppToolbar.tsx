// src/components/mui/AppToolbar.tsx
// Responsive toolbar primitive for filters, date controls, and page actions.

import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";

import { AppCard } from "./AppCard";

type AppToolbarProps = {
    start?: ReactNode;
    center?: ReactNode;
    end?: ReactNode;
    children?: ReactNode;
    dense?: boolean;
    wrap?: boolean;
    sx?: SxProps<Theme>;
    contentSx?: SxProps<Theme>;
};

export function AppToolbar({
    start,
    center,
    end,
    children,
    dense = false,
    wrap = true,
    sx,
    contentSx,
}: AppToolbarProps) {
    return (
        <AppCard
            padding={dense ? "sm" : "md"}
            sx={sx}
            contentSx={[
                {
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexDirection: { xs: "column", lg: "row" },
                    gap: dense ? 1 : 1.5,
                    minWidth: 0,
                },
                ...(Array.isArray(contentSx) ? contentSx : contentSx ? [contentSx] : []),
            ]}
        >
            {children ? (
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        flexWrap: wrap ? "wrap" : "nowrap",
                        gap: dense ? 1 : 1.5,
                        width: "100%",
                        minWidth: 0,
                    }}
                >
                    {children}
                </Box>
            ) : (
                <>
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            flexWrap: wrap ? "wrap" : "nowrap",
                            gap: dense ? 1 : 1.5,
                            width: { xs: "100%", lg: "auto" },
                            minWidth: 0,
                        }}
                    >
                        {start}
                    </Box>

                    {center ? (
                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                flexWrap: wrap ? "wrap" : "nowrap",
                                gap: dense ? 1 : 1.5,
                                width: { xs: "100%", lg: "auto" },
                                minWidth: 0,
                            }}
                        >
                            {center}
                        </Box>
                    ) : null}

                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: { xs: "flex-start", lg: "flex-end" },
                            alignItems: "center",
                            flexWrap: wrap ? "wrap" : "nowrap",
                            gap: dense ? 1 : 1.5,
                            width: { xs: "100%", lg: "auto" },
                            minWidth: 0,
                        }}
                    >
                        {end}
                    </Box>
                </>
            )}
        </AppCard>
    );
}

export type { AppToolbarProps };

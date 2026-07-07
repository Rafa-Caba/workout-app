// src/components/mui/AppFormGrid.tsx
// Responsive CSS grid helper for MUI forms.

import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";

type AppFormGridProps = {
    children: ReactNode;
    minColumnWidth?: number;
    gap?: number;
    columns?: number;
    sx?: SxProps<Theme>;
};

export function AppFormGrid({
    children,
    minColumnWidth = 240,
    gap = 2,
    columns,
    sx,
}: AppFormGridProps) {
    const gridTemplateColumns = columns
        ? `repeat(${columns}, minmax(0, 1fr))`
        : `repeat(auto-fit, minmax(min(100%, ${minColumnWidth}px), 1fr))`;

    return (
        <Box
            sx={[
                {
                    display: "grid",
                    gridTemplateColumns,
                    gap,
                    minWidth: 0,
                },
                ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
            ]}
        >
            {children}
        </Box>
    );
}

export type { AppFormGridProps };

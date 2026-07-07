// src/components/mui/AppFormGrid.tsx
// Responsive CSS grid helper for MUI forms.

import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";

type ResponsiveColumns = number | {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
};

type AppFormGridProps = {
    children: ReactNode;
    minColumnWidth?: number;
    gap?: number;
    columns?: ResponsiveColumns;
    sx?: SxProps<Theme>;
};

function buildColumns(count: number): string {
    return `repeat(${count}, minmax(0, 1fr))`;
}

function buildGridTemplateColumns(
    columns: ResponsiveColumns | undefined,
    minColumnWidth: number
): string | Record<string, string> {
    if (typeof columns === "number") {
        return buildColumns(columns);
    }

    if (columns && typeof columns === "object") {
        const out: Record<string, string> = {};

        for (const [breakpoint, value] of Object.entries(columns)) {
            if (typeof value === "number" && Number.isFinite(value) && value > 0) {
                out[breakpoint] = buildColumns(value);
            }
        }

        if (Object.keys(out).length > 0) {
            return out;
        }
    }

    return `repeat(auto-fit, minmax(min(100%, ${minColumnWidth}px), 1fr))`;
}

export function AppFormGrid({
    children,
    minColumnWidth = 240,
    gap = 2,
    columns,
    sx,
}: AppFormGridProps) {
    return (
        <Box
            sx={[
                {
                    display: "grid",
                    gridTemplateColumns: buildGridTemplateColumns(columns, minColumnWidth),
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

export type { AppFormGridProps, ResponsiveColumns };

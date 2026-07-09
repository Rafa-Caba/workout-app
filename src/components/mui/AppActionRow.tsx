// src/components/mui/AppActionRow.tsx
// Shared responsive action row for buttons and secondary actions.

import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";

type AppActionRowAlign = "left" | "center" | "right" | "between";

type AppActionRowProps = {
    children: ReactNode;
    align?: AppActionRowAlign;
    dense?: boolean;
    reverseOnMobile?: boolean;
    stackOnMobile?: boolean;
    sx?: SxProps<Theme>;
};

function justifyFromAlign(align: AppActionRowAlign): string {
    if (align === "center") return "center";
    if (align === "right") return "flex-end";
    if (align === "between") return "space-between";
    return "flex-start";
}

export function AppActionRow({
    children,
    align = "right",
    dense = false,
    reverseOnMobile = false,
    stackOnMobile = false,
    sx,
}: AppActionRowProps) {
    return (
        <Box
            sx={[
                {
                    display: "flex",
                    flexDirection: {
                        xs: stackOnMobile ? (reverseOnMobile ? "column-reverse" : "column") : "row",
                        sm: "row",
                    },
                    alignItems: { xs: stackOnMobile ? "stretch" : "center", sm: "center" },
                    justifyContent: justifyFromAlign(align),
                    gap: dense ? 1 : 1.5,
                    flexWrap: "wrap",
                    minWidth: 0,
                    "& > *": {
                        flexShrink: 0,
                    },
                },
                ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
            ]}
        >
            {children}
        </Box>
    );
}

export type { AppActionRowAlign, AppActionRowProps };

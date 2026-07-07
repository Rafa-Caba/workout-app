// src/components/PageHeader.tsx
// Shared page heading component backed by Material UI.
// Keeps the previous API: title, subtitle, and optional right-side actions.

import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

export function PageHeader({
    title,
    subtitle,
    right,
}: {
    title: ReactNode;
    subtitle?: ReactNode;
    right?: ReactNode;
}) {
    return (
        <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            sx={{
                width: "100%",
                minWidth: 0,
                alignItems: { xs: "stretch", md: "flex-start" },
                justifyContent: "space-between"
            }}
        >
            <Box sx={{ minWidth: 0 }}>
                <Typography
                    component="h1"
                    variant="h4"
                    sx={{
                        fontWeight: 900,
                        letterSpacing: -0.5,
                        overflowWrap: "anywhere",
                    }}
                >
                    {title}
                </Typography>

                {subtitle ? (
                    <Typography
                        component="p"
                        variant="body1"
                        color="text.secondary"
                        sx={{ mt: 0.5, overflowWrap: "anywhere" }}
                    >
                        {subtitle}
                    </Typography>
                ) : null}
            </Box>

            {right ? (
                <Stack
                    direction="row"
                    spacing={1}
                    useFlexGap
                    sx={{
                        minWidth: 0,
                        flexWrap: "wrap",
                        alignItems: "center",
                        justifyContent: { xs: "flex-start", md: "flex-end" }
                    }}
                >
                    {right}
                </Stack>
            ) : null}
        </Stack>
    );
}

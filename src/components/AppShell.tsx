// src/components/AppShell.tsx
// Main application shell using Material UI layout primitives.
// Keeps the existing routing/auth logic and only changes the visual structure.

import * as React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";

import { NavBar } from "@/components/NavBar";
import { useAdminSettingsStore } from "@/state/adminSettings.store";

function isAuthRoute(pathname: string): boolean {
    return pathname === "/login" || pathname === "/register";
}

export function AppShell() {
    const location = useLocation();
    const isAuthPage = isAuthRoute(location.pathname);
    const adminSettings = useAdminSettingsStore((state) => state.settings);

    const appName =
        adminSettings?.appName && adminSettings.appName.trim().length > 0
            ? adminSettings.appName
            : "Workout App";

    React.useEffect(() => {
        document.title = appName;
    }, [appName]);

    return (
        <Box
            sx={(theme) => ({
                minHeight: "100vh",
                bgcolor: "background.default",
                color: "text.primary",
                display: "flex",
                flexDirection: "column",
                transition: theme.transitions.create(["background-color", "color"], {
                    duration: theme.transitions.duration.short,
                }),
            })}
        >
            <Toaster richColors position="bottom-right" />

            {!isAuthPage ? <NavBar /> : null}

            <Box
                component="main"
                sx={{
                    flex: 1,
                    width: "100%",
                    py: {
                        xs: isAuthPage ? 0 : 3,
                        sm: isAuthPage ? 0 : 4,
                    },
                }}
            >
                {isAuthPage ? (
                    <Outlet />
                ) : (
                    <Container
                        maxWidth="xl"
                        sx={{
                            px: { xs: 2, sm: 3, lg: 4 },
                        }}
                    >
                        <Outlet />
                    </Container>
                )}
            </Box>
        </Box>
    );
}

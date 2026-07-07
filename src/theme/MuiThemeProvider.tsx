// src/theme/MuiThemeProvider.tsx
// Material UI theme bridge.
// Reads the existing Workout theme context and exposes an equivalent MUI theme.

import * as React from "react";
import CssBaseline from "@mui/material/CssBaseline";
import useMediaQuery from "@mui/material/useMediaQuery";
import { ThemeProvider as MaterialThemeProvider } from "@mui/material/styles";

import { useTheme } from "./ThemeProvider";
import { buildWorkoutMuiTheme } from "./muiTheme";

type MuiThemeProviderProps = {
    children: React.ReactNode;
};

export function MuiThemeProvider({ children }: MuiThemeProviderProps) {
    const { mode, palette } = useTheme();
    const systemPrefersDark = useMediaQuery("(prefers-color-scheme: dark)", {
        noSsr: true,
    });

    const theme = React.useMemo(
        () =>
            buildWorkoutMuiTheme({
                mode,
                palette,
                systemPrefersDark,
            }),
        [mode, palette, systemPrefersDark]
    );

    return (
        <MaterialThemeProvider theme={theme}>
            <CssBaseline enableColorScheme />
            {children}
        </MaterialThemeProvider>
    );
}

// src/theme/muiTheme.ts
// MUI theme factory for Workout Web.
// Bridges the existing app mode/palette preferences into Material UI tokens.

import { alpha, createTheme, responsiveFontSizes } from "@mui/material/styles";
import type { Components, PaletteMode, Theme, ThemeOptions } from "@mui/material/styles";
import type { Mode, Palette as WorkoutPalette } from "./presets";

type AppMuiThemeArgs = {
    mode: Mode;
    palette: WorkoutPalette;
    systemPrefersDark: boolean;
};

type AccentScale = {
    main: string;
    light: string;
    dark: string;
    contrastText: string;
    soft: string;
    subtle: string;
};

type NeutralScale = {
    background: string;
    paper: string;
    paperSoft: string;
    elevated: string;
    border: string;
    borderStrong: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
};

const ACCENTS: Record<WorkoutPalette, AccentScale> = {
    blue: {
        main: "#2563EB",
        light: "#60A5FA",
        dark: "#1D4ED8",
        contrastText: "#FFFFFF",
        soft: "#DBEAFE",
        subtle: "#EFF6FF",
    },
    emerald: {
        main: "#059669",
        light: "#34D399",
        dark: "#047857",
        contrastText: "#FFFFFF",
        soft: "#D1FAE5",
        subtle: "#ECFDF5",
    },
    violet: {
        main: "#A855F7",
        light: "#C084FC",
        dark: "#7E22CE",
        contrastText: "#FFFFFF",
        soft: "#F3E8FF",
        subtle: "#FAF5FF",
    },
    red: {
        main: "#DC2626",
        light: "#F87171",
        dark: "#B91C1C",
        contrastText: "#FFFFFF",
        soft: "#FEE2E2",
        subtle: "#FEF2F2",
    },
    mint: {
        main: "#14B8A6",
        light: "#5EEAD4",
        dark: "#0F766E",
        contrastText: "#FFFFFF",
        soft: "#CCFBF1",
        subtle: "#F0FDFA",
    },
};

const LIGHT_NEUTRALS: NeutralScale = {
    background: "#FFFFFF",
    paper: "#FFFFFF",
    paperSoft: "#FAFAFF",
    elevated: "#FFFFFF",
    border: "#E5E7EB",
    borderStrong: "#D1D5DB",
    textPrimary: "#0F172A",
    textSecondary: "#475569",
    textMuted: "#64748B",
};

const DARK_NEUTRALS: NeutralScale = {
    background: "#070708",
    paper: "#111111",
    paperSoft: "#151515",
    elevated: "#181818",
    border: "rgba(229, 231, 235, 0.16)",
    borderStrong: "rgba(229, 231, 235, 0.28)",
    textPrimary: "#F8FAFC",
    textSecondary: "#D1D5DB",
    textMuted: "#9CA3AF",
};

export function resolveMuiPaletteMode(mode: Mode, systemPrefersDark: boolean): PaletteMode {
    if (mode === "dark") return "dark";
    if (mode === "light") return "light";
    return systemPrefersDark ? "dark" : "light";
}

function buildComponentOverrides(accent: AccentScale, neutrals: NeutralScale): Components<Theme> {
    const focusRing = `0 0 0 3px ${alpha(accent.main, 0.18)}`;

    return {
        MuiCssBaseline: {
            styleOverrides: {
                "*, *::before, *::after": {
                    boxSizing: "border-box",
                },
                html: {
                    minHeight: "100%",
                    WebkitFontSmoothing: "antialiased",
                    MozOsxFontSmoothing: "grayscale",
                },
                body: {
                    minHeight: "100%",
                    margin: 0,
                    backgroundColor: neutrals.background,
                    color: neutrals.textPrimary,
                    textRendering: "optimizeLegibility",
                },
                "#root": {
                    minHeight: "100%",
                },
                "button, input, textarea, select": {
                    font: "inherit",
                },
                "a": {
                    color: "inherit",
                    textDecoration: "none",
                },
                "img, picture, video, canvas, svg": {
                    display: "block",
                    maxWidth: "100%",
                },
            },
        },
        MuiButton: {
            defaultProps: {
                disableElevation: true,
            },
            styleOverrides: {
                root: {
                    borderRadius: 10,
                    fontWeight: 750,
                    textTransform: "none",
                    minHeight: 42,
                    boxShadow: "none",
                    transition:
                        "background-color 160ms ease, border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease",
                    "&:focus-visible": {
                        boxShadow: focusRing,
                    },
                },
                contained: {
                    background: `linear-gradient(135deg, ${accent.main}, ${accent.light})`,
                    "&:hover": {
                        background: `linear-gradient(135deg, ${accent.dark}, ${accent.main})`,
                        boxShadow: `0 12px 24px ${alpha(accent.main, 0.22)}`,
                    },
                },
                outlined: {
                    borderColor: neutrals.border,
                    backgroundColor: alpha(neutrals.paper, 0.72),
                    "&:hover": {
                        borderColor: accent.main,
                        backgroundColor: alpha(accent.main, 0.06),
                    },
                },
            },
        },
        MuiIconButton: {
            styleOverrides: {
                root: {
                    borderRadius: 10,
                    border: `1px solid ${neutrals.border}`,
                    backgroundColor: alpha(neutrals.paper, 0.78),
                    boxShadow: `0 8px 18px ${alpha("#000000", 0.08)}`,
                    "&:hover": {
                        borderColor: accent.main,
                        backgroundColor: alpha(accent.main, 0.08),
                    },
                    "&:focus-visible": {
                        boxShadow: focusRing,
                    },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 16,
                    border: `1px solid ${neutrals.border}`,
                    backgroundImage: "none",
                    boxShadow: `0 12px 30px ${alpha("#000000", 0.06)}`,
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                rounded: {
                    borderRadius: 12,
                },
                elevation1: {
                    boxShadow: `0 12px 30px ${alpha("#000000", 0.08)}`,
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    borderRadius: 999,
                    fontWeight: 800,
                },
                outlined: {
                    borderColor: neutrals.border,
                    backgroundColor: alpha(neutrals.paper, 0.72),
                },
                filled: {
                    backgroundColor: alpha(accent.main, 0.12),
                    color: accent.dark,
                },
            },
        },
        MuiTextField: {
            defaultProps: {
                size: "small",
            },
        },
        MuiSelect: {
            defaultProps: {
                size: "small",
            },
        },
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    borderRadius: 10,
                    backgroundColor: alpha(neutrals.paper, 0.76),
                    "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: neutrals.border,
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: neutrals.borderStrong,
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: accent.main,
                        borderWidth: 1,
                    },
                    "&.Mui-focused": {
                        boxShadow: focusRing,
                    },
                },
            },
        },
        MuiTabs: {
            styleOverrides: {
                indicator: {
                    height: 3,
                    borderRadius: 999,
                },
            },
        },
        MuiTab: {
            styleOverrides: {
                root: {
                    textTransform: "none",
                    fontWeight: 800,
                    minHeight: 44,
                },
            },
        },
        MuiDialog: {
            styleOverrides: {
                paper: {
                    borderRadius: 16,
                    border: `1px solid ${neutrals.border}`,
                    backgroundImage: "none",
                },
            },
        },
        MuiMenu: {
            styleOverrides: {
                paper: {
                    borderRadius: 12,
                    border: `1px solid ${neutrals.border}`,
                    boxShadow: `0 20px 45px ${alpha("#000000", 0.14)}`,
                },
            },
        },
        MuiDivider: {
            styleOverrides: {
                root: {
                    borderColor: neutrals.border,
                },
            },
        },
        MuiTableCell: {
            styleOverrides: {
                head: {
                    fontWeight: 800,
                    backgroundColor: alpha(accent.main, 0.10),
                },
            },
        },
    };
}

export function buildWorkoutMuiTheme(args: AppMuiThemeArgs): Theme {
    const muiMode = resolveMuiPaletteMode(args.mode, args.systemPrefersDark);
    const accent = ACCENTS[args.palette];
    const neutrals = muiMode === "dark" ? DARK_NEUTRALS : LIGHT_NEUTRALS;

    const options: ThemeOptions = {
        palette: {
            mode: muiMode,
            primary: {
                main: accent.main,
                light: accent.light,
                dark: accent.dark,
                contrastText: accent.contrastText,
            },
            secondary: {
                main: accent.light,
                light: accent.soft,
                dark: accent.dark,
                contrastText: accent.contrastText,
            },
            background: {
                default: neutrals.background,
                paper: neutrals.paper,
            },
            text: {
                primary: neutrals.textPrimary,
                secondary: neutrals.textSecondary,
            },
            divider: neutrals.border,
            error: {
                main: "#DC2626",
            },
            success: {
                main: "#16A34A",
            },
            warning: {
                main: "#F59E0B",
            },
            info: {
                main: "#0EA5E9",
            },
        },
        typography: {
            fontFamily:
                'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            h1: { fontWeight: 850, letterSpacing: -0.75 },
            h2: { fontWeight: 850, letterSpacing: -0.65 },
            h3: { fontWeight: 850, letterSpacing: -0.55 },
            h4: { fontWeight: 850, letterSpacing: -0.35 },
            h5: { fontWeight: 850, letterSpacing: -0.22 },
            h6: { fontWeight: 850, letterSpacing: -0.1 },
            button: { fontWeight: 750 },
            subtitle1: { color: neutrals.textSecondary },
            subtitle2: { color: neutrals.textMuted },
        },
        shape: {
            borderRadius: 12,
        },
        shadows: [
            "none",
            `0 8px 18px ${alpha("#000000", 0.08)}`,
            `0 12px 24px ${alpha("#000000", 0.10)}`,
            `0 16px 32px ${alpha("#000000", 0.12)}`,
            `0 18px 40px ${alpha("#000000", 0.14)}`,
            `0 24px 48px ${alpha("#000000", 0.16)}`,
            `0 28px 56px ${alpha("#000000", 0.18)}`,
            `0 32px 64px ${alpha("#000000", 0.20)}`,
            `0 36px 72px ${alpha("#000000", 0.22)}`,
            `0 40px 80px ${alpha("#000000", 0.24)}`,
            `0 44px 88px ${alpha("#000000", 0.26)}`,
            `0 48px 96px ${alpha("#000000", 0.28)}`,
            `0 52px 104px ${alpha("#000000", 0.30)}`,
            `0 56px 112px ${alpha("#000000", 0.32)}`,
            `0 60px 120px ${alpha("#000000", 0.34)}`,
            `0 64px 128px ${alpha("#000000", 0.36)}`,
            `0 68px 136px ${alpha("#000000", 0.38)}`,
            `0 72px 144px ${alpha("#000000", 0.40)}`,
            `0 76px 152px ${alpha("#000000", 0.42)}`,
            `0 80px 160px ${alpha("#000000", 0.44)}`,
            `0 84px 168px ${alpha("#000000", 0.46)}`,
            `0 88px 176px ${alpha("#000000", 0.48)}`,
            `0 92px 184px ${alpha("#000000", 0.50)}`,
            `0 96px 192px ${alpha("#000000", 0.52)}`,
            `0 100px 200px ${alpha("#000000", 0.54)}`,
        ],
        breakpoints: {
            values: {
                xs: 0,
                sm: 640,
                md: 900,
                lg: 1200,
                xl: 1536,
            },
        },
        components: buildComponentOverrides(accent, neutrals),
    };

    return responsiveFontSizes(createTheme(options));
}

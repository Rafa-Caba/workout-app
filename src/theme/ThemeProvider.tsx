import React from "react";
import type { Mode, Palette } from "./presets";

type ThemeState = {
    mode: Mode;
    palette: Palette;
    setMode: (mode: Mode) => void;
    setPalette: (palette: Palette) => void;
};

const ThemeContext = React.createContext<ThemeState | null>(null);

const LS_MODE = "workout.theme.mode";
const LS_PALETTE = "workout.theme.palette";

function getSystemDark() {
    return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ?? false;
}

function applyTheme(mode: Mode, palette: Palette) {
    const root = document.documentElement;

    root.dataset.palette = palette;

    const shouldDark = mode === "dark" || (mode === "system" && getSystemDark());
    root.classList.toggle("dark", shouldDark);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [mode, setModeState] = React.useState<Mode>(() => {
        const saved = localStorage.getItem(LS_MODE) as Mode | null;
        return saved ?? "system";
    });

    const [palette, setPaletteState] = React.useState<Palette>(() => {
        const saved = localStorage.getItem(LS_PALETTE) as Palette | null;
        return saved ?? "blue";
    });

    React.useEffect(() => {
        applyTheme(mode, palette);
        localStorage.setItem(LS_MODE, mode);
        localStorage.setItem(LS_PALETTE, palette);
    }, [mode, palette]);

    React.useEffect(() => {
        const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
        if (!mq) return;

        const onChange = () => {
            // only re-apply when in system mode
            if (mode === "system") applyTheme(mode, palette);
        };

        mq.addEventListener?.("change", onChange);
        return () => mq.removeEventListener?.("change", onChange);
    }, [mode, palette]);

    const value: ThemeState = React.useMemo(
        () => ({
            mode,
            palette,
            setMode: setModeState,
            setPalette: setPaletteState,
        }),
        [mode, palette]
    );

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
    const ctx = React.useContext(ThemeContext);
    if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
    return ctx;
}

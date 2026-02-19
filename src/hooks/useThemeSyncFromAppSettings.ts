import * as React from "react";
import { useAppSettingsStore } from "@/state/appSettings.store";
import { useTheme } from "@/theme/ThemeProvider";
import type { Mode, Palette } from "@/theme/presets";

// Keep in sync with ThemeProvider keys
const LS_MODE = "workout.theme.mode";
const LS_PALETTE = "workout.theme.palette";

function hasExplicitThemePreference(): boolean {
    const savedMode = localStorage.getItem(LS_MODE);
    const savedPalette = localStorage.getItem(LS_PALETTE);
    return Boolean(savedMode || savedPalette);
}

/**
 * Sync theme defaults from AppSettings ONLY when user has no explicit preference saved.
 * - If user has preference → do nothing.
 * - If not → apply server themeDefaults once.
 */
export function useThemeSyncFromAppSettings() {
    const { setMode, setPalette } = useTheme();

    const appSettings = useAppSettingsStore((s) => s.settings);
    const lastLoadedAt = useAppSettingsStore((s) => s.lastLoadedAt);

    const didApplyRef = React.useRef(false);

    React.useEffect(() => {
        // Only attempt after we have a load timestamp (or persisted state)
        if (!appSettings) return;

        // Prevent re-applying on every render/navigation
        if (didApplyRef.current) return;

        // If user already picked something, do not override it.
        if (hasExplicitThemePreference()) {
            didApplyRef.current = true;
            return;
        }

        // Apply server defaults
        const mode = (appSettings.themeDefaults?.mode ?? "system") as Mode;
        const palette = (appSettings.themeDefaults?.palette ?? "blue") as Palette;

        setMode(mode);
        setPalette(palette);

        didApplyRef.current = true;
    }, [appSettings, lastLoadedAt, setMode, setPalette]);
}

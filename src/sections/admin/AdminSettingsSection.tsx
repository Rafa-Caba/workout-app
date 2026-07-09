// src/sections/admin/AdminSettingsSection.tsx
// MUI app settings form. Keeps admin settings store and API contract unchanged.

import React from "react";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import FormControlLabel from "@mui/material/FormControlLabel";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { AppCard, AppEmptyState, AppFormGrid } from "@/components/mui";
import { MediaViewerModal } from "@/components/media/MediaViewerModal";
import { useI18n } from "@/i18n/I18nProvider";
import { useAdminSettingsStore } from "@/state/adminSettings.store";
import type { AdminSettings, AdminSettingsPalette, AdminSettingsThemeMode } from "@/types/adminSettings.types";
import type { MediaFeedItem } from "@/types/media.types";

const THEME_MODES: AdminSettingsThemeMode[] = ["system", "light", "dark"];
const PALETTES: AdminSettingsPalette[] = ["blue", "emerald", "violet", "red", "mint"];

function buildLogoMediaItem(settings: AdminSettings, lang: string): MediaFeedItem | null {
    if (!settings.appLogoUrl) return null;

    return {
        source: "adminSettings",
        publicId: settings.appLogoPublicId ?? settings.appLogoUrl,
        url: settings.appLogoUrl,
        resourceType: "image",
        format: null,
        createdAt: settings.updatedAt ?? new Date().toISOString(),
        meta: { kind: "admin_logo" },
        date: null,
        weekKey: "admin-settings",
        sessionId: null,
        sessionType: lang === "es" ? "Logo de la app" : "App logo",
        dayNotes: null,
        dayTags: null,
    };
}

export function AdminSettingsSection() {
    const { lang } = useI18n();
    const { settings, loading, saving, error, loadSettings, updateSettings } = useAdminSettingsStore();

    const [appName, setAppName] = React.useState("");
    const [appSubtitle, setAppSubtitle] = React.useState("");
    const [debugShowJson, setDebugShowJson] = React.useState(false);
    const [themeMode, setThemeMode] = React.useState<AdminSettingsThemeMode>("system");
    const [themePalette, setThemePalette] = React.useState<AdminSettingsPalette>("blue");
    const [logoFile, setLogoFile] = React.useState<File | null>(null);
    const [logoPreview, setLogoPreview] = React.useState<string | null>(null);
    const [selectedMedia, setSelectedMedia] = React.useState<MediaFeedItem | null>(null);

    React.useEffect(() => {
        void loadSettings();
    }, [loadSettings]);

    React.useEffect(() => {
        if (!settings) return;
        setAppName(settings.appName ?? "");
        setAppSubtitle(settings.appSubtitle ?? "");
        setDebugShowJson(Boolean(settings.debug?.showJson));
        setThemeMode(settings.themeDefaults?.mode ?? "system");
        setThemePalette(settings.themeDefaults?.palette ?? "blue");
        setLogoFile(null);
        setLogoPreview((current) => {
            if (current) URL.revokeObjectURL(current);
            return null;
        });
    }, [settings]);

    React.useEffect(() => {
        return () => {
            if (logoPreview) URL.revokeObjectURL(logoPreview);
        };
    }, [logoPreview]);

    function handleLogoChange(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0] ?? null;
        setLogoPreview((current) => {
            if (current) URL.revokeObjectURL(current);
            return file ? URL.createObjectURL(file) : null;
        });
        setLogoFile(file);
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        await updateSettings({
            appName: appName.trim(),
            appSubtitle: appSubtitle.trim() || null,
            debugShowJson,
            themeMode,
            themePalette,
            logoFile,
        });
    }

    const logoUrl = logoPreview ?? settings?.appLogoUrl ?? null;
    const logoMediaItem = !logoPreview && settings ? buildLogoMediaItem(settings, lang) : null;

    return (
        <AppCard
            title={lang === "es" ? "Ajustes de la app" : "App settings"}
            subtitle={lang === "es" ? "Nombre, logo, tema y depuración." : "Name, logo, theme and debug."}
            action={
                <Button type="submit" form="admin-settings-form" variant="contained" disabled={saving || loading}>
                    {saving ? (lang === "es" ? "Guardando…" : "Saving…") : lang === "es" ? "Guardar ajustes" : "Save settings"}
                </Button>
            }
        >
            {loading ? <AppEmptyState title={lang === "es" ? "Cargando ajustes…" : "Loading settings…"} variant="inline" /> : null}
            {error ? <Chip color="error" label={error} sx={{ mb: 1.5 }} /> : null}

            <Box id="admin-settings-form" component="form" onSubmit={handleSubmit} sx={{ display: "grid", gap: { xs: 1.5, md: 2 } }}>
                <AppFormGrid columns={{ xs: 1, md: 2 }} gap={1.5}>
                    <TextField
                        size="small"
                        label={lang === "es" ? "Nombre de la app" : "App name"}
                        value={appName}
                        onChange={(event) => setAppName(event.target.value)}
                        required
                    />
                    <TextField
                        size="small"
                        label={lang === "es" ? "Subtítulo" : "Subtitle"}
                        value={appSubtitle}
                        onChange={(event) => setAppSubtitle(event.target.value)}
                    />
                </AppFormGrid>

                <AppFormGrid columns={{ xs: 1, md: 3 }} gap={1.5}>
                    <Box sx={{ p: 1.25, border: 1, borderColor: "divider", borderRadius: 2 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5, fontWeight: 800 }}>
                            {lang === "es" ? "Depuración JSON" : "JSON debug"}
                        </Typography>
                        <FormControlLabel
                            control={<Checkbox checked={debugShowJson} onChange={(event) => setDebugShowJson(event.target.checked)} />}
                            label={
                                <Box>
                                    <Typography variant="body2">{lang === "es" ? "Mostrar secciones de JSON" : "Show JSON sections"}</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {lang === "es" ? "Afecta sólo a vistas administrativas." : "Affects admin views only."}
                                    </Typography>
                                </Box>
                            }
                        />
                    </Box>

                    <TextField
                        select
                        size="small"
                        label={lang === "es" ? "Tema por defecto" : "Default theme mode"}
                        value={themeMode}
                        onChange={(event) => setThemeMode(event.target.value as AdminSettingsThemeMode)}
                    >
                        {THEME_MODES.map((mode) => (
                            <MenuItem key={mode} value={mode}>{mode}</MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        select
                        size="small"
                        label={lang === "es" ? "Paleta por defecto" : "Default palette"}
                        value={themePalette}
                        onChange={(event) => setThemePalette(event.target.value as AdminSettingsPalette)}
                    >
                        {PALETTES.map((palette) => (
                            <MenuItem key={palette} value={palette}>{palette}</MenuItem>
                        ))}
                    </TextField>
                </AppFormGrid>

                <AppCard
                    title={lang === "es" ? "Logo de la app" : "App logo"}
                    subtitle="PNG / JPG / WEBP hasta 1,024px aprox."
                    padding="sm"
                    action={
                        <Button variant="outlined" component="label">
                            {lang === "es" ? "Seleccionar logo" : "Select logo"}
                            <input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={handleLogoChange} />
                        </Button>
                    }
                >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                        {logoUrl ? (
                            <Box
                                component="button"
                                type="button"
                                onClick={() => {
                                    if (logoMediaItem) setSelectedMedia(logoMediaItem);
                                }}
                                sx={{
                                    p: 0,
                                    width: 140,
                                    height: 110,
                                    border: 1,
                                    borderColor: "divider",
                                    borderRadius: 2,
                                    overflow: "hidden",
                                    backgroundColor: "background.default",
                                    cursor: logoMediaItem ? "pointer" : "default",
                                }}
                            >
                                <Box component="img" src={logoUrl} alt="Logo" sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            </Box>
                        ) : null}
                        <Typography variant="body2" color="text.secondary">
                            {logoFile
                                ? logoFile.name
                                : logoUrl
                                    ? lang === "es"
                                        ? "Logo actual configurado. Haz clic para verlo."
                                        : "Current logo configured. Click to view it."
                                    : lang === "es"
                                        ? "Aún no hay logo configurado."
                                        : "No logo configured yet."}
                        </Typography>
                    </Box>
                </AppCard>

                {settings?.updatedAt ? (
                    <Typography variant="caption" color="text.secondary">
                        {lang === "es" ? "Última actualización" : "Last updated"}: {settings.updatedAt}
                    </Typography>
                ) : null}
            </Box>

            {selectedMedia ? <MediaViewerModal item={selectedMedia} onClose={() => setSelectedMedia(null)} /> : null}
        </AppCard>
    );
}

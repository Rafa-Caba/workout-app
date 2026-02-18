import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAdminSettingsStore } from "@/state/adminSettings.store";
import type {
    AdminSettingsPalette,
    AdminSettingsThemeMode,
} from "@/types/adminSettings.types";
import { useI18n } from "@/i18n/I18nProvider";
import { MediaCard } from "@/components/media/MediaCard";
import { MediaLikeItem, MediaViewerModal } from "@/components/media/MediaViewerModal";
import type { MediaFeedItem } from "@/types/media.types";

export function AdminSettingsSection() {
    const { lang } = useI18n();

    const {
        settings,
        loading,
        saving,
        error,
        loadSettings,
        updateSettings,
    } = useAdminSettingsStore();

    const [appName, setAppName] = React.useState("");
    const [appSubtitle, setAppSubtitle] = React.useState("");
    const [debugShowJson, setDebugShowJson] = React.useState(false);
    const [themeMode, setThemeMode] =
        React.useState<AdminSettingsThemeMode>("system");
    const [themePalette, setThemePalette] =
        React.useState<AdminSettingsPalette>("blue");

    const [logoFile, setLogoFile] = React.useState<File | null>(null);
    const [logoPreview, setLogoPreview] = React.useState<string | null>(null);

    const [selectedMedia, setSelectedMedia] =
        React.useState<MediaLikeItem | null>(null);

    React.useEffect(() => {
        void loadSettings();
    }, [loadSettings]);

    const storedLogoUrl: string | null = React.useMemo(() => {
        if (!settings) return null;

        const anySettings = settings as any;
        return (
            anySettings.logoUrl ??
            anySettings.appLogoUrl ??
            anySettings.logo?.url ??
            null
        );
    }, [settings]);

    React.useEffect(() => {
        if (!settings) return;

        setAppName(settings.appName ?? "");
        setAppSubtitle(settings.appSubtitle ?? "");
        setDebugShowJson(!!settings.debug?.showJson);
        setThemeMode(settings.themeDefaults?.mode ?? "system");
        setThemePalette(settings.themeDefaults?.palette ?? "blue");

        setLogoFile(null);
        if (logoPreview) {
            URL.revokeObjectURL(logoPreview);
        }
        setLogoPreview(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [settings?.id]);

    React.useEffect(() => {
        return () => {
            if (logoPreview) {
                URL.revokeObjectURL(logoPreview);
            }
        };
    }, [logoPreview]);

    function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0] ?? null;
        if (logoPreview) {
            URL.revokeObjectURL(logoPreview);
        }

        if (file) {
            const url = URL.createObjectURL(file);
            setLogoPreview(url);
            setLogoFile(file);
        } else {
            setLogoPreview(null);
            setLogoFile(null);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        await updateSettings({
            appName: appName.trim(),
            appSubtitle: appSubtitle.trim() || null,
            debugShowJson,
            themeMode,
            themePalette,
            logoFile,
        });
    }

    const hasLogo = !!logoPreview || !!storedLogoUrl;

    const logoMediaItem: MediaFeedItem | null =
        !logoPreview && storedLogoUrl && settings
            ? ({
                source: "routine",

                publicId: (settings as any).logoPublicId ?? "admin-logo",
                url: storedLogoUrl,
                resourceType: "image",
                format: null,
                createdAt: settings.updatedAt ?? new Date().toISOString(),
                meta: { kind: "admin_logo" },

                date: null,
                weekKey: "",
                sessionId: null,
                sessionType: lang === "es" ? "Logo de la app" : "App logo",
                dayNotes: null,
                dayTags: null,
            } as unknown as MediaFeedItem)
            : null;

    return (
        <Card className="w-full">
            <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base">
                    {lang === "es" ? "Ajustes de la app" : "App settings"}
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
                {loading ? (
                    <div className="text-xs text-muted-foreground">
                        {lang === "es" ? "Cargando ajustes..." : "Loading settings..."}
                    </div>
                ) : null}

                {error ? (
                    <div className="text-xs text-red-500 wrap-break-words">{error}</div>
                ) : null}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-1">
                            <label className="text-xs font-medium">
                                {lang === "es" ? "Nombre de la app" : "App name"}
                            </label>
                            <input
                                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                value={appName}
                                onChange={(e) => setAppName(e.target.value)}
                                placeholder={
                                    lang === "es" ? "Ej. Workout Tracker" : "e.g. Workout Tracker"
                                }
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-medium">
                                {lang === "es" ? "Subtítulo" : "Subtitle"}
                            </label>
                            <input
                                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                value={appSubtitle}
                                onChange={(e) => setAppSubtitle(e.target.value)}
                                placeholder={
                                    lang === "es"
                                        ? "Ej. Tu semana en datos reales"
                                        : "e.g. Your week in real data"
                                }
                            />
                        </div>
                    </div>

                    {/* Debug + tema */}
                    <div className="grid gap-3 md:grid-cols-3">
                        <div className="space-y-1">
                            <label className="text-xs font-medium">
                                {lang === "es" ? "Depuración JSON" : "JSON debug"}
                            </label>
                            <div className="flex items-start gap-2 rounded-md border bg-card/40 px-3 py-2">
                                <input
                                    id="debug-json"
                                    type="checkbox"
                                    className="mt-0.5 h-4 w-4"
                                    checked={debugShowJson}
                                    onChange={(e) => setDebugShowJson(e.target.checked)}
                                />
                                <div className="flex flex-col">
                                    <span className="text-xs">
                                        {lang === "es"
                                            ? "Mostrar secciones de JSON en el panel"
                                            : "Show JSON debug sections in the UI"}
                                    </span>
                                    <span className="text-[11px] text-muted-foreground">
                                        {lang === "es"
                                            ? "Afecta sólo a vistas administrativas."
                                            : "Affects admin views only."}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-medium">
                                {lang === "es" ? "Tema por defecto" : "Default theme mode"}
                            </label>
                            <select
                                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                value={themeMode}
                                onChange={(e) =>
                                    setThemeMode(e.target.value as AdminSettingsThemeMode)
                                }
                            >
                                <option value="system">
                                    {lang === "es" ? "Sistema" : "System"}
                                </option>
                                <option value="light">
                                    {lang === "es" ? "Claro" : "Light"}
                                </option>
                                <option value="dark">
                                    {lang === "es" ? "Oscuro" : "Dark"}
                                </option>
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-medium">
                                {lang === "es" ? "Paleta por defecto" : "Default palette"}
                            </label>
                            <select
                                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                value={themePalette}
                                onChange={(e) =>
                                    setThemePalette(e.target.value as AdminSettingsPalette)
                                }
                            >
                                <option value="blue">Blue</option>
                                <option value="emerald">Emerald</option>
                                <option value="violet">Violet</option>
                                <option value="red">Red</option>
                                <option value="mint">Mint</option>
                            </select>
                        </div>
                    </div>

                    {/* Logo */}
                    <div className="space-y-2 rounded-xl border bg-card/60 p-3">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <div className="text-sm font-semibold">
                                    {lang === "es" ? "Logo de la app" : "App logo"}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {lang === "es"
                                        ? "PNG / JPG / WEBP hasta 1,024px aprox."
                                        : "PNG / JPG / WEBP up to ~1024px."}
                                </div>
                            </div>

                            <label className="inline-flex w-full sm:w-auto cursor-pointer items-center justify-center rounded-md border bg-background px-3 py-2 text-xs font-medium hover:bg-accent">
                                <span>
                                    {lang === "es" ? "Seleccionar logo" : "Select logo"}
                                </span>
                                <input
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp"
                                    className="hidden"
                                    onChange={handleLogoChange}
                                />
                            </label>
                        </div>

                        {hasLogo ? (
                            <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-start">
                                {logoPreview ? (
                                    <div className="h-16 w-16 overflow-hidden rounded-md border bg-background">
                                        <img
                                            src={logoPreview}
                                            alt="Logo preview"
                                            className="h-full w-full object-contain"
                                        />
                                    </div>
                                ) : logoMediaItem ? (
                                    <div className="w-28 sm:w-32">
                                        <MediaCard
                                            item={logoMediaItem}
                                            onOpen={(it) => setSelectedMedia(it)}
                                            showMetaInfo={false}
                                            showTitle={false}
                                        />
                                    </div>
                                ) : null}

                                <div className="flex flex-col text-xs text-muted-foreground">
                                    {logoPreview ? (
                                        <span>
                                            {lang === "es"
                                                ? "Nuevo logo listo para guardar."
                                                : "New logo ready to be saved."}
                                        </span>
                                    ) : storedLogoUrl ? (
                                        <span className="wrap-break-words">
                                            {lang === "es"
                                                ? "Logo actual configurado. Haz clic para verlo."
                                                : "Current logo configured. Click to view."}
                                        </span>
                                    ) : null}
                                </div>
                            </div>
                        ) : (
                            <div className="mt-2 text-xs text-muted-foreground">
                                {lang === "es"
                                    ? "No hay logo configurado todavía."
                                    : "No logo configured yet."}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
                        <Button
                            type="submit"
                            className="w-full sm:w-auto"
                            disabled={saving || loading || !settings}
                        >
                            {saving
                                ? lang === "es"
                                    ? "Guardando..."
                                    : "Saving..."
                                : lang === "es"
                                    ? "Guardar ajustes"
                                    : "Save settings"}
                        </Button>
                    </div>

                    {settings ? (
                        <div className="text-[11px] text-muted-foreground wrap-break-words">
                            {lang === "es"
                                ? `Última actualización: ${settings.updatedAt}`
                                : `Last updated: ${settings.updatedAt}`}
                        </div>
                    ) : null}
                </form>

                {selectedMedia ? (
                    <MediaViewerModal
                        item={selectedMedia}
                        onClose={() => setSelectedMedia(null)}
                    />
                ) : null}
            </CardContent>
        </Card>
    );
}

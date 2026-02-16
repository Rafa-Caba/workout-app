import React from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/I18nProvider";

// 👇 Usa aquí tus sections reales.
// Si por ahora sólo tienes AdminUsersPage / AdminSettingsPage,
// puedes importarlas y usarlas igual.
import { AdminUsersSection } from "@/sections/admin/AdminUsersSection";
import { AdminSettingsSection } from "@/sections/admin/AdminSettingsSection";

type AdminTab = "users" | "settings";

function tabButtonClass(active: boolean) {
    return cn(
        "h-9 px-3 rounded-full border text-sm transition-colors",
        "flex items-center gap-2",
        active
            ? "bg-primary text-primary-foreground shadow-sm"
            : "bg-card text-muted-foreground hover:bg-muted/70"
    );
}

export function AdminPage() {
    const { t, lang } = useI18n();
    const [tab, setTab] = React.useState<AdminTab>("users");

    const title =
        lang === "es"
            ? "Panel de administración"
            : "Admin panel";

    const subtitle =
        lang === "es"
            ? "Gestiona usuarios y ajustes globales de la app."
            : "Manage users and global app settings.";

    return (
        <div className="space-y-6">
            <PageHeader title={title} subtitle={subtitle} />

            {/* Tabs */}
            <div className="rounded-xl border bg-card p-3 space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm font-medium">
                        {lang === "es" ? "Secciones de administración" : "Admin sections"}
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            className={tabButtonClass(tab === "users")}
                            onClick={() => setTab("users")}
                        >
                            {lang === "es" ? "Usuarios" : "Users"}
                        </Button>

                        <Button
                            type="button"
                            variant="ghost"
                            className={tabButtonClass(tab === "settings")}
                            onClick={() => setTab("settings")}
                        >
                            {lang === "es" ? "Ajustes de la app" : "App settings"}
                        </Button>
                    </div>
                </div>

                <div className="text-xs text-muted-foreground">
                    {tab === "users"
                        ? lang === "es"
                            ? "Crea, edita y desactiva usuarios."
                            : "Create, edit and deactivate users."
                        : lang === "es"
                            ? "Configura nombre de la app, logo, tema y opciones de depuración."
                            : "Configure app name, logo, theme and debug options."}
                </div>
            </div>

            {/* Contenido de cada tab */}
            {tab === "users" ? (
                <div className="space-y-4">
                    <AdminUsersSection />
                </div>
            ) : null}

            {tab === "settings" ? (
                <div className="space-y-4">
                    <AdminSettingsSection />
                </div>
            ) : null}
        </div>
    );
}

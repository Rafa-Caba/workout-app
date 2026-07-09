// src/pages/admin/AdminPage.tsx
// MUI admin dashboard page with responsive tabs for users and app settings.

import React from "react";

import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";

import { AppCard, AppPage, AppResponsiveTabs, AppSectionHeader } from "@/components/mui";
import { useI18n } from "@/i18n/I18nProvider";
import { AdminUsersSection } from "@/sections/admin/AdminUsersSection";
import { AdminSettingsSection } from "@/sections/admin/AdminSettingsSection";

type AdminTab = "users" | "settings";

export function AdminPage() {
    const { lang } = useI18n();
    const [tab, setTab] = React.useState<AdminTab>("users");

    const description =
        tab === "users"
            ? lang === "es"
                ? "Crea, edita y desactiva usuarios."
                : "Create, edit and deactivate users."
            : lang === "es"
                ? "Configura nombre de la app, logo, tema y opciones de depuración."
                : "Configure app name, logo, theme and debug options.";

    return (
        <AppPage
            title={lang === "es" ? "Panel de administración" : "Admin panel"}
            subtitle={lang === "es" ? "Gestiona usuarios y ajustes globales de la app." : "Manage users and global app settings."}
        >
            <AppCard>
                <Box sx={{ display: "grid", gap: { xs: 1.5, md: 2 } }}>
                    <AppSectionHeader
                        title={lang === "es" ? "Secciones de administración" : "Admin sections"}
                        description={description}
                        dense
                        meta={<Chip size="small" color="primary" label={tab === "users" ? "Usuarios" : "Settings"} />}
                    />

                    <AppResponsiveTabs
                        value={tab}
                        ariaLabel={lang === "es" ? "Secciones de administración" : "Admin sections"}
                        onChange={(next) => setTab(next === "settings" ? "settings" : "users")}
                        tabs={[
                            { value: "users", label: lang === "es" ? "Usuarios" : "Users" },
                            { value: "settings", label: lang === "es" ? "Ajustes de la app" : "App settings" },
                        ]}
                        variant="scrollable"
                    />
                </Box>
            </AppCard>

            {tab === "users" ? <AdminUsersSection /> : <AdminSettingsSection />}
        </AppPage>
    );
}

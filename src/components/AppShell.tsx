import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { NavBar } from "@/components/NavBar";

import { useI18n } from "@/i18n/I18nProvider";
import { useAdminSettingsStore } from "@/state/adminSettings.store";

export function AppShell() {
    const location = useLocation();
    const isAuthPage = location.pathname === "/login" || location.pathname === "/register";
    const adminSettings = useAdminSettingsStore((s) => s.settings);

    const appName =
        adminSettings?.appName && adminSettings.appName.trim().length > 0
            ? adminSettings.appName
            : "Workout App";

    // Actualizar el título del documento según el nombre de la app
    React.useEffect(() => {
        document.title = appName;
    }, [appName]);

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Toaster richColors position="bottom-right" />

            {/* Header + Nav sólo en páginas protegidas (no en login/register) */}
            {!isAuthPage ? (
                <NavBar />
            ) : null}

            <main className="mx-auto max-w-6xl p-6">
                <Outlet />
            </main>
        </div>
    );
}

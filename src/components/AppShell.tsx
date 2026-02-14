import { Outlet, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { NavBar } from "@/components/NavBar";

export function AppShell() {
    const location = useLocation();
    const isAuthPage = location.pathname === "/login" || location.pathname === "/register";

    return (
        <div className="min-h-screen">
            <Toaster richColors position="bottom-right" />
            {!isAuthPage ? <NavBar /> : null}
            <main className="mx-auto max-w-6xl p-6">
                <Outlet />
            </main>
        </div>
    );
}

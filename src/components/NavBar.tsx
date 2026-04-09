// src/components/NavBar.tsx

/**
 * NavBar
 *
 * Updated mobile behavior:
 * - replaces the small-screen dropdown nav with a slide-in drawer
 * - keeps desktop nav unchanged
 * - includes navigation, insights links, language toggle, profile/settings/logout
 */

import * as React from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuthStore } from "@/state/auth.store";
import { useI18n } from "@/i18n/I18nProvider";

import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

import { Menu, X } from "lucide-react";
import { useAppSettingsStore } from "@/state/appSettings.store";
import { useThemeSyncFromAppSettings } from "@/hooks/useThemeSyncFromAppSettings";

function TopNavLink({
    to,
    label,
    end = true,
}: {
    to: string;
    label: string;
    end?: boolean;
}) {
    return (
        <NavLink
            to={to}
            end={end}
            className={({ isActive }) =>
                [
                    "text-sm",
                    "rounded-lg",
                    "px-3",
                    "py-2",
                    "border",
                    "transition",
                    "whitespace-nowrap",
                    isActive
                        ? "bg-primary text-primary-foreground border-transparent shadow-sm"
                        : "bg-background hover:bg-muted/60",
                ].join(" ")
            }
        >
            {label}
        </NavLink>
    );
}

function DrawerNavLink({
    to,
    label,
    active,
    onClick,
}: {
    to: string;
    label: string;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <Link
            to={to}
            onClick={onClick}
            className={[
                "block",
                "w-full",
                "rounded-xl",
                "border",
                "px-3",
                "py-3",
                "text-sm",
                "transition",
                active
                    ? "bg-primary text-primary-foreground border-transparent shadow-sm"
                    : "bg-background hover:bg-muted/60",
            ].join(" ")}
        >
            {label}
        </Link>
    );
}

function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "U";
    const first = parts[0]?.[0] ?? "U";
    const second = parts.length > 1 ? parts[1]?.[0] : parts[0]?.[1];
    return (first + (second ?? "")).toUpperCase();
}

type NavItem = {
    label: string;
    to: string;
    end?: boolean;
    match?: (pathname: string) => boolean;
    adminOnly?: boolean;
    trainerOnly?: boolean;
    showRoutines?: boolean;
};

export function NavBar() {
    const { t, lang, setLang } = useI18n();

    const appSettings = useAppSettingsStore((s) => s.settings);
    const loadAppSettings = useAppSettingsStore((s) => s.loadAppSettings);

    const user = useAuthStore((s) => s.user);
    const accessToken = useAuthStore((s) => s.accessToken);
    const logout = useAuthStore((s) => s.logout);

    const location = useLocation();
    const navigate = useNavigate();

    const pathname = location.pathname;

    useThemeSyncFromAppSettings();

    const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

    React.useEffect(() => {
        void loadAppSettings();
    }, [loadAppSettings]);

    React.useEffect(() => {
        setMobileMenuOpen(false);
    }, [pathname]);

    React.useEffect(() => {
        if (!mobileMenuOpen) return;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [mobileMenuOpen]);

    const appName =
        appSettings?.appName && appSettings.appName.trim().length > 0
            ? appSettings.appName
            : "Workout App";

    const appSubtitle =
        lang === "es"
            ? "Seguimiento de entrenamiento y sueño"
            : "Training & sleep tracker";

    const logoUrl = appSettings?.logoUrl ?? null;

    const inInsights = pathname === "/insights" || pathname.startsWith("/insights/");

    const onLogout = async () => {
        await logout();
        setMobileMenuOpen(false);
        navigate("/login", { replace: true });
    };

    const toggleLang = () => setLang(lang === "es" ? "en" : "es");

    const avatarUrl = user?.profilePicUrl ?? null;
    const initials = user?.name ? getInitials(user.name) : "U";

    const isAdmin = user?.role === "admin";
    const isTrainee = user?.coachMode === "TRAINEE";
    const isTrainer = user?.coachMode === "TRAINER";

    const navItems: NavItem[] = React.useMemo(
        () => [
            { label: t("nav.home"), to: "/", end: true },
            { label: "Gym Check", to: "/gym-check", end: true },
            { label: "Outdoor", to: "/outdoor", end: true },

            {
                label: t("nav.routines"),
                to: "/routines",
                end: true,
                showRoutines: user?.coachMode === "TRAINEE",
            },

            { label: t("nav.movements"), to: "/movements", end: true },
            { label: "Sleep", to: "/sleep", end: true },
            { label: t("nav.days"), to: "/days", end: true },
            { label: t("nav.weeks"), to: "/weeks", end: true },
            { label: t("nav.trends"), to: "/trends", end: true },
            { label: t("nav.media"), to: "/media", end: true },
            { label: t("nav.pva"), to: "/plan-vs-actual", end: true },

            {
                label: lang === "es" ? "Entrenador" : "Trainer",
                to: "/trainer",
                end: true,
                trainerOnly: true,
            },

            { label: "Admin", to: "/admin", end: true, adminOnly: true },
        ],
        [t, lang, user?.coachMode]
    );

    function isActiveItem(item: NavItem) {
        if (typeof item.match === "function") return item.match(pathname);
        if (item.end) return pathname === item.to;
        return pathname === item.to || pathname.startsWith(item.to + "/");
    }

    React.useEffect(() => {
        document.title = appName;
    }, [appName]);

    const visibleNavItems = navItems
        .filter((item) => !item.adminOnly || isAdmin)
        .filter((item) => !item.trainerOnly || isTrainer)
        .filter((item) => !item.showRoutines || !isTrainee);

    return (
        <>
            <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/70">
                <div className="mx-auto max-w-6xl px-3 sm:px-4 py-3">
                    <div className="flex items-start sm:items-center justify-between gap-3">
                        <div className="min-w-0">
                            <div className="hidden sm:flex items-center gap-3 min-w-0">
                                <div className="flex items-center gap-3 min-w-0">
                                    {logoUrl ? (
                                        <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border bg-background shrink-0">
                                            <img
                                                src={logoUrl}
                                                alt={appName}
                                                className="h-full w-full object-cover"
                                                loading="lazy"
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex h-9 w-9 items-center justify-center rounded-xl border bg-background text-xs font-semibold shrink-0">
                                            {appName.slice(0, 2).toUpperCase()}
                                        </div>
                                    )}

                                    <div className="flex flex-col min-w-0">
                                        <span className="text-sm font-semibold leading-tight truncate">
                                            {appName}
                                        </span>
                                        <span className="text-xs text-muted-foreground leading-tight truncate">
                                            {appSubtitle}
                                        </span>
                                    </div>
                                </div>

                                <div className="shrink-0">
                                    <span
                                        className={[
                                            "inline-flex items-center gap-2 rounded-full border px-3 py-1",
                                            "text-xs font-semibold tracking-wide",
                                            "bg-background/70 backdrop-blur shadow-sm",
                                            user?.role === "admin"
                                                ? "border-primary/25 text-primary"
                                                : user?.coachMode === "TRAINEE"
                                                    ? "border-accent/25 text-accent-foreground"
                                                    : "border-muted-foreground/20 text-muted-foreground",
                                        ].join(" ")}
                                    >
                                        <span
                                            className={[
                                                "h-2 w-2 rounded-full",
                                                user?.role === "admin"
                                                    ? "bg-primary"
                                                    : user?.coachMode === "TRAINEE"
                                                        ? "bg-accent"
                                                        : "bg-muted-foreground",
                                            ].join(" ")}
                                            aria-hidden="true"
                                        />
                                        {user?.role === "admin"
                                            ? "Admin"
                                            : user?.coachMode === "TRAINEE"
                                                ? "Trainee"
                                                : "Coach"}
                                    </span>
                                </div>
                            </div>

                            <div className="sm:hidden flex items-start gap-3 min-w-0">
                                {logoUrl ? (
                                    <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border bg-background shrink-0">
                                        <img
                                            src={logoUrl}
                                            alt={appName}
                                            className="h-full w-full object-cover"
                                            loading="lazy"
                                        />
                                    </div>
                                ) : (
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border bg-background text-xs font-semibold shrink-0">
                                        {appName.slice(0, 2).toUpperCase()}
                                    </div>
                                )}

                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-sm font-semibold leading-tight truncate">
                                            {appName}
                                        </span>
                                        <span className="text-xs text-muted-foreground leading-tight truncate">
                                            {appSubtitle}
                                        </span>
                                    </div>

                                    <div className="mt-2">
                                        <span
                                            className={[
                                                "inline-flex items-center gap-2 rounded-full border px-3 py-1",
                                                "text-[11px] font-semibold tracking-wide",
                                                "bg-background/70 backdrop-blur shadow-sm",
                                                user?.role === "admin"
                                                    ? "border-primary/25 text-primary"
                                                    : user?.coachMode === "TRAINEE"
                                                        ? "border-accent/25 text-accent-foreground"
                                                        : "border-muted-foreground/20 text-muted-foreground",
                                            ].join(" ")}
                                        >
                                            <span
                                                className={[
                                                    "h-2 w-2 rounded-full",
                                                    user?.role === "admin"
                                                        ? "bg-primary"
                                                        : user?.coachMode === "TRAINEE"
                                                            ? "bg-accent"
                                                            : "bg-muted-foreground",
                                                ].join(" ")}
                                                aria-hidden="true"
                                            />
                                            {user?.role === "admin"
                                                ? "Admin"
                                                : user?.coachMode === "TRAINEE"
                                                    ? "Trainee"
                                                    : "Coach"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <div className="md:hidden">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    aria-label={lang === "es" ? "Menú" : "Menu"}
                                    onClick={() => setMobileMenuOpen(true)}
                                >
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </div>

                            <ThemeToggle />

                            <Button
                                variant="outline"
                                onClick={toggleLang}
                                className="whitespace-nowrap hidden sm:inline-flex"
                            >
                                {lang === "es" ? t("lang.english") : t("lang.spanish")}
                            </Button>

                            <Button
                                variant="outline"
                                onClick={toggleLang}
                                className="whitespace-nowrap sm:hidden h-9 px-3"
                                aria-label={lang === "es" ? t("lang.english") : t("lang.spanish")}
                                title={lang === "es" ? t("lang.english") : t("lang.spanish")}
                            >
                                {lang === "es" ? "EN" : "ES"}
                            </Button>

                            {accessToken ? (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button
                                            type="button"
                                            className={[
                                                "h-11 w-11 sm:h-12 sm:w-12 ml-1 sm:ml-2 rounded-full border bg-background overflow-hidden",
                                                "grid place-items-center",
                                                "hover:bg-muted/60 transition",
                                            ].join(" ")}
                                            aria-label={t("nav.userMenu.account")}
                                            title={t("nav.userMenu.account")}
                                        >
                                            {avatarUrl ? (
                                                <img
                                                    src={avatarUrl}
                                                    alt={user?.name ?? "User"}
                                                    className="h-full w-full object-cover"
                                                    referrerPolicy="no-referrer"
                                                />
                                            ) : (
                                                <span className="text-xs font-semibold text-muted-foreground">
                                                    {initials}
                                                </span>
                                            )}
                                        </button>
                                    </DropdownMenuTrigger>

                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>
                                            {user?.name ?? t("nav.userMenu.account")}
                                        </DropdownMenuLabel>

                                        <DropdownMenuItem onClick={() => navigate("/me")}>
                                            {t("nav.userMenu.myProfile")}
                                        </DropdownMenuItem>

                                        <DropdownMenuItem onClick={() => navigate("/settings")}>
                                            {t("nav.userMenu.settings")}
                                        </DropdownMenuItem>

                                        <DropdownMenuSeparator />

                                        <DropdownMenuItem onClick={onLogout}>
                                            {t("nav.userMenu.logout")}
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            ) : (
                                <Button asChild variant="outline" className="whitespace-nowrap">
                                    <Link to="/login">{t("auth.login")}</Link>
                                </Button>
                            )}
                        </div>
                    </div>

                    <nav className="mt-3 hidden md:flex flex-wrap items-center gap-2">
                        {visibleNavItems.map((item) => (
                            <TopNavLink
                                key={item.to}
                                to={item.to}
                                label={item.label}
                                end={item.end}
                            />
                        ))}

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    type="button"
                                    className={[
                                        "text-sm rounded-lg px-3 py-2 border transition whitespace-nowrap",
                                        inInsights
                                            ? "bg-primary text-primary-foreground border-transparent shadow-sm"
                                            : "bg-background hover:bg-muted/60",
                                    ].join(" ")}
                                >
                                    {t("nav.insights")}
                                </button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="start">
                                <DropdownMenuItem onClick={() => navigate("/insights")}>
                                    {t("nav.insights")}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => navigate("/insights/streaks")}>
                                    {t("nav.streaks")}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigate("/insights/prs")}>
                                    {t("nav.prs")}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigate("/insights/recovery")}>
                                    {t("nav.recovery")}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </nav>
                </div>
            </header>

            <div
                className={[
                    "fixed inset-0 z-50 md:hidden transition",
                    mobileMenuOpen ? "pointer-events-auto" : "pointer-events-none",
                ].join(" ")}
                aria-hidden={!mobileMenuOpen}
            >
                <div
                    className={[
                        "absolute inset-0 bg-black/50 transition-opacity",
                        mobileMenuOpen ? "opacity-100" : "opacity-0",
                    ].join(" ")}
                    onClick={() => setMobileMenuOpen(false)}
                />

                <aside
                    className={[
                        "absolute right-0 top-0 h-full w-[86%] max-w-[90] border-l bg-card shadow-2xl",
                        "transition-transform duration-300 ease-out",
                        "flex flex-col",
                        mobileMenuOpen ? "translate-x-0" : "translate-x-full",
                    ].join(" ")}
                    role="dialog"
                    aria-modal="true"
                    aria-label={lang === "es" ? "Menú lateral" : "Side menu"}
                >
                    <div className="flex items-center justify-between border-b px-4 py-4 shrink-0">
                        <div className="min-w-0">
                            <div className="text-sm font-semibold truncate">{appName}</div>
                            <div className="text-xs text-muted-foreground truncate">
                                {lang === "es" ? "Navegación" : "Navigation"}
                            </div>
                        </div>

                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setMobileMenuOpen(false)}
                            aria-label={lang === "es" ? "Cerrar menú" : "Close menu"}
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
                        <div className="space-y-2 columns-2">
                            {visibleNavItems.map((item) => (
                                <DrawerNavLink
                                    key={item.to}
                                    to={item.to}
                                    label={item.label}
                                    active={isActiveItem(item)}
                                    onClick={() => setMobileMenuOpen(false)}
                                />
                            ))}
                        </div>

                        <div>
                            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                                {t("nav.insights")}
                            </div>
                            <div className="space-y-2 columns-2">

                                <DrawerNavLink
                                    to="/insights"
                                    label={t("nav.insights")}
                                    active={pathname === "/insights"}
                                    onClick={() => setMobileMenuOpen(false)}
                                />
                                <DrawerNavLink
                                    to="/insights/streaks"
                                    label={t("nav.streaks")}
                                    active={pathname.startsWith("/insights/streaks")}
                                    onClick={() => setMobileMenuOpen(false)}
                                />
                                <DrawerNavLink
                                    to="/insights/prs"
                                    label={t("nav.prs")}
                                    active={pathname.startsWith("/insights/prs")}
                                    onClick={() => setMobileMenuOpen(false)}
                                />
                                <DrawerNavLink
                                    to="/insights/recovery"
                                    label={t("nav.recovery")}
                                    active={pathname.startsWith("/insights/recovery")}
                                    onClick={() => setMobileMenuOpen(false)}
                                />
                            </div>
                        </div>

                        {accessToken ? (
                            <div>
                                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                                    {t("nav.userMenu.account")}
                                </div>
                                <div className="space-y-2 columns-2">

                                    <DrawerNavLink
                                        to="/me"
                                        label={t("nav.userMenu.myProfile")}
                                        active={pathname === "/me"}
                                        onClick={() => setMobileMenuOpen(false)}
                                    />

                                    <DrawerNavLink
                                        to="/settings"
                                        label={t("nav.userMenu.settings")}
                                        active={pathname === "/settings"}
                                        onClick={() => setMobileMenuOpen(false)}
                                    />

                                    <button
                                        type="button"
                                        onClick={() => void onLogout()}
                                        className="block w-full rounded-xl border bg-background px-3 py-3 text-left text-sm transition hover:bg-muted/60"
                                    >
                                        {t("nav.userMenu.logout")}
                                    </button>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </aside>
            </div>
        </>
    );
}
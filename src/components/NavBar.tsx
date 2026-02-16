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

import { Menu } from "lucide-react";

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
};

export function NavBar() {
    const { t, lang, setLang } = useI18n();

    const user = useAuthStore((s) => s.user);
    const accessToken = useAuthStore((s) => s.accessToken);
    const logout = useAuthStore((s) => s.logout);

    const location = useLocation();
    const navigate = useNavigate();

    const pathname = location.pathname;

    const inInsights = pathname === "/insights" || pathname.startsWith("/insights/");

    const onLogout = async () => {
        await logout();
        navigate("/login", { replace: true });
    };

    const toggleLang = () => setLang(lang === "es" ? "en" : "es");

    const avatarUrl = user?.profilePicUrl ?? null;
    const initials = user?.name ? getInitials(user.name) : "U";

    const navItems: NavItem[] = React.useMemo(
        () => [
            { label: t("nav.home"), to: "/", end: true },
            { label: "Gym Check", to: "/gym-check", end: true },
            { label: t("nav.routines"), to: "/routines", end: true },
            { label: t("nav.movements"), to: "/movements", end: true },
            { label: "Sleep", to: "/sleep", end: true },
            { label: t("nav.days"), to: "/days", end: true },
            { label: t("nav.weeks"), to: "/weeks", end: true },
            { label: t("nav.trends"), to: "/trends", end: true },
            { label: t("nav.media"), to: "/media", end: true },
            { label: t("nav.pva"), to: "/plan-vs-actual", end: true },
        ],
        [t]
    );

    function isActiveItem(item: NavItem) {
        if (typeof item.match === "function") return item.match(pathname);
        if (item.end) return pathname === item.to;
        return pathname === item.to || pathname.startsWith(item.to + "/");
    }

    return (
        <header className="sticky top-1 z-40 border-b bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/70">
            <div className="mx-auto max-w-6xl px-4 py-3">
                {/* Row 1 */}
                <div className="flex items-center justify-between gap-3">
                    <Link to="/" className="font-semibold tracking-tight" style={{ fontSize: "1.3rem" }}>
                        {t("app.title")}
                    </Link>

                    <div className="flex items-center gap-2">
                        {/* ✅ Mobile nav burger */}
                        <div className="md:hidden">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="icon" aria-label={lang === "es" ? "Menú" : "Menu"}>
                                        <Menu className="h-5 w-5" />
                                    </Button>
                                </DropdownMenuTrigger>

                                <DropdownMenuContent align="end" className="min-w-56">
                                    <DropdownMenuLabel>{lang === "es" ? "Navegación" : "Navigation"}</DropdownMenuLabel>

                                    {navItems.map((item) => {
                                        const active = isActiveItem(item);
                                        return (
                                            <DropdownMenuItem
                                                key={item.to}
                                                onClick={() => navigate(item.to)}
                                                className={active ? "font-semibold" : ""}
                                            >
                                                {item.label}
                                            </DropdownMenuItem>
                                        );
                                    })}

                                    <DropdownMenuSeparator />

                                    {/* Insights (expanded) */}
                                    <DropdownMenuItem
                                        onClick={() => navigate("/insights")}
                                        className={inInsights && pathname === "/insights" ? "font-semibold" : ""}
                                    >
                                        {t("nav.insights")}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => navigate("/insights/streaks")}
                                        className={pathname.startsWith("/insights/streaks") ? "font-semibold" : ""}
                                    >
                                        {t("nav.streaks")}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => navigate("/insights/prs")}
                                        className={pathname.startsWith("/insights/prs") ? "font-semibold" : ""}
                                    >
                                        {t("nav.prs")}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => navigate("/insights/recovery")}
                                        className={pathname.startsWith("/insights/recovery") ? "font-semibold" : ""}
                                    >
                                        {t("nav.recovery")}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        <ThemeToggle />

                        <Button variant="outline" onClick={toggleLang} className="whitespace-nowrap">
                            {lang === "es" ? t("lang.english") : t("lang.spanish")}
                        </Button>

                        {accessToken ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        type="button"
                                        className={[
                                            "h-12 w-12 ml-2 rounded-full border bg-background overflow-hidden",
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
                                            <span className="text-xs font-semibold text-muted-foreground">{initials}</span>
                                        )}
                                    </button>
                                </DropdownMenuTrigger>

                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>{user?.name ?? t("nav.userMenu.account")}</DropdownMenuLabel>

                                    <DropdownMenuItem onClick={() => navigate("/me")}>
                                        {t("nav.userMenu.myProfile")}
                                    </DropdownMenuItem>

                                    <DropdownMenuItem onClick={() => navigate("/settings")}>
                                        {t("nav.userMenu.settings")}
                                    </DropdownMenuItem>

                                    <DropdownMenuSeparator />

                                    <DropdownMenuItem onClick={onLogout}>{t("nav.userMenu.logout")}</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <Button asChild variant="outline" className="whitespace-nowrap">
                                <Link to="/login">{t("auth.login")}</Link>
                            </Button>
                        )}
                    </div>
                </div>

                {/* Row 2 — Desktop nav only */}
                <nav className="mt-3 hidden md:flex flex-wrap items-center gap-2">
                    <TopNavLink to="/" label={t("nav.home")} end />
                    <TopNavLink to="/gym-check" label="Gym Check" end />
                    <TopNavLink to="/routines" label={t("nav.routines")} end />
                    <TopNavLink to="/movements" label={t("nav.movements")} end />
                    <TopNavLink to="/sleep" label="Sleep" end />
                    <TopNavLink to="/days" label={t("nav.days")} end />
                    <TopNavLink to="/weeks" label={t("nav.weeks")} end />
                    <TopNavLink to="/trends" label={t("nav.trends")} end />
                    <TopNavLink to="/media" label={t("nav.media")} end />
                    <TopNavLink to="/plan-vs-actual" label={t("nav.pva")} end />

                    {/* Insights dropdown (desktop) */}
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
                            <DropdownMenuItem onClick={() => navigate("/insights")}>{t("nav.insights")}</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => navigate("/insights/streaks")}>{t("nav.streaks")}</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate("/insights/prs")}>{t("nav.prs")}</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate("/insights/recovery")}>{t("nav.recovery")}</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </nav>
            </div>
        </header>
    );
}

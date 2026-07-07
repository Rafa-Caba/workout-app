// src/components/NavBar.tsx
// Material UI app navigation shell.
// Keeps existing auth/navigation logic while replacing custom/Radix UI with MUI.

import * as React from "react";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import CloseIcon from "@mui/icons-material/Close";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import PersonIcon from "@mui/icons-material/Person";
import SettingsIcon from "@mui/icons-material/Settings";
import AppBar from "@mui/material/AppBar";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { alpha, useTheme as useMuiTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useLocation, useNavigate } from "react-router-dom";

import { ThemeToggle } from "@/components/ThemeToggle";
import { useI18n } from "@/i18n/I18nProvider";
import { useThemeSyncFromAppSettings } from "@/hooks/useThemeSyncFromAppSettings";
import { useAppSettingsStore } from "@/state/appSettings.store";
import { useAuthStore } from "@/state/auth.store";

type NavItem = {
    label: string;
    to: string;
    end?: boolean;
    match?: (pathname: string) => boolean;
    adminOnly?: boolean;
    trainerOnly?: boolean;
    hideForTrainee?: boolean;
};

function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "U";

    const first = parts[0]?.[0] ?? "U";
    const second = parts.length > 1 ? parts[1]?.[0] : parts[0]?.[1];

    return `${first}${second ?? ""}`.toUpperCase();
}

function getRoleLabel(args: {
    isAdmin: boolean;
    isTrainer: boolean;
    isTrainee: boolean;
}): string {
    if (args.isAdmin) return "Admin";
    if (args.isTrainer) return "Coach";
    if (args.isTrainee) return "Trainee";
    return "User";
}

function isNavItemActive(item: NavItem, pathname: string): boolean {
    if (typeof item.match === "function") return item.match(pathname);
    if (item.end) return pathname === item.to;
    return pathname === item.to || pathname.startsWith(`${item.to}/`);
}

function AppLogo(props: {
    appName: string;
    logoUrl: string | null;
    size?: number;
}) {
    const { appName, logoUrl, size = 42 } = props;

    return (
        <Avatar
            src={logoUrl ?? undefined}
            alt={appName}
            variant="rounded"
            sx={(theme) => ({
                width: size,
                height: size,
                borderRadius: 3,
                border: `1px solid ${theme.palette.divider}`,
                bgcolor: "background.paper",
                color: "text.secondary",
                fontSize: 13,
                fontWeight: 900,
                flexShrink: 0,
            })}
        >
            {appName.slice(0, 2).toUpperCase()}
        </Avatar>
    );
}

function NavActionButton(props: {
    label: string;
    active: boolean;
    onClick: () => void;
    fullWidth?: boolean;
}) {
    const { label, active, onClick, fullWidth = false } = props;

    return (
        <Button
            type="button"
            variant={active ? "contained" : "outlined"}
            color="primary"
            onClick={onClick}
            fullWidth={fullWidth}
            sx={{
                minHeight: 42,
                px: 2,
                justifyContent: fullWidth ? "flex-start" : "center",
                whiteSpace: "nowrap",
            }}
        >
            {label}
        </Button>
    );
}

export function NavBar() {
    const { t, lang, setLang } = useI18n();
    const muiTheme = useMuiTheme();
    const isDesktop = useMediaQuery(muiTheme.breakpoints.up("md"));

    const appSettings = useAppSettingsStore((state) => state.settings);
    const loadAppSettings = useAppSettingsStore((state) => state.loadAppSettings);

    const user = useAuthStore((state) => state.user);
    const accessToken = useAuthStore((state) => state.accessToken);
    const logout = useAuthStore((state) => state.logout);

    const location = useLocation();
    const navigate = useNavigate();
    const pathname = location.pathname;

    const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
    const [accountAnchorEl, setAccountAnchorEl] = React.useState<HTMLElement | null>(null);

    useThemeSyncFromAppSettings();

    React.useEffect(() => {
        void loadAppSettings();
    }, [loadAppSettings]);

    React.useEffect(() => {
        setMobileMenuOpen(false);
        setAccountAnchorEl(null);
    }, [pathname]);

    const appName =
        appSettings?.appName && appSettings.appName.trim().length > 0
            ? appSettings.appName
            : "Workout App";

    const appSubtitle =
        lang === "es" ? "Seguimiento de entrenamiento y sueño" : "Training & sleep tracker";

    const logoUrl = appSettings?.logoUrl ?? null;
    const avatarUrl = user?.profilePicUrl ?? null;
    const initials = user?.name ? getInitials(user.name) : "U";

    const isAdmin = user?.role === "admin";
    const isTrainee = user?.coachMode === "TRAINEE";
    const isTrainer = user?.coachMode === "TRAINER";

    const roleLabel = getRoleLabel({ isAdmin, isTrainer, isTrainee });

    const navItems: NavItem[] = React.useMemo(
        () => [
            { label: t("nav.home"), to: "/", end: true },
            { label: "Gym Check", to: "/gym-check", end: true },
            { label: "Cardio", to: "/cardio", end: true },
            {
                label: t("nav.routines"),
                to: "/routines",
                end: true,
                hideForTrainee: true,
            },
            { label: t("nav.movements"), to: "/movements", end: true },
            { label: "Sleep", to: "/sleep", end: true },
            { label: t("nav.days"), to: "/days", end: true },
            { label: t("nav.weeks"), to: "/weeks", end: true },
            { label: "Progreso", to: "/progress", end: true },
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
            {
                label: t("nav.insights"),
                to: "/insights",
                match: (currentPathname) =>
                    currentPathname === "/insights" || currentPathname.startsWith("/insights/"),
            },
        ],
        [t, lang]
    );

    const visibleNavItems = navItems
        .filter((item) => !item.adminOnly || isAdmin)
        .filter((item) => !item.trainerOnly || isTrainer)
        .filter((item) => !item.hideForTrainee || !isTrainee);

    React.useEffect(() => {
        document.title = appName;
    }, [appName]);

    function goTo(path: string): void {
        navigate(path);
    }

    function toggleLang(): void {
        setLang(lang === "es" ? "en" : "es");
    }

    async function onLogout(): Promise<void> {
        await logout();
        setMobileMenuOpen(false);
        setAccountAnchorEl(null);
        navigate("/login", { replace: true });
    }

    function handleAccountOpen(event: React.MouseEvent<HTMLButtonElement>): void {
        setAccountAnchorEl(event.currentTarget);
    }

    function handleAccountClose(): void {
        setAccountAnchorEl(null);
    }

    return (
        <AppBar
            position="sticky"
            elevation={0}
            color="transparent"
            sx={(theme) => ({
                top: 0,
                zIndex: theme.zIndex.appBar,
                borderBottom: `1px solid ${theme.palette.divider}`,
                bgcolor: alpha(theme.palette.background.paper, 0.88),
                backdropFilter: "blur(18px)",
            })}
        >
            <Toolbar
                disableGutters
                sx={{
                    width: "100%",
                    maxWidth: 1536,
                    mx: "auto",
                    px: { xs: 2, sm: 3, lg: 4 },
                    py: 1.25,
                    display: "block",
                }}
            >
                <Stack
                    direction="row"
                    spacing={2}
                    sx={{
                        minWidth: 0,
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    <Stack direction="row" spacing={1.5} sx={{ minWidth: 0, alignItems: "center" }}>
                        <AppLogo appName={appName} logoUrl={logoUrl} />

                        <Box sx={{ minWidth: 0 }}>
                            <Typography
                                variant="subtitle1"
                                sx={{
                                    fontWeight: 900,
                                    lineHeight: 1.1,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {appName}
                            </Typography>
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                    display: "block",
                                    maxWidth: { xs: 190, sm: 360 },
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {appSubtitle}
                            </Typography>
                        </Box>

                        <Chip
                            label={roleLabel}
                            color={isAdmin ? "primary" : "default"}
                            size="small"
                            sx={{
                                display: { xs: "none", sm: "inline-flex" },
                                fontWeight: 900,
                            }}
                        />
                    </Stack>

                    <Stack direction="row" spacing={1} sx={{ flexShrink: 0, alignItems: "center" }}>
                        {!isDesktop ? (
                            <Tooltip title={lang === "es" ? "Menú" : "Menu"}>
                                <IconButton
                                    aria-label={lang === "es" ? "Menú" : "Menu"}
                                    onClick={() => setMobileMenuOpen(true)}
                                    size="large"
                                >
                                    <MenuIcon />
                                </IconButton>
                            </Tooltip>
                        ) : null}

                        <ThemeToggle />

                        <Button
                            type="button"
                            variant="outlined"
                            onClick={toggleLang}
                            sx={{ minWidth: 58, px: 1.5 }}
                            aria-label={lang === "es" ? t("lang.english") : t("lang.spanish")}
                        >
                            {lang === "es" ? "EN" : "ES"}
                        </Button>

                        {accessToken ? (
                            <>
                                <Tooltip title={t("nav.userMenu.account")}>
                                    <IconButton
                                        type="button"
                                        onClick={handleAccountOpen}
                                        aria-label={t("nav.userMenu.account")}
                                        aria-controls={accountAnchorEl ? "workout-account-menu" : undefined}
                                        aria-haspopup="menu"
                                        aria-expanded={accountAnchorEl ? "true" : undefined}
                                        sx={{ p: 0.4 }}
                                    >
                                        <Avatar
                                            src={avatarUrl ?? undefined}
                                            alt={user?.name ?? "User"}
                                            slotProps={{
                                                img: { referrerPolicy: "no-referrer" },
                                            }}
                                            sx={{ width: 44, height: 44, fontSize: 13, fontWeight: 900 }}
                                        >
                                            {initials}
                                        </Avatar>
                                    </IconButton>
                                </Tooltip>

                                <Menu
                                    id="workout-account-menu"
                                    anchorEl={accountAnchorEl}
                                    open={Boolean(accountAnchorEl)}
                                    onClose={handleAccountClose}
                                    anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                                    transformOrigin={{ vertical: "top", horizontal: "right" }}
                                    slotProps={{ paper: { sx: { width: 240, mt: 1 } } }}
                                >
                                    <Box sx={{ px: 2, py: 1.25 }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
                                            {user?.name ?? t("nav.userMenu.account")}
                                        </Typography>
                                        {user?.email ? (
                                            <Typography variant="caption" color="text.secondary">
                                                {user.email}
                                            </Typography>
                                        ) : null}
                                    </Box>

                                    <Divider />

                                    <MenuItem onClick={() => goTo("/me")}>
                                        <ListItemIcon>
                                            <PersonIcon fontSize="small" />
                                        </ListItemIcon>
                                        <ListItemText primary={t("nav.userMenu.myProfile")} />
                                    </MenuItem>

                                    <MenuItem onClick={() => goTo("/settings")}>
                                        <ListItemIcon>
                                            <SettingsIcon fontSize="small" />
                                        </ListItemIcon>
                                        <ListItemText primary={t("nav.userMenu.settings")} />
                                    </MenuItem>

                                    <Divider />

                                    <MenuItem onClick={() => void onLogout()}>
                                        <ListItemIcon>
                                            <LogoutIcon fontSize="small" />
                                        </ListItemIcon>
                                        <ListItemText primary={t("nav.userMenu.logout")} />
                                    </MenuItem>
                                </Menu>
                            </>
                        ) : (
                            <Button type="button" variant="outlined" onClick={() => goTo("/login")}>
                                {t("auth.login")}
                            </Button>
                        )}
                    </Stack>
                </Stack>

                {isDesktop ? (
                    <Box component="nav" sx={{ mt: 1.75 }}>
                        <Stack
                            direction="row"
                            spacing={1}
                            useFlexGap
                            sx={{
                                alignItems: "center",
                                flexWrap: "wrap",
                            }}
                        >
                            {visibleNavItems.map((item) => (
                                <NavActionButton
                                    key={item.to}
                                    label={item.label}
                                    active={isNavItemActive(item, pathname)}
                                    onClick={() => goTo(item.to)}
                                />
                            ))}
                        </Stack>
                    </Box>
                ) : null}
            </Toolbar>

            <Drawer
                anchor="right"
                open={mobileMenuOpen}
                onClose={() => setMobileMenuOpen(false)}
                ModalProps={{ keepMounted: true }}
                slotProps={{
                    paper: {
                        sx: {
                            width: "min(420px, 92vw)",
                            maxWidth: "100vw",
                            borderTopLeftRadius: 24,
                            borderBottomLeftRadius: 24,
                            overflow: "hidden",
                        },
                    },
                }}
            >
                <Stack sx={{ height: "100%", minHeight: 0 }}>
                    <Stack
                        direction="row"
                        spacing={2}
                        sx={{
                            px: 2,
                            py: 2,
                            borderBottom: 1,
                            borderColor: "divider",
                            alignItems: "center",
                            justifyContent: "space-between",
                        }}
                    >
                        <Stack direction="row" spacing={1.5} sx={{ minWidth: 0, alignItems: "center" }}>
                            <AppLogo appName={appName} logoUrl={logoUrl} size={40} />
                            <Box sx={{ minWidth: 0 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 900 }} noWrap>
                                    {appName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" noWrap>
                                    {lang === "es" ? "Navegación" : "Navigation"}
                                </Typography>
                            </Box>
                        </Stack>

                        <IconButton
                            aria-label={lang === "es" ? "Cerrar menú" : "Close menu"}
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            <CloseIcon />
                        </IconButton>
                    </Stack>

                    <Box
                        sx={{
                            flex: 1,
                            minHeight: 0,
                            overflowY: "auto",
                            px: 2,
                            py: 2,
                            pb: "max(16px, env(safe-area-inset-bottom))",
                        }}
                    >
                        <Stack spacing={1.2}>
                            {visibleNavItems.map((item) => (
                                <NavActionButton
                                    key={item.to}
                                    label={item.label}
                                    active={isNavItemActive(item, pathname)}
                                    onClick={() => goTo(item.to)}
                                    fullWidth
                                />
                            ))}
                        </Stack>

                        {accessToken ? (
                            <Box sx={{ mt: 3 }}>
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{
                                        display: "block",
                                        mb: 1,
                                        fontWeight: 900,
                                        textTransform: "uppercase",
                                        letterSpacing: 0.6,
                                    }}
                                >
                                    {t("nav.userMenu.account")}
                                </Typography>

                                <Stack spacing={1.2}>
                                    <NavActionButton
                                        label={t("nav.userMenu.myProfile")}
                                        active={pathname === "/me"}
                                        onClick={() => goTo("/me")}
                                        fullWidth
                                    />
                                    <NavActionButton
                                        label={t("nav.userMenu.settings")}
                                        active={pathname === "/settings"}
                                        onClick={() => goTo("/settings")}
                                        fullWidth
                                    />
                                    <Button
                                        type="button"
                                        variant="outlined"
                                        color="error"
                                        startIcon={<LogoutIcon />}
                                        onClick={() => void onLogout()}
                                        fullWidth
                                        sx={{ justifyContent: "flex-start" }}
                                    >
                                        {t("nav.userMenu.logout")}
                                    </Button>
                                </Stack>
                            </Box>
                        ) : null}
                    </Box>
                </Stack>
            </Drawer>
        </AppBar>
    );
}

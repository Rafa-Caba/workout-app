// src/components/ThemeToggle.tsx
// Material UI preferences menu for theme mode, language, and app accent palette.

import * as React from "react";
import CheckIcon from "@mui/icons-material/Check";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LanguageIcon from "@mui/icons-material/Language";
import LightModeIcon from "@mui/icons-material/LightMode";
import PaletteIcon from "@mui/icons-material/Palette";
import SettingsIcon from "@mui/icons-material/Settings";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import { useI18n } from "@/i18n/I18nProvider";
import { PALETTES, type Mode, type Palette } from "@/theme/presets";
import { useTheme } from "@/theme/ThemeProvider";

function getModeLabel(mode: Mode): string {
    if (mode === "system") return "System";
    if (mode === "dark") return "Dark";
    return "Light";
}

function getNextMode(mode: Mode): Mode {
    if (mode === "system") return "dark";
    if (mode === "dark") return "light";
    return "system";
}

export function ThemeToggle() {
    const { mode, palette, setMode, setPalette } = useTheme();
    const { lang, setLang, t } = useI18n();
    const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);

    const isOpen = Boolean(anchorEl);

    function handleOpen(event: React.MouseEvent<HTMLButtonElement>): void {
        setAnchorEl(event.currentTarget);
    }

    function handleClose(): void {
        setAnchorEl(null);
    }

    function handleModeToggle(): void {
        setMode(getNextMode(mode));
    }

    function handleLangToggle(): void {
        setLang(lang === "es" ? "en" : "es");
    }

    function handlePaletteSelect(nextPalette: Palette): void {
        setPalette(nextPalette);
    }

    return (
        <>
            <Tooltip title="Preferencias">
                <IconButton
                    aria-label="Preferencias"
                    aria-controls={isOpen ? "workout-preferences-menu" : undefined}
                    aria-haspopup="menu"
                    aria-expanded={isOpen ? "true" : undefined}
                    onClick={handleOpen}
                    size="large"
                >
                    <SettingsIcon fontSize="small" />
                </IconButton>
            </Tooltip>

            <Menu
                id="workout-preferences-menu"
                anchorEl={anchorEl}
                open={isOpen}
                onClose={handleClose}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                slotProps={{
                    paper: {
                        sx: {
                            width: 320,
                            maxWidth: "calc(100vw - 24px)",
                            mt: 1,
                        },
                    },
                }}
            >
                <Box sx={{ px: 2, py: 1.25 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
                        Preferencias
                    </Typography>
                </Box>

                <Divider />

                <MenuItem onClick={handleModeToggle}>
                    <ListItemIcon>
                        {mode === "dark" ? (
                            <DarkModeIcon fontSize="small" />
                        ) : (
                            <LightModeIcon fontSize="small" />
                        )}
                    </ListItemIcon>
                    <ListItemText
                        primary={t("theme.toggle")}
                        secondary={getModeLabel(mode)}
                    />
                </MenuItem>

                <MenuItem onClick={handleLangToggle}>
                    <ListItemIcon>
                        <LanguageIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Idioma" secondary={lang === "es" ? "ES" : "EN"} />
                </MenuItem>

                <Divider />

                <Box sx={{ px: 2, py: 1.25 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
                        Paleta
                    </Typography>
                </Box>

                {PALETTES.map((item) => {
                    const isSelected = item.value === palette;

                    return (
                        <MenuItem
                            key={item.value}
                            selected={isSelected}
                            onClick={() => handlePaletteSelect(item.value)}
                        >
                            <ListItemIcon>
                                <PaletteIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary={item.label} />
                            {isSelected ? <CheckIcon fontSize="small" /> : null}
                        </MenuItem>
                    );
                })}
            </Menu>
        </>
    );
}

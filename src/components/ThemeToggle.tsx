import { Check, Languages, Moon, Settings, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PALETTES } from "@/theme/presets";
import { useTheme } from "@/theme/ThemeProvider";
import { useI18n } from "@/i18n/I18nProvider";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle() {
    const { mode, palette, setMode, setPalette } = useTheme();
    const { lang, setLang, t } = useI18n();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" title="Preferencias">
                    <Settings className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuLabel>Preferencias</DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem
                    onClick={() => setMode(mode === "dark" ? "light" : "dark")}
                    className="flex items-center justify-between"
                >
                    <span className="flex items-center gap-2">
                        {mode === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                        {t("theme.toggle")}
                    </span>
                    <span className="text-xs text-muted-foreground capitalize">{mode}</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                    onClick={() => setLang(lang === "es" ? "en" : "es")}
                    className="flex items-center justify-between"
                >
                    <span className="flex items-center gap-2">
                        <Languages className="h-4 w-4" />
                        Idioma
                    </span>
                    <span className="text-xs text-muted-foreground">{lang === "es" ? "ES" : "EN"}</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuLabel>Paleta</DropdownMenuLabel>

                {PALETTES.map((p) => {
                    const selected = palette === p.value;
                    return (
                        <DropdownMenuItem key={p.value} onClick={() => setPalette(p.value)} className="flex items-center justify-between">
                            <span>{p.label}</span>
                            {selected ? <Check className="h-4 w-4" /> : null}
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

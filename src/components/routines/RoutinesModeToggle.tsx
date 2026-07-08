// src/components/routines/RoutinesModeToggle.tsx
// MUI mode switch for routine form / JSON editing.

import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import type { I18nKey } from "@/i18n/translations";

type TFn = (key: I18nKey) => string;

type Props = {
    mode: "form" | "json";
    busy: boolean;
    t: TFn;
    onModeChange: (mode: "form" | "json") => void;
};

export function RoutinesModeToggle({ mode, busy, t, onModeChange }: Props) {
    return (
        <ButtonGroup variant="outlined" size="small" fullWidth sx={{ maxWidth: { sm: 320 } }}>
            <Button sx={{ px: 2.5 }} variant={mode === "form" ? "contained" : "outlined"} onClick={() => onModeChange("form")} disabled={busy}>
                {t("routines.modeForm")}
            </Button>
            <Button variant={mode === "json" ? "contained" : "outlined"} onClick={() => onModeChange("json")} disabled={busy}>
                {t("routines.modeJson")}
            </Button>
        </ButtonGroup>
    );
}

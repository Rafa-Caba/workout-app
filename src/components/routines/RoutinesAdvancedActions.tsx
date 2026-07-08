// src/components/routines/RoutinesAdvancedActions.tsx
// MUI advanced actions panel for routine init/archive operations.

import React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Collapse from "@mui/material/Collapse";
import FormControlLabel from "@mui/material/FormControlLabel";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { AppCard, AppActionRow, AppFormGrid } from "@/components/mui";
import type { I18nKey } from "@/i18n/translations";
import type { WorkoutRoutineStatus } from "@/types/workoutRoutine.types";

type TFn = (key: I18nKey) => string;

type Props = {
    openDefault: boolean;
    busy: boolean;
    t: TFn;
    lang: string;
    hasRoutine: boolean;
    routineStatus?: WorkoutRoutineStatus;
    initTitle: string;
    setInitTitle: (v: string) => void;
    initSplit: string;
    setInitSplit: (v: string) => void;
    unarchive: boolean;
    setUnarchive: (v: boolean) => void;
    onInitRoutine: () => void;
    isInitializing: boolean;
    onSetArchived: (archived: boolean) => void;
};

const SPLIT_PRESETS: Array<{ value: string; labelKey: I18nKey }> = [
    { value: "", labelKey: "routines.split.none" },
    { value: "push", labelKey: "routines.split.push" },
    { value: "pull", labelKey: "routines.split.pull" },
    { value: "legs", labelKey: "routines.split.legs" },
    { value: "upper/lower", labelKey: "routines.split.upperLower" },
    { value: "ppl", labelKey: "routines.split.ppl" },
];

export function RoutinesAdvancedActions(props: Props) {
    const {
        openDefault,
        busy,
        t,
        lang,
        hasRoutine,
        routineStatus,
        initTitle,
        setInitTitle,
        initSplit,
        setInitSplit,
        unarchive,
        setUnarchive,
        onInitRoutine,
        isInitializing,
        onSetArchived,
    } = props;

    const isArchived = routineStatus === "archived";
    const canInit = !hasRoutine || (isArchived && unarchive);
    const initDisabled = busy || !canInit;
    const initInputsDisabled = busy || (hasRoutine && !isArchived);
    const [open, setOpen] = React.useState(openDefault);

    const initLabel = (() => {
        if (isInitializing) return t("routines.initializing");
        if (!hasRoutine) return t("routines.initWeekRoutine");
        if (isArchived) return lang === "es" ? "Reactivar rutina" : "Unarchive routine";
        return lang === "es" ? "Rutina iniciada" : "Routine initialized";
    })();

    return (
        <AppCard
            title={lang === "es" ? "Acciones avanzadas" : "Advanced actions"}
            subtitle={lang === "es" ? "Inicializa, reactiva o archiva la rutina semanal." : "Initialize, unarchive, or archive the weekly routine."}
            padding="sm"
            action={<Button size="small" variant="outlined" onClick={() => setOpen((prev) => !prev)}>{open ? (lang === "es" ? "Ocultar" : "Hide") : (lang === "es" ? "Mostrar" : "Show")}</Button>}
        >
            <Collapse in={open} unmountOnExit>
                <Box sx={{ display: "grid", gap: 1.5 }}>
                    <AppFormGrid columns={{ xs: 1, md: 3 }} gap={1.5}>
                        <TextField
                            fullWidth
                            size="small"
                            label={t("routines.initTitle")}
                            value={initTitle}
                            onChange={(event) => setInitTitle(event.target.value)}
                            placeholder={t("routines.initTitlePh")}
                            disabled={initInputsDisabled}
                        />
                        <TextField
                            fullWidth
                            select
                            size="small"
                            label={t("routines.initSplit")}
                            value={initSplit}
                            onChange={(event) => setInitSplit(event.target.value)}
                            disabled={busy}
                        >
                            {SPLIT_PRESETS.map((preset) => (
                                <MenuItem key={preset.value} value={preset.value}>
                                    {t(preset.labelKey)}
                                </MenuItem>
                            ))}
                        </TextField>
                        <Box sx={{ display: "flex", alignItems: "center", minWidth: 0 }}>
                            <FormControlLabel
                                control={<Checkbox checked={unarchive} onChange={(event) => setUnarchive(event.target.checked)} disabled={busy || (!hasRoutine ? false : !isArchived)} />}
                                label={t("routines.unarchiveHint")}
                            />
                        </Box>
                    </AppFormGrid>

                    <AppActionRow align="left">
                        <Button variant="contained" onClick={onInitRoutine} disabled={initDisabled}>{initLabel}</Button>
                        <Button variant="outlined" onClick={() => onSetArchived(true)} disabled={busy || !hasRoutine || isArchived}>{t("routines.archive")}</Button>
                        <Button variant="outlined" onClick={() => onSetArchived(false)} disabled={busy || !hasRoutine || !isArchived}>{t("routines.unarchive")}</Button>
                    </AppActionRow>

                    {hasRoutine && !isArchived ? (
                        <Typography variant="body2" color="text.secondary">
                            {lang === "es" ? "Esta semana ya está inicializada. Puedes editar el plan y guardar cambios." : "This week is already initialized. You can edit the plan and save changes."}
                        </Typography>
                    ) : null}
                </Box>
            </Collapse>
        </AppCard>
    );
}

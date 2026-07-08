// src/components/routines/RoutinesWeekPickerCard.tsx
// MUI week picker and routine management panel.

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { AppActionRow, AppCard } from "@/components/mui";
import { RoutinesAdvancedActions } from "@/components/routines/RoutinesAdvancedActions";
import type { WorkoutRoutineStatus } from "@/types/workoutRoutine.types";
import type { I18nKey } from "@/i18n/translations";

type TFn = (key: I18nKey) => string;

type Props = {
    t: TFn;
    lang: string;
    busy: boolean;
    weekDate: string;
    onWeekDateChange: (next: string) => void;
    onPrevWeek: () => void;
    onNextWeek: () => void;
    onLoadWeek: () => void;
    derivedWeekKey: string;
    weekRangeLabel: string;
    runWeekKey: string;
    onSyncToLoadedWeek: () => void;
    initOpenDefault: boolean;
    initTitle: string;
    setInitTitle: (v: string) => void;
    initSplit: string;
    setInitSplit: (v: string) => void;
    unarchive: boolean;
    setUnarchive: (v: boolean) => void;
    onInitRoutine: () => void;
    isInitializing: boolean;
    onSetArchived: (archived: boolean) => void;
    hasRoutine: boolean;
    routineStatus?: WorkoutRoutineStatus;
};

export function RoutinesWeekPickerCard(props: Props) {
    const {
        t,
        lang,
        busy,
        weekDate,
        onWeekDateChange,
        onPrevWeek,
        onNextWeek,
        onLoadWeek,
        derivedWeekKey,
        weekRangeLabel,
        runWeekKey,
        onSyncToLoadedWeek,
        initOpenDefault,
        initTitle,
        setInitTitle,
        initSplit,
        setInitSplit,
        unarchive,
        setUnarchive,
        onInitRoutine,
        isInitializing,
        onSetArchived,
        hasRoutine,
        routineStatus,
    } = props;

    return (
        <AppCard
            title={lang === "es" ? "Semana de rutina" : "Routine week"}
            subtitle={lang === "es" ? "Selecciona, carga e inicializa semanas de rutina." : "Select, load, and initialize routine weeks."}
            action={<Chip size="small" color={hasRoutine ? "success" : "default"} label={hasRoutine ? (routineStatus ?? "active") : (lang === "es" ? "Sin rutina" : "No routine")} />}
        >
            <Box sx={{ display: "grid", gap: 1.5 }}>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(180px, 240px) auto" }, gap: 1.25, alignItems: "center" }}>
                    <TextField
                        fullWidth
                        size="small"
                        type="date"
                        label={t("week.pickDateInWeek")}
                        value={weekDate}
                        onChange={(event) => onWeekDateChange(event.target.value)}
                        disabled={busy}
                        slotProps={{ inputLabel: { shrink: true } }}
                    />
                    <AppActionRow align="left">
                        <Button variant="outlined" onClick={onPrevWeek} disabled={busy}>{t("week.prev")}</Button>
                        <Button variant="outlined" onClick={onNextWeek} disabled={busy}>{t("week.next")}</Button>
                        <Button variant="contained" onClick={onLoadWeek} disabled={busy}>{t("routines.useWeek")}</Button>
                    </AppActionRow>
                </Box>

                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center", border: 1, borderColor: "divider", borderRadius: 2, p: 1.25, bgcolor: "background.default" }}>
                    <Chip size="small" label={`${t("routines.selected")}: ${derivedWeekKey}`} />
                    <Chip size="small" label={`${t("week.loaded")}: ${runWeekKey}`} />
                    <Chip size="small" label={weekRangeLabel} />
                    <Button variant="text" size="small" onClick={onSyncToLoadedWeek} disabled={busy}>
                        sync
                    </Button>
                </Box>

                <RoutinesAdvancedActions
                    openDefault={initOpenDefault}
                    busy={busy}
                    t={t}
                    lang={lang}
                    initTitle={initTitle}
                    setInitTitle={setInitTitle}
                    initSplit={initSplit}
                    setInitSplit={setInitSplit}
                    unarchive={unarchive}
                    setUnarchive={setUnarchive}
                    onInitRoutine={onInitRoutine}
                    isInitializing={isInitializing}
                    onSetArchived={onSetArchived}
                    hasRoutine={hasRoutine}
                    routineStatus={routineStatus}
                />

                {!hasRoutine ? (
                    <Typography variant="body2" color="text.secondary">
                        {lang === "es" ? "Inicializa una rutina para comenzar a editar la semana." : "Initialize a routine to start editing this week."}
                    </Typography>
                ) : null}
            </Box>
        </AppCard>
    );
}

// src/components/gymCheck/GymCheckSessionMetrics.tsx
// MUI action row for saving Gym Check data and creating real sessions.

import Button from "@mui/material/Button";
import { AppActionRow } from "@/components/mui";
import type { I18nKey } from "@/i18n/translations";

export type GymCheckSessionMetricsProps = {
    t: (key: I18nKey) => string;
    lang: "es" | "en";
    busy: boolean;
    routineExists: boolean;
    doneCount: number;
    gymCheckSessionExists?: boolean;
    onSyncToLoadedWeek: () => void;
    onSaveGymCheckToDb: () => void;
    onCreateRealSession: () => void;
    onResetWeek: () => void;
};

export function GymCheckSessionMetrics(props: GymCheckSessionMetricsProps) {
    const {
        lang,
        busy,
        routineExists,
        doneCount,
        gymCheckSessionExists,
        onSyncToLoadedWeek,
        onSaveGymCheckToDb,
        onCreateRealSession,
        onResetWeek,
    } = props;

    const canCreateOrUpdate = !busy && routineExists && doneCount > 0;

    const realSessionLabel = gymCheckSessionExists === true
        ? lang === "es" ? `Actualizar sesión (${doneCount})` : `Update session (${doneCount})`
        : lang === "es" ? `Crear sesión (${doneCount})` : `Create session (${doneCount})`;

    const realSessionTitle = doneCount === 0
        ? lang === "es" ? "Marca al menos un ejercicio como Hecho" : "Mark at least one exercise as Done"
        : gymCheckSessionExists === true
            ? lang === "es" ? "Actualizar la sesión real existente (Gym Check)" : "Update existing real session (Gym Check)"
            : lang === "es" ? "Crear sesión real con ejercicios hechos" : "Create real session with done exercises";

    return (
        <AppActionRow align="right">
            <Button variant="outlined" onClick={onSyncToLoadedWeek} disabled={busy} title={lang === "es" ? "Sincronizar selector con semana cargada" : "Sync picker to loaded week"}>
                {lang === "es" ? "Sync semana" : "Sync week"}
            </Button>
            <Button variant="outlined" color="secondary" onClick={onSaveGymCheckToDb} disabled={busy || !routineExists} title={lang === "es" ? "Guardar Gym Check en la rutina (semana)" : "Save Gym Check into routine (week)"}>
                {lang === "es" ? "Guardar semana" : "Save week"}
            </Button>
            <Button variant="contained" onClick={onCreateRealSession} disabled={!canCreateOrUpdate} title={realSessionTitle}>
                {realSessionLabel}
            </Button>
            <Button variant="outlined" color="warning" onClick={onResetWeek} disabled={busy} title={lang === "es" ? "Borrar Gym Check local de la semana" : "Clear local week Gym Check"}>
                {lang === "es" ? "Reset semana" : "Reset week"}
            </Button>
        </AppActionRow>
    );
}

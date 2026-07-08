// src/components/gymCheck/GymCheckWeekPickerCard.tsx
// MUI week selector card for Gym Check pages.

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { AppCard, AppActionRow } from "@/components/mui";
import type { I18nKey } from "@/i18n/translations";

function formatNullable(value: unknown): string {
    if (value === null || value === undefined || value === "") return "—";
    return String(value);
}

type Props = {
    t: (key: I18nKey) => string;
    lang: "es" | "en";
    busy: boolean;
    weekDate: string;
    onWeekDateChange: (v: string) => void;
    onPrevWeek: () => void;
    onNextWeek: () => void;
    onUseWeek: () => void;
    derivedWeekKey: string;
    runWeekKey: string;
    weekRangeLabel: string;
    routineExists: boolean;
    routineTitle: string | null;
    routineSplit: string | null;
};

export function GymCheckWeekPickerCard(props: Props) {
    const {
        t,
        lang,
        busy,
        weekDate,
        onWeekDateChange,
        onPrevWeek,
        onNextWeek,
        onUseWeek,
        derivedWeekKey,
        runWeekKey,
        weekRangeLabel,
        routineExists,
        routineTitle,
        routineSplit,
    } = props;

    return (
        <AppCard
            title={lang === "es" ? "Semana" : "Week"}
            subtitle={lang === "es" ? "Elige semana para cargar el Gym Check." : "Pick a week to load Gym Check."}
            action={routineExists ? <Chip color="success" size="small" label={lang === "es" ? "Rutina cargada" : "Routine loaded"} /> : <Chip size="small" label={lang === "es" ? "Sin rutina" : "No routine"} />}
        >
            <Box sx={{ display: "grid", gap: { xs: 1.5, md: 2 } }}>
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", md: "minmax(180px, 240px) auto" },
                        gap: 1.25,
                        alignItems: "center",
                        minWidth: 0,
                    }}
                >
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

                    <AppActionRow align="left" sx={{ flexDirection: "row" }}>
                        <Box sx={{ display: "flex", flexDirection: "row", gap: 1.5 }}>
                            <Button sx={{ fontSize: { xs: "0.8rem", md: "1rem" } }} variant="outlined" onClick={onPrevWeek} disabled={busy}>{t("week.prev")}</Button>
                            <Button sx={{ fontSize: { xs: "0.8rem", md: "1rem" } }} variant="outlined" onClick={onNextWeek} disabled={busy}>{t("week.next")}</Button>
                        </Box>
                        <Button variant="contained" onClick={onUseWeek} disabled={busy}>{lang === "es" ? "Usar semana" : "Use week"}</Button>
                    </AppActionRow>
                </Box>

                <Box
                    sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 1,
                        border: 1,
                        borderColor: "divider",
                        borderRadius: 2,
                        p: 1.25,
                        bgcolor: "background.default",
                    }}
                >
                    <Chip sx={{ fontSize: { xs: "0.7rem", md: "1rem" } }} size="small" label={`${lang === "es" ? "Seleccionado" : "Selected"}: ${derivedWeekKey}`} />
                    <Chip sx={{ fontSize: { xs: "0.7rem", md: "1rem" } }} size="small" label={`${lang === "es" ? "Cargado" : "Loaded"}: ${runWeekKey}`} />
                    <Chip sx={{ fontSize: { xs: "0.7rem", md: "1rem" } }} size="small" label={weekRangeLabel} />
                </Box>

                {routineExists ? (
                    <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 1.25, bgcolor: "background.default" }}>
                        <Typography variant="body2" sx={{ fontWeight: 800 }}>{formatNullable(routineTitle)}</Typography>
                        <Typography variant="body2" color="text.secondary">{formatNullable(routineSplit)}</Typography>
                    </Box>
                ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 1.25 }}>
                        {lang === "es" ? "No hay rutina para esta semana. Selecciona otra semana o crea la rutina en Rutinas." : "No routine for this week. Pick another week or create it in Routines."}
                    </Typography>
                )}
            </Box>
        </AppCard>
    );
}

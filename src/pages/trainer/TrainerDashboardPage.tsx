// src/pages/trainer/TrainerDashboardPage.tsx
// MUI trainer dashboard shell. Keeps trainer state and API hooks unchanged.

import React from "react";
import { addWeeks, format } from "date-fns";
import { toast } from "sonner";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { AppCard, AppEmptyState, AppPage, AppResponsiveTabs, AppSectionHeader } from "@/components/mui";
import { useI18n } from "@/i18n/I18nProvider";
import { useTrainerTrainees } from "@/hooks/trainer/useTrainerTrainees";
import { toWeekKey, weekKeyToStartDate } from "@/utils/weekKey";
import type { PublicUser } from "@/types/auth.types";

import { TrainerAssignRoutineSection } from "@/sections/trainer/TrainerAssignRoutineSection";
import { TrainerCoachProfileCard } from "@/sections/trainer/TrainerCoachProfileCard";
import { TrainerDaySummarySection } from "@/sections/trainer/TrainerDaySummarySection";
import { TrainerRecoverySection } from "@/sections/trainer/TrainerRecoverySection";
import { TrainerWeeklySummarySection } from "@/sections/trainer/TrainerWeeklySummarySection";

type TrainerTab = "weekly" | "day" | "recovery" | "assign";

type TraineeOption = {
    id: string;
    name: string;
    subtitle: string | null;
};

function todayIso(): string {
    return format(new Date(), "yyyy-MM-dd");
}

function toTraineeOption(user: PublicUser): TraineeOption {
    return {
        id: user.id,
        name: user.name || "Usuario",
        subtitle: user.email || null,
    };
}

function readWeekStart(weekKey: string): Date {
    try {
        return weekKeyToStartDate(weekKey);
    } catch {
        return new Date();
    }
}

function getTabDescription(tab: TrainerTab, lang: string): string {
    if (tab === "weekly") {
        return lang === "es" ? "Resumen semanal del trainee seleccionado." : "Weekly summary for the selected trainee.";
    }

    if (tab === "day") {
        return lang === "es" ? "Resumen del día seleccionado." : "Selected day summary.";
    }

    if (tab === "recovery") {
        return lang === "es" ? "Recuperación, sueño y carga reciente." : "Recovery, sleep and recent load.";
    }

    return lang === "es" ? "Asignación de rutina planificada." : "Planned routine assignment.";
}

export function TrainerDashboardPage() {
    const { lang } = useI18n();

    const [tab, setTab] = React.useState<TrainerTab>("weekly");
    const [selectedTraineeId, setSelectedTraineeId] = React.useState<string>("");
    const [weekKey, setWeekKey] = React.useState<string>(() => toWeekKey(new Date()));
    const [date, setDate] = React.useState<string>(() => todayIso());

    const traineesQ = useTrainerTrainees();

    const trainees = React.useMemo<TraineeOption[]>(() => {
        return (traineesQ.data ?? []).map(toTraineeOption);
    }, [traineesQ.data]);

    const selectedTrainee = React.useMemo(() => {
        return trainees.find((trainee) => trainee.id === selectedTraineeId) ?? null;
    }, [selectedTraineeId, trainees]);

    React.useEffect(() => {
        if (!selectedTraineeId) return;

        const stillExists = trainees.some((trainee) => trainee.id === selectedTraineeId);
        if (!stillExists && traineesQ.isFetched) {
            setSelectedTraineeId("");
            toast.error(
                lang === "es"
                    ? "Tu selección ya no está disponible. Tal vez el trainee fue desasignado."
                    : "Selection is no longer available. Trainee may have been unassigned."
            );
        }
    }, [lang, selectedTraineeId, trainees, traineesQ.isFetched]);

    const weekStart = React.useMemo(() => readWeekStart(weekKey), [weekKey]);
    const weekRangeLabel = React.useMemo(() => {
        return `${format(weekStart, "yyyy-MM-dd")} → ${format(addWeeks(weekStart, 1), "yyyy-MM-dd")}`;
    }, [weekStart]);

    const traineeDropdownDisabled = traineesQ.isLoading || traineesQ.isError;
    const hasSelected = Boolean(selectedTraineeId);

    const onPrevWeek = () => setWeekKey(toWeekKey(addWeeks(weekStart, -1)));
    const onNextWeek = () => setWeekKey(toWeekKey(addWeeks(weekStart, 1)));

    return (
        <AppPage
            title={lang === "es" ? "Panel de entrenador" : "Trainer dashboard"}
            subtitle={
                lang === "es"
                    ? "Selecciona un trainee para ver su resumen semanal, día, recuperación y asignar rutina."
                    : "Select a trainee to view weekly/day summaries, recovery insights and assign routines."
            }
        >
            <AppCard>
                <Box sx={{ display: "grid", gap: { xs: 1.5, md: 2 } }}>
                    <AppSectionHeader
                        title={lang === "es" ? "Controles del entrenador" : "Trainer controls"}
                        description={getTabDescription(tab, lang)}
                        dense
                        meta={selectedTrainee ? <Chip size="small" color="primary" label={selectedTrainee.name} /> : undefined}
                    />

                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: { xs: "1fr", md: "minmax(260px, 360px) 1fr" },
                            gap: { xs: 1.5, md: 2 },
                            alignItems: "start",
                        }}
                    >
                        <Box sx={{ display: "grid", gap: 0.75 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
                                Trainee
                            </Typography>
                            <TextField
                                select
                                fullWidth
                                size="small"
                                disabled={traineeDropdownDisabled}
                                value={selectedTraineeId}
                                onChange={(event) => setSelectedTraineeId(event.target.value)}
                            >
                                <MenuItem value="">
                                    {traineesQ.isLoading
                                        ? lang === "es"
                                            ? "Cargando trainees…"
                                            : "Loading trainees…"
                                        : lang === "es"
                                            ? "Selecciona un trainee"
                                            : "Select a trainee"}
                                </MenuItem>
                                {trainees.map((trainee) => (
                                    <MenuItem key={trainee.id} value={trainee.id}>
                                        {trainee.name}{trainee.subtitle ? ` · ${trainee.subtitle}` : ""}
                                    </MenuItem>
                                ))}
                            </TextField>
                            {traineesQ.isError ? (
                                <Button variant="text" size="small" onClick={() => void traineesQ.refetch()}>
                                    {lang === "es" ? "Reintentar carga" : "Retry load"}
                                </Button>
                            ) : null}
                        </Box>

                        <Box sx={{ display: "grid", gap: { xs: 1.25, md: 1.5 } }}>
                            <AppResponsiveTabs
                                value={tab}
                                onChange={(next) => setTab(next as TrainerTab)}
                                ariaLabel={lang === "es" ? "Secciones de entrenador" : "Trainer sections"}
                                tabs={[
                                    { value: "weekly", label: lang === "es" ? "Resumen semanal" : "Weekly summary" },
                                    { value: "day", label: lang === "es" ? "Resumen del día" : "Day summary" },
                                    { value: "recovery", label: lang === "es" ? "Recuperación" : "Recovery" },
                                    { value: "assign", label: lang === "es" ? "Asignar rutina" : "Assign routine" },
                                ]}
                            />

                            <Box
                                sx={{
                                    display: "grid",
                                    gridTemplateColumns: { xs: "1fr", sm: "1fr auto" },
                                    gap: 1,
                                    alignItems: "end",
                                }}
                            >
                                <Box
                                    sx={{
                                        display: "grid",
                                        gridTemplateColumns: { xs: "1fr 1fr", sm: "auto auto" },
                                        gap: 1,
                                    }}
                                >
                                    <Button sx={{ fontSize: { xs: "0.75rem", md: "1rem" } }} variant="outlined" onClick={onPrevWeek}>
                                        ← {lang === "es" ? "Semana anterior" : "Previous week"}
                                    </Button>
                                    <Button sx={{ fontSize: { xs: "0.75rem", md: "1rem" } }} variant="outlined" onClick={onNextWeek}>
                                        {lang === "es" ? "Semana siguiente" : "Next week"} →
                                    </Button>
                                </Box>

                                <TextField
                                    size="small"
                                    type="date"
                                    label={lang === "es" ? "Día" : "Day"}
                                    value={date}
                                    onChange={(event) => setDate(event.target.value)}
                                    slotProps={{ inputLabel: { shrink: true } }}
                                    sx={{ minWidth: { xs: "100%", sm: 180 } }}
                                />
                            </Box>

                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                    flexWrap: "wrap",
                                    color: "text.secondary",
                                }}
                            >
                                <Chip sx={{ fontSize: { xs: "0.72rem", md: "1rem" } }} size="small" label={`Semana: ${weekKey}`} />
                                <Chip sx={{ fontSize: { xs: "0.72rem", md: "1rem" } }} size="small" label={weekRangeLabel} />
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </AppCard>

            {!hasSelected ? (
                <AppEmptyState
                    title={lang === "es" ? "Selecciona un trainee para comenzar" : "Select a trainee to start"}
                    description={
                        lang === "es"
                            ? "Aquí podrás ver su resumen semanal, día a día, recuperación y asignar rutina planificada."
                            : "Here you can view weekly summaries, daily details, recovery and assign planned routines."
                    }
                />
            ) : null}

            {hasSelected ? <TrainerCoachProfileCard traineeId={selectedTraineeId} /> : null}
            {hasSelected && tab === "weekly" ? <TrainerWeeklySummarySection traineeId={selectedTraineeId} weekKey={weekKey} /> : null}
            {hasSelected && tab === "day" ? <TrainerDaySummarySection traineeId={selectedTraineeId} date={date} /> : null}
            {hasSelected && tab === "recovery" ? <TrainerRecoverySection traineeId={selectedTraineeId} weekKey={weekKey} /> : null}
            {hasSelected && tab === "assign" ? (
                <TrainerAssignRoutineSection traineeId={selectedTraineeId} weekKey={weekKey} date={date} />
            ) : null}
        </AppPage>
    );
}

// src/components/dayExplorer/DayMonthCalendar.tsx
// Full responsive month calendar with WorkoutDay sleep, training and note indicators.

import * as React from "react";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import {
    addDays,
    eachDayOfInterval,
    endOfMonth,
    endOfWeek,
    format,
    isSameDay,
    isSameMonth,
    startOfMonth,
    startOfWeek,
} from "date-fns";
import { enUS, es } from "date-fns/locale";

import { AppCard } from "@/components/mui";
import type {
    CalendarDayFull,
    WorkoutDayNote,
} from "@/types/workoutDay.types";
import type { WeekStartsOn } from "@/types/settings.types";
import {
    getDayNoteTypeOption,
    getWorkoutDayNotes,
} from "@/utils/dayNotes";

type Props = {
    lang: "es" | "en";
    monthDate: Date;
    selectedDate: string;
    weekStartsOn: WeekStartsOn;
    days: readonly CalendarDayFull[];
    loading: boolean;
    onPreviousMonth: () => void;
    onNextMonth: () => void;
    onSelectDate: (date: string) => void;
    onOpenNote: (args: { date: string; note: WorkoutDayNote }) => void;
};

function capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
}

function hasSleep(day: CalendarDayFull | undefined): boolean {
    return Boolean(day?.hasSleep || day?.sleep || day?.sleepSummary);
}

function hasTraining(day: CalendarDayFull | undefined): boolean {
    if (day?.hasTraining) return true;

    if (Array.isArray(day?.training?.sessions) && day.training.sessions.length > 0) {
        return true;
    }

    return (day?.trainingSummary?.sessionsCount ?? 0) > 0;
}

export function DayMonthCalendar(props: Props) {
    const {
        lang,
        monthDate,
        selectedDate,
        weekStartsOn,
        days,
        loading,
        onPreviousMonth,
        onNextMonth,
        onSelectDate,
        onOpenNote,
    } = props;

    const locale = lang === "es" ? es : enUS;
    const today = React.useMemo(() => new Date(), []);

    const calendarStart = React.useMemo(
        () => startOfWeek(startOfMonth(monthDate), { weekStartsOn }),
        [monthDate, weekStartsOn],
    );
    const calendarEnd = React.useMemo(
        () => endOfWeek(endOfMonth(monthDate), { weekStartsOn }),
        [monthDate, weekStartsOn],
    );
    const calendarDays = React.useMemo(
        () => eachDayOfInterval({ start: calendarStart, end: calendarEnd }),
        [calendarEnd, calendarStart],
    );
    const weekDays = React.useMemo(
        () => Array.from({ length: 7 }, (_, index) => addDays(calendarStart, index)),
        [calendarStart],
    );
    const dayByDate = React.useMemo(() => {
        const map = new Map<string, CalendarDayFull>();

        for (const day of days) {
            if (day.date) map.set(day.date, day);
        }

        return map;
    }, [days]);

    return (
        <AppCard
            padding="none"
            title={capitalize(format(monthDate, "MMMM yyyy", { locale }))}
            subtitle={
                loading
                    ? lang === "es"
                        ? "Cargando calendario..."
                        : "Loading calendar..."
                    : lang === "es"
                        ? "Selecciona un día para abrir su detalle."
                        : "Select a day to open its detail."
            }
            action={
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Tooltip title={lang === "es" ? "Mes anterior" : "Previous month"}>
                        <IconButton onClick={onPreviousMonth} aria-label={lang === "es" ? "Mes anterior" : "Previous month"}>
                            <ChevronLeftIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title={lang === "es" ? "Mes siguiente" : "Next month"}>
                        <IconButton onClick={onNextMonth} aria-label={lang === "es" ? "Mes siguiente" : "Next month"}>
                            <ChevronRightIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            }
            headerSx={{ px: { xs: 1.25, sm: 2 }, pt: { xs: 1.25, sm: 2 }, mb: 1.25 }}
            contentSx={{ pb: 0 }}
            sx={{ minHeight: { xs: 480, md: 650 } }}
        >
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                    borderTop: 1,
                    borderLeft: 1,
                    borderColor: "divider",
                }}
            >
                {weekDays.map((day) => (
                    <Box
                        key={`weekday-${format(day, "yyyy-MM-dd")}`}
                        sx={{
                            px: { xs: 0.25, sm: 1 },
                            py: 1,
                            textAlign: "center",
                            borderRight: 1,
                            borderBottom: 1,
                            borderColor: "divider",
                            bgcolor: "background.default",
                        }}
                    >
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: { xs: "none", sm: "block" }, fontWeight: 850, textTransform: "uppercase" }}
                        >
                            {format(day, "EEE", { locale })}
                        </Typography>
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: { xs: "block", sm: "none" }, fontWeight: 850, textTransform: "uppercase" }}
                        >
                            {format(day, "EEEEE", { locale })}
                        </Typography>
                    </Box>
                ))}

                {calendarDays.map((calendarDate) => {
                    const dateIso = format(calendarDate, "yyyy-MM-dd");
                    const day = dayByDate.get(dateIso);
                    const notes = getWorkoutDayNotes(day?.meta);
                    const selected = selectedDate === dateIso;
                    const todayCell = isSameDay(calendarDate, today);
                    const currentMonth = isSameMonth(calendarDate, monthDate);

                    return (
                        <Box
                            key={dateIso}
                            role="button"
                            tabIndex={0}
                            aria-label={
                                lang === "es"
                                    ? `Abrir ${format(calendarDate, "d 'de' MMMM 'de' yyyy", { locale })}`
                                    : `Open ${format(calendarDate, "MMMM d, yyyy", { locale })}`
                            }
                            onClick={() => onSelectDate(dateIso)}
                            onKeyDown={(event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                    event.preventDefault();
                                    onSelectDate(dateIso);
                                }
                            }}
                            sx={(theme) => ({
                                position: "relative",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-between",
                                gap: 0.5,
                                minWidth: 0,
                                minHeight: { xs: 72, sm: 104, md: 122 },
                                p: { xs: 0.5, sm: 1 },
                                borderRight: 1,
                                borderBottom: 1,
                                borderColor: "divider",
                                cursor: "pointer",
                                opacity: currentMonth ? 1 : 0.45,
                                bgcolor: selected
                                    ? alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.2 : 0.1)
                                    : "background.paper",
                                boxShadow: todayCell
                                    ? `inset 0 0 0 2px ${alpha(theme.palette.primary.main, 0.8)}`
                                    : "none",
                                transition: "background-color 150ms ease, box-shadow 150ms ease",
                                "&:hover": {
                                    bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.16 : 0.07),
                                },
                                "&:focus-visible": {
                                    outline: `2px solid ${theme.palette.primary.main}`,
                                    outlineOffset: -2,
                                },
                            })}
                        >
                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 0.5 }}>
                                <Typography
                                    variant="body2"
                                    sx={{
                                        fontWeight: todayCell || selected ? 900 : 750,
                                        color: todayCell || selected ? "primary.main" : "text.primary",
                                    }}
                                >
                                    {format(calendarDate, "d")}
                                </Typography>
                            </Box>

                            <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: { xs: 0.1, sm: 0.35 }, minHeight: 28 }}>
                                {hasTraining(day) ? (
                                    <Tooltip title={lang === "es" ? "Entrenamiento" : "Training"}>
                                        <Typography component="span" aria-label={lang === "es" ? "Entrenamiento" : "Training"} sx={{ fontSize: { xs: 14, sm: 18 } }}>
                                            🏋️
                                        </Typography>
                                    </Tooltip>
                                ) : null}
                                {hasSleep(day) ? (
                                    <Tooltip title={lang === "es" ? "Sueño" : "Sleep"}>
                                        <Typography component="span" aria-label={lang === "es" ? "Sueño" : "Sleep"} sx={{ fontSize: { xs: 14, sm: 18 } }}>
                                            😴
                                        </Typography>
                                    </Tooltip>
                                ) : null}

                                {notes.slice(0, 3).map((note) => {
                                    const option = getDayNoteTypeOption(note.type);

                                    return (
                                        <Tooltip key={note.id} title={note.title}>
                                            <IconButton
                                                size="small"
                                                aria-label={note.title}
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    onOpenNote({ date: dateIso, note });
                                                }}
                                                sx={{
                                                    width: { xs: 22, sm: 28 },
                                                    height: { xs: 22, sm: 28 },
                                                    p: 0,
                                                    fontSize: { xs: 13, sm: 17 },
                                                }}
                                            >
                                                <span aria-hidden="true">{option.emoji}</span>
                                            </IconButton>
                                        </Tooltip>
                                    );
                                })}

                                {notes.length > 3 ? (
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
                                        +{notes.length - 3}
                                    </Typography>
                                ) : null}
                            </Box>
                        </Box>
                    );
                })}
            </Box>
        </AppCard>
    );
}

// src/pages/DayExplorerPage.tsx
// Monthly Day Explorer calendar with responsive day detail and structured notes.

import * as React from "react";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import {
    addMonths,
    endOfMonth,
    endOfWeek,
    format,
    parseISO,
    startOfMonth,
    startOfWeek,
} from "date-fns";
import { toast } from "sonner";

import { DayExplorerKpisPanel } from "@/components/dayExplorer/DayExplorerKpis";
import { DayMonthCalendar } from "@/components/dayExplorer/DayMonthCalendar";
import { DayNoteFormDialog } from "@/components/dayExplorer/DayNoteFormDialog";
import { DayNoteViewerDialog } from "@/components/dayExplorer/DayNoteViewerDialog";
import { DaySessionsPanel } from "@/components/dayExplorer/DaySessionsPanel";
import { DaySleepPanel } from "@/components/dayExplorer/DaySleepPanel";
import { DayTrainingMetaPanel } from "@/components/dayExplorer/DayTrainingMetaPanel";
import { JsonDetails } from "@/components/JsonDetails";
import {
    MediaViewerModal,
    type MediaLikeItem,
} from "@/components/media/MediaViewerModal";
import {
    AppCard,
    AppEmptyState,
    AppPage,
} from "@/components/mui";
import {
    useAddDayNote,
    useDeleteDayNote,
    useUpdateDayNote,
} from "@/hooks/useDayNotes";
import { useDaySummary } from "@/hooks/useDaySummary";
import { useWorkoutCalendar } from "@/hooks/useWorkoutCalendar";
import { useWorkoutDay } from "@/hooks/useWorkoutDay";
import { useI18n } from "@/i18n/I18nProvider";
import { useAppSettingsStore } from "@/state/appSettings.store";
import { useSettingsStore } from "@/state/settings.store";
import type {
    WorkoutDayNote,
    WorkoutDayNoteDraft,
} from "@/types/workoutDay.types";
import { buildDayExplorerKpis } from "@/utils/dayExplorer";

type ExplorerView = "month" | "day";

type OpenNoteState = {
    date: string;
    note: WorkoutDayNote;
} | null;

function todayIso(): string {
    return format(new Date(), "yyyy-MM-dd");
}

function parseSelectedDate(dateIso: string): Date | null {
    const date = new Date(`${dateIso}T00:00:00`);

    return Number.isNaN(date.getTime())
        ? null
        : date;
}

/**
 * Returns the complete localized date used on tablet and desktop.
 */
function formatSelectedDate(
    dateIso: string,
    lang: "es" | "en",
): string {
    const date = parseSelectedDate(dateIso);

    if (!date) return dateIso;

    return new Intl.DateTimeFormat(
        lang === "es" ? "es-MX" : "en-US",
        {
            dateStyle: "full",
        },
    ).format(date);
}

/**
 * Returns a compact localized date used on mobile.
 *
 * Examples:
 * - es: mié, 15 jul 2026
 * - en: Wed, Jul 15, 2026
 */
function formatSelectedDateShort(
    dateIso: string,
    lang: "es" | "en",
): string {
    const date = parseSelectedDate(dateIso);

    if (!date) return dateIso;

    return new Intl.DateTimeFormat(
        lang === "es" ? "es-MX" : "en-US",
        {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric",
        },
    ).format(date);
}

export function DayExplorerPage() {
    const { t, lang } = useI18n();

    const showJson = useAppSettingsStore(
        (state) =>
            state.settings.debug?.showJson ?? false,
    );

    const weekStartsOn = useSettingsStore(
        (state) => state.settings.weekStartsOn,
    );

    const initialDate = React.useMemo(
        () => todayIso(),
        [],
    );

    const [selectedDate, setSelectedDate] =
        React.useState<string>(initialDate);

    const [visibleMonth, setVisibleMonth] =
        React.useState<Date>(() =>
            parseISO(initialDate),
        );

    const [view, setView] =
        React.useState<ExplorerView>("month");

    const [noteFormOpen, setNoteFormOpen] =
        React.useState<boolean>(false);

    const [editingNote, setEditingNote] =
        React.useState<OpenNoteState>(null);

    const [openNote, setOpenNote] =
        React.useState<OpenNoteState>(null);

    const [openMedia, setOpenMedia] =
        React.useState<MediaLikeItem | null>(
            null,
        );

    const calendarRange = React.useMemo(() => {
        const from = startOfWeek(
            startOfMonth(visibleMonth),
            {
                weekStartsOn,
            },
        );

        const to = endOfWeek(
            endOfMonth(visibleMonth),
            {
                weekStartsOn,
            },
        );

        return {
            from: format(from, "yyyy-MM-dd"),
            to: format(to, "yyyy-MM-dd"),
        };
    }, [visibleMonth, weekStartsOn]);

    const calendar = useWorkoutCalendar({
        from: calendarRange.from,
        to: calendarRange.to,
        fields: [
            "date",
            "weekKey",
            "hasSleep",
            "hasTraining",
            "sleepSummary",
            "trainingSummary",
            "meta",
        ],
        fillMissingDays: true,
        includeRollups: false,
        includeSleep: true,
        includeTraining: true,
        includeSummaries: true,
        includeTotals: false,
        includeTypes: false,
        includeRaw: false,
    });

    const summary = useDaySummary(selectedDate);

    const day = useWorkoutDay(
        selectedDate,
        view === "day",
    );

    const addDayNote = useAddDayNote();
    const updateDayNote = useUpdateDayNote();
    const deleteDayNote = useDeleteDayNote();

    const noteFormSaving =
        addDayNote.isPending ||
        updateDayNote.isPending;

    React.useEffect(() => {
        if (calendar.isError) {
            toast.error(calendar.error.message);
        }
    }, [calendar.error, calendar.isError]);

    React.useEffect(() => {
        if (summary.isError) {
            toast.error(summary.error.message);
        }
    }, [summary.error, summary.isError]);

    React.useEffect(() => {
        if (day.isError) {
            toast.error(day.error.message);
        }
    }, [day.error, day.isError]);

    const summaryData = summary.data ?? null;
    const rawDayData = day.data ?? null;

    const kpis = React.useMemo(
        () => buildDayExplorerKpis(summaryData),
        [summaryData],
    );

    const isDayFetching =
        view === "day" &&
        (summary.isFetching || day.isFetching);

    const selectedDateShortLabel =
        formatSelectedDateShort(
            selectedDate,
            lang,
        );

    const selectedDateFullLabel =
        formatSelectedDate(selectedDate, lang);

    function handleSelectDate(
        dateIso: string,
    ): void {
        setSelectedDate(dateIso);
        setVisibleMonth(parseISO(dateIso));
        setView("day");
    }

    function handleOpenAddNote(): void {
        setEditingNote(null);
        setNoteFormOpen(true);
    }

    function handleCloseNoteForm(): void {
        if (noteFormSaving) return;

        setNoteFormOpen(false);
        setEditingNote(null);
    }

    function handleEditNote(): void {
        if (!openNote) return;

        setEditingNote(openNote);
        setOpenNote(null);
        setNoteFormOpen(true);
    }

    async function handleSaveNote(args: {
        date: string;
        draft: WorkoutDayNoteDraft;
    }): Promise<void> {
        try {
            if (editingNote) {
                await updateDayNote.mutateAsync({
                    date: editingNote.date,
                    noteId: editingNote.note.id,
                    draft: args.draft,
                });
            } else {
                await addDayNote.mutateAsync(args);
            }

            setSelectedDate(args.date);
            setVisibleMonth(parseISO(args.date));
            setNoteFormOpen(false);
            setEditingNote(null);

            toast.success(
                editingNote
                    ? lang === "es"
                        ? "Nota actualizada"
                        : "Note updated"
                    : lang === "es"
                      ? "Nota guardada"
                      : "Note saved",
            );
        } catch (error: unknown) {
            const message =
                error instanceof Error
                    ? error.message
                    : null;

            toast.error(
                message ??
                    (editingNote
                        ? lang === "es"
                            ? "No se pudo actualizar la nota"
                            : "Could not update note"
                        : lang === "es"
                          ? "No se pudo guardar la nota"
                          : "Could not save note"),
            );
        }
    }

    async function handleDeleteNote(): Promise<void> {
        if (!openNote) return;

        try {
            await deleteDayNote.mutateAsync({
                date: openNote.date,
                noteId: openNote.note.id,
            });

            setOpenNote(null);

            toast.success(
                lang === "es"
                    ? "Nota eliminada"
                    : "Note deleted",
            );
        } catch (error: unknown) {
            const message =
                error instanceof Error
                    ? error.message
                    : null;

            toast.error(
                message ??
                    (lang === "es"
                        ? "No se pudo eliminar la nota"
                        : "Could not delete note"),
            );
        }
    }

    return (
        <AppPage
            maxWidth="xl"
            title={t("pages.days.title")}
            subtitle={t("pages.days.subtitle")}
            actions={
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleOpenAddNote}
                    disabled={
                        noteFormSaving ||
                        deleteDayNote.isPending
                    }
                >
                    {lang === "es"
                        ? "Agregar nota"
                        : "Add note"}
                </Button>
            }
        >
            {view === "month" ? (
                <DayMonthCalendar
                    lang={lang}
                    monthDate={visibleMonth}
                    selectedDate={selectedDate}
                    weekStartsOn={weekStartsOn}
                    days={
                        calendar.data?.days ?? []
                    }
                    loading={calendar.isFetching}
                    onPreviousMonth={() =>
                        setVisibleMonth(
                            (current) =>
                                addMonths(current, -1),
                        )
                    }
                    onNextMonth={() =>
                        setVisibleMonth(
                            (current) =>
                                addMonths(current, 1),
                        )
                    }
                    onSelectDate={handleSelectDate}
                    onOpenNote={({ date, note }) =>
                        setOpenNote({ date, note })
                    }
                />
            ) : (
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: {
                            xs: 1.5,
                            md: 2.25,
                        },
                        minWidth: 0,
                    }}
                >
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent:
                                "space-between",
                            gap: {
                                xs: 1,
                                sm: 1.5,
                            },
                            minWidth: 0,
                        }}
                    >
                        <Button
                            variant="outlined"
                            startIcon={
                                <ArrowBackIcon />
                            }
                            onClick={() =>
                                setView("month")
                            }
                            sx={{
                                flexShrink: 0,
                                minWidth: {
                                    xs: "auto",
                                    sm: 64,
                                },
                                px: {
                                    xs: 1.25,
                                    sm: 2,
                                },
                            }}
                        >
                            <Box
                                component="span"
                                sx={{
                                    display: {
                                        xs: "inline",
                                        sm: "none",
                                    },
                                }}
                            >
                                {lang === "es"
                                    ? "Mes"
                                    : "Month"}
                            </Box>

                            <Box
                                component="span"
                                sx={{
                                    display: {
                                        xs: "none",
                                        sm: "inline",
                                    },
                                }}
                            >
                                {lang === "es"
                                    ? "Volver al mes"
                                    : "Back to month"}
                            </Box>
                        </Button>

                        <Typography
                            component="h2"
                            sx={{
                                minWidth: 0,
                                fontWeight: 850,
                                lineHeight: 1.2,
                                textAlign: "right",
                                fontSize: {
                                    xs: "0.95rem",
                                    sm: "1.15rem",
                                    md: "1.25rem",
                                },
                                overflowWrap: "anywhere",
                            }}
                        >
                            <Box
                                component="span"
                                sx={{
                                    display: {
                                        xs: "inline",
                                        sm: "none",
                                    },
                                }}
                            >
                                {
                                    selectedDateShortLabel
                                }
                            </Box>

                            <Box
                                component="span"
                                sx={{
                                    display: {
                                        xs: "none",
                                        sm: "inline",
                                    },
                                }}
                            >
                                {
                                    selectedDateFullLabel
                                }
                            </Box>
                        </Typography>
                    </Box>

                    {summary.isSuccess ? (
                        <DayExplorerKpisPanel
                            t={t}
                            kpis={kpis}
                        />
                    ) : null}

                    {day.isSuccess && rawDayData ? (
                        <Box
                            sx={{
                                display: "flex",
                                flexDirection: "column",
                                gap: {
                                    xs: 1.5,
                                    md: 2,
                                },
                                minWidth: 0,
                            }}
                        >
                            <DayTrainingMetaPanel
                                t={t}
                                training={
                                    rawDayData.training
                                }
                            />

                            <DaySleepPanel
                                t={t}
                                day={rawDayData}
                            />

                            <DaySessionsPanel
                                t={t}
                                day={rawDayData}
                                onOpenMedia={
                                    setOpenMedia
                                }
                            />
                        </Box>
                    ) : null}

                    {day.isSuccess &&
                    !rawDayData ? (
                        <AppEmptyState
                            title={
                                lang === "es"
                                    ? "Sin datos para este día"
                                    : "No data for this day"
                            }
                            description={
                                lang === "es"
                                    ? "Puedes agregar una nota o registrar sueño y entrenamiento para esta fecha."
                                    : "You can add a note or record sleep and training for this date."
                            }
                        />
                    ) : null}

                    {isDayFetching ? (
                        <Alert
                            severity="info"
                            variant="outlined"
                        >
                            {t("common.fetching")}
                        </Alert>
                    ) : null}

                    {showJson ? (
                        <AppCard
                            padding="sm"
                            tone="soft"
                        >
                            <JsonDetails
                                title={t(
                                    "days.debug.dayJsonTitle",
                                )}
                                data={{
                                    summary:
                                        summaryData,
                                    day: rawDayData,
                                }}
                            />
                        </AppCard>
                    ) : null}
                </Box>
            )}

            <DayNoteFormDialog
                open={noteFormOpen}
                lang={lang}
                initialDate={
                    editingNote?.date ??
                    selectedDate
                }
                initialNote={
                    editingNote?.note ?? null
                }
                saving={noteFormSaving}
                onClose={handleCloseNoteForm}
                onSave={handleSaveNote}
            />

            <DayNoteViewerDialog
                open={openNote !== null}
                lang={lang}
                date={openNote?.date ?? null}
                note={openNote?.note ?? null}
                deleting={deleteDayNote.isPending}
                onClose={() => setOpenNote(null)}
                onEdit={handleEditNote}
                onDelete={handleDeleteNote}
            />

            {openMedia ? (
                <MediaViewerModal
                    item={openMedia}
                    onClose={() =>
                        setOpenMedia(null)
                    }
                />
            ) : null}
        </AppPage>
    );
}

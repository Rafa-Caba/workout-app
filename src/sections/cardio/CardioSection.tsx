// src/sections/cardio/CardioSection.tsx
// MUI Cardio section.
// Keeps existing Cardio business logic while replacing visual structure with
// reusable MUI primitives, responsive filters, and polished session cards.

import React from "react";
import { format } from "date-fns";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { toast } from "sonner";

import { CardioDaySummaryCard } from "@/components/cardio/CardioDaySummaryCard";
import { CardioSessionCard } from "@/components/cardio/CardioSessionCard";
import { CardioSessionForm } from "@/components/cardio/CardioSessionForm";
import { CardioSessionModal } from "@/components/cardio/CardioSessionModal";
import { AppCard, AppEmptyState, AppSectionHeader, AppToolbar } from "@/components/mui";
import { useCardioDaySessions } from "@/hooks/useCardioDaySessions";
import {
    useCreateWorkoutSession,
    useDeleteWorkoutSession,
    usePatchWorkoutSession,
} from "@/hooks/useWorkoutSessionMutations";
import { useI18n } from "@/i18n/I18nProvider";
import {
    buildCardioCreatePayload,
    buildCardioDayStats,
    buildCardioPatchPayload,
    createEmptyCardioFormValues,
    filterCardioSessions,
    mapCardioSessionToFormValues,
} from "@/services/workout/cardio.service";
import type {
    CardioActivityFilter,
    CardioEnvironmentFilter,
    CardioFormMode,
    CardioFormValues,
} from "@/types/cardio.types";
import type { WorkoutSession } from "@/types/workoutDay.types";

function todayIso(): string {
    return format(new Date(), "yyyy-MM-dd");
}

function isCardioEnvironmentFilter(value: string): value is CardioEnvironmentFilter {
    return value === "all" || value === "indoor" || value === "outdoor";
}

function isCardioActivityFilter(value: string): value is CardioActivityFilter {
    return value === "all" || value === "walking" || value === "running";
}

export function CardioSection() {
    const { t } = useI18n();

    const [selectedDate, setSelectedDate] = React.useState<string>(todayIso());
    const [editingSession, setEditingSession] = React.useState<WorkoutSession | null>(null);
    const [modalOpen, setModalOpen] = React.useState(false);
    const [formMode, setFormMode] = React.useState<CardioFormMode>("create");
    const [environmentFilter, setEnvironmentFilter] = React.useState<CardioEnvironmentFilter>("all");
    const [activityFilter, setActivityFilter] = React.useState<CardioActivityFilter>("all");
    const [formValues, setFormValues] = React.useState<CardioFormValues>(
        createEmptyCardioFormValues()
    );

    const cardioDay = useCardioDaySessions(selectedDate);

    const createMutation = useCreateWorkoutSession({
        date: selectedDate,
        returnMode: "day",
    });

    const patchMutation = usePatchWorkoutSession({
        date: selectedDate,
        returnMode: "day",
    });

    const deleteMutation = useDeleteWorkoutSession({
        date: selectedDate,
        returnMode: "day",
    });

    const filteredSessions = React.useMemo(() => {
        return filterCardioSessions(cardioDay.sessions, environmentFilter, activityFilter);
    }, [activityFilter, cardioDay.sessions, environmentFilter]);

    const dayStats = React.useMemo(() => {
        return buildCardioDayStats(cardioDay.sessions);
    }, [cardioDay.sessions]);

    function setField<K extends keyof CardioFormValues>(
        key: K,
        value: CardioFormValues[K]
    ) {
        setFormValues((prev) => ({
            ...prev,
            [key]: value,
        }));
    }

    function resetFormState() {
        setEditingSession(null);
        setFormMode("create");
        setFormValues(createEmptyCardioFormValues());
    }

    function closeModal() {
        setModalOpen(false);
        resetFormState();
    }

    function openCreateModal() {
        setFormMode("create");
        setEditingSession(null);
        setFormValues(createEmptyCardioFormValues());
        setModalOpen(true);
    }

    function openEditModal(session: WorkoutSession) {
        setFormMode("edit");
        setEditingSession(session);
        setFormValues(mapCardioSessionToFormValues(session));
        setModalOpen(true);
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        try {
            if (formMode === "edit" && editingSession) {
                const payload = buildCardioPatchPayload(selectedDate, formValues);

                await patchMutation.mutateAsync({
                    sessionId: editingSession.id,
                    payload,
                });

                toast.success("Sesión Cardio actualizada.");
            } else {
                const payload = buildCardioCreatePayload(selectedDate, formValues);

                await createMutation.mutateAsync(payload);
                toast.success("Sesión Cardio guardada.");
            }

            closeModal();
            await cardioDay.refetch();
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "No se pudo guardar la sesión Cardio.";
            toast.error(message);
        }
    }

    async function handleDelete(session: WorkoutSession) {
        const confirmed = window.confirm(
            "¿Seguro que quieres eliminar esta sesión Cardio?"
        );

        if (!confirmed) {
            return;
        }

        try {
            await deleteMutation.mutateAsync({
                sessionId: session.id,
                deleteMedia: false,
            });

            if (editingSession?.id === session.id) {
                closeModal();
            }

            toast.success("Sesión Cardio eliminada.");
            await cardioDay.refetch();
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "No se pudo eliminar la sesión Cardio.";
            toast.error(message);
        }
    }

    const isSubmitting =
        createMutation.isPending || patchMutation.isPending || deleteMutation.isPending;

    return (
        <>
            <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 2, md: 2.5 } }}>
                <AppToolbar
                    start={
                        <>
                            <TextField
                                size="small"
                                type="date"
                                label="Fecha"
                                value={selectedDate}
                                slotProps={{ inputLabel: { shrink: true } }}
                                onChange={(event) => {
                                    const nextDate = event.target.value;
                                    setSelectedDate(nextDate);
                                    closeModal();
                                }}
                                sx={{ width: { xs: "100%", sm: 180 } }}
                            />

                            <TextField
                                select
                                size="small"
                                label="Ambiente"
                                value={environmentFilter}
                                onChange={(event) => {
                                    const next = event.target.value;
                                    setEnvironmentFilter(isCardioEnvironmentFilter(next) ? next : "all");
                                }}
                                sx={{ width: { xs: "100%", sm: 180 } }}
                            >
                                <MenuItem value="all">Todos</MenuItem>
                                <MenuItem value="outdoor">Outdoor</MenuItem>
                                <MenuItem value="indoor">Indoor</MenuItem>
                            </TextField>

                            <TextField
                                select
                                size="small"
                                label="Actividad"
                                value={activityFilter}
                                onChange={(event) => {
                                    const next = event.target.value;
                                    setActivityFilter(isCardioActivityFilter(next) ? next : "all");
                                }}
                                sx={{ width: { xs: "100%", sm: 180 } }}
                            >
                                <MenuItem value="all">Todas</MenuItem>
                                <MenuItem value="walking">Walking</MenuItem>
                                <MenuItem value="running">Running</MenuItem>
                            </TextField>
                        </>
                    }
                    end={
                        <>
                            <Chip
                                label={`Cardio del día: ${cardioDay.sessions.length}`}
                                variant="outlined"
                                color="primary"
                            />

                            {cardioDay.isFetching ? (
                                <Chip
                                    icon={<CircularProgress size={14} />}
                                    label="Actualizando..."
                                    variant="outlined"
                                />
                            ) : null}

                            <Button
                                type="button"
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={openCreateModal}
                            >
                                Nueva sesión
                            </Button>
                        </>
                    }
                />

                <CardioDaySummaryCard stats={dayStats} />

                <AppCard padding="lg">
                    <AppSectionHeader
                        title="Sesiones Cardio del día"
                        description="Aquí se muestran walking/running indoor y outdoor guardados en el WorkoutDay."
                        actions={
                            <Button
                                type="button"
                                variant="outlined"
                                startIcon={<RefreshIcon />}
                                onClick={() => void cardioDay.refetch()}
                            >
                                Refetch
                            </Button>
                        }
                        sx={{ mb: 2 }}
                    />

                    {cardioDay.isLoading ? (
                        <Alert severity="info" icon={<CircularProgress size={18} />}>
                            Cargando sesiones Cardio...
                        </Alert>
                    ) : null}

                    {cardioDay.isError ? (
                        <Alert severity="error">
                            {cardioDay.error?.message ?? "No se pudo cargar Cardio."}
                        </Alert>
                    ) : null}

                    {!cardioDay.isLoading && !cardioDay.isError && filteredSessions.length === 0 ? (
                        <AppEmptyState
                            title="Sin sesiones Cardio"
                            description="No hay walking/running indoor u outdoor para este día y filtros."
                            action={
                                <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateModal}>
                                    Crear sesión
                                </Button>
                            }
                        />
                    ) : null}

                    {filteredSessions.length > 0 ? (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            {filteredSessions.map((session) => (
                                <CardioSessionCard
                                    key={session.id}
                                    session={session}
                                    onEdit={openEditModal}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </Box>
                    ) : null}
                </AppCard>
            </Box>

            <CardioSessionModal
                open={modalOpen}
                title={formMode === "create" ? "Nueva sesión Cardio" : "Editar sesión Cardio"}
                onClose={closeModal}
            >
                <CardioSessionForm
                    t={t}
                    mode={formMode}
                    values={formValues}
                    selectedDate={selectedDate}
                    isSubmitting={isSubmitting}
                    onChange={setField}
                    onSubmit={handleSubmit}
                    onCancel={closeModal}
                />
            </CardioSessionModal>
        </>
    );
}

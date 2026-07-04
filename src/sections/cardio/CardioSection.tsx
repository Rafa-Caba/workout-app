// src/sections/cardio/CardioSection.tsx

/**
 * CardioSection
 *
 * Main section for the Web Cardio module.
 * Responsibilities:
 * - date selection
 * - indoor/outdoor + walking/running filtering
 * - modal open for create / edit
 * - delete
 * - listing Cardio sessions stored in Workou/Volumes/SSD_Externo/others/Downloads/workout-app-main/src/components/cardiotDay
 * - toast feedback using sonner
 * - lightweight daily dashboard summary
 */

import React from "react";
import { format } from "date-fns";
import { toast } from "sonner";

import { EmptyState } from "@/components/EmptyState";
import { CardioDaySummaryCard } from "@/components/cardio/CardioDaySummaryCard";
import { CardioSessionCard } from "@/components/cardio/CardioSessionCard";
import { CardioSessionForm } from "@/components/cardio/CardioSessionForm";
import { CardioSessionModal } from "@/components/cardio/CardioSessionModal";
import { Button } from "@/components/ui/button";
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
            <div className="space-y-6">
                <div className="rounded-2xl border bg-card p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <div className="space-y-1">
                                <div className="text-sm font-medium text-foreground">Fecha</div>
                                <input
                                    type="date"
                                    className="h-10 rounded-xl border bg-background px-3 text-sm"
                                    value={selectedDate}
                                    onChange={(event) => {
                                        const nextDate = event.target.value;
                                        setSelectedDate(nextDate);
                                        closeModal();
                                    }}
                                />
                            </div>

                            <div className="space-y-1">
                                <div className="text-sm font-medium text-foreground">Ambiente</div>
                                <select
                                    className="h-10 rounded-xl border bg-background px-3 text-sm"
                                    value={environmentFilter}
                                    onChange={(event) => {
                                        const next = event.target.value;
                                        setEnvironmentFilter(
                                            next === "indoor" || next === "outdoor" ? next : "all"
                                        );
                                    }}
                                >
                                    <option value="all">Todos</option>
                                    <option value="outdoor">Outdoor</option>
                                    <option value="indoor">Indoor</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <div className="text-sm font-medium text-foreground">Actividad</div>
                                <select
                                    className="h-10 rounded-xl border bg-background px-3 text-sm"
                                    value={activityFilter}
                                    onChange={(event) => {
                                        const next = event.target.value;
                                        setActivityFilter(
                                            next === "walking" || next === "running" ? next : "all"
                                        );
                                    }}
                                >
                                    <option value="all">Todas</option>
                                    <option value="walking">Walking</option>
                                    <option value="running">Running</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
                                Cardio del día: {cardioDay.sessions.length}
                            </span>

                            {cardioDay.isFetching ? (
                                <span className="rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
                                    Actualizando...
                                </span>
                            ) : null}

                            <Button type="button" variant="outline" onClick={openCreateModal}>
                                Nueva sesión
                            </Button>
                        </div>
                    </div>
                </div>

                <CardioDaySummaryCard stats={dayStats} />

                <div className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h2 className="text-base font-semibold text-foreground">
                                Sesiones Cardio del día
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Aquí se muestran walking/running indoor y outdoor guardados en el WorkoutDay.
                            </p>
                        </div>

                        <Button type="button" variant="outline" onClick={() => void cardioDay.refetch()}>
                            Refetch
                        </Button>
                    </div>

                    {cardioDay.isLoading ? (
                        <div className="rounded-2xl border bg-card p-4 text-sm text-muted-foreground">
                            Cargando sesiones Cardio...
                        </div>
                    ) : null}

                    {cardioDay.isError ? (
                        <div className="rounded-2xl border bg-card p-4 text-sm text-destructive">
                            {cardioDay.error?.message ?? "No se pudo cargar Cardio."}
                        </div>
                    ) : null}

                    {!cardioDay.isLoading &&
                        !cardioDay.isError &&
                        filteredSessions.length === 0 ? (
                        <EmptyState
                            title="Sin sesiones Cardio"
                            description="No hay walking/running indoor u outdoor para este día y filtros."
                        />
                    ) : null}

                    {filteredSessions.length > 0 ? (
                        <div className="space-y-4">
                            {filteredSessions.map((session) => (
                                <CardioSessionCard
                                    key={session.id}
                                    session={session}
                                    onEdit={openEditModal}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </div>
                    ) : null}
                </div>
            </div>

            <CardioSessionModal
                open={modalOpen}
                title={
                    formMode === "create"
                        ? "Nueva sesión Cardio"
                        : "Editar sesión Cardio"
                }
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

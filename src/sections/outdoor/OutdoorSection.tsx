// src/sections/outdoor/OutdoorSection.tsx

/**
 * OutdoorSection
 *
 * Main section for the Outdoor Web module.
 * Responsibilities:
 * - date selection
 * - modal open for create / edit
 * - delete
 * - listing outdoor sessions stored in WorkoutDay
 * - toast feedback using sonner
 * - lightweight daily dashboard summary
 */

import React from "react";
import { format } from "date-fns";
import { toast } from "sonner";

import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { OutdoorDaySummaryCard } from "@/components/outdoor/OutdoorDaySummaryCard";
import { OutdoorSessionCard } from "@/components/outdoor/OutdoorSessionCard";
import { OutdoorSessionForm } from "@/components/outdoor/OutdoorSessionForm";
import { OutdoorSessionModal } from "@/components/outdoor/OutdoorSessionModal";
import { useI18n } from "@/i18n/I18nProvider";
import { useOutdoorDaySessions } from "@/hooks/useOutdoorDaySessions";
import {
    useCreateWorkoutSession,
    useDeleteWorkoutSession,
    usePatchWorkoutSession,
} from "@/hooks/useWorkoutSessionMutations";
import {
    buildOutdoorCreatePayload,
    buildOutdoorDayStats,
    buildOutdoorPatchPayload,
    createEmptyOutdoorFormValues,
    mapOutdoorSessionToFormValues,
} from "@/services/workout/outdoor.service";
import type { OutdoorFormMode, OutdoorFormValues } from "@/types/outdoor.types";
import type { WorkoutSession } from "@/types/workoutDay.types";

function todayIso(): string {
    return format(new Date(), "yyyy-MM-dd");
}

export function OutdoorSection() {
    const { t } = useI18n();

    const [selectedDate, setSelectedDate] = React.useState<string>(todayIso());
    const [editingSession, setEditingSession] = React.useState<WorkoutSession | null>(null);
    const [modalOpen, setModalOpen] = React.useState(false);
    const [formMode, setFormMode] = React.useState<OutdoorFormMode>("create");
    const [formValues, setFormValues] = React.useState<OutdoorFormValues>(
        createEmptyOutdoorFormValues()
    );

    const outdoorDay = useOutdoorDaySessions(selectedDate);

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

    const dayStats = React.useMemo(() => {
        return buildOutdoorDayStats(outdoorDay.sessions);
    }, [outdoorDay.sessions]);

    function setField<K extends keyof OutdoorFormValues>(
        key: K,
        value: OutdoorFormValues[K]
    ) {
        setFormValues((prev) => ({
            ...prev,
            [key]: value,
        }));
    }

    function resetFormState() {
        setEditingSession(null);
        setFormMode("create");
        setFormValues(createEmptyOutdoorFormValues());
    }

    function closeModal() {
        setModalOpen(false);
        resetFormState();
    }

    function openCreateModal() {
        setFormMode("create");
        setEditingSession(null);
        setFormValues(createEmptyOutdoorFormValues());
        setModalOpen(true);
    }

    function openEditModal(session: WorkoutSession) {
        setFormMode("edit");
        setEditingSession(session);
        setFormValues(mapOutdoorSessionToFormValues(session));
        setModalOpen(true);
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        try {
            if (formMode === "edit" && editingSession) {
                const payload = buildOutdoorPatchPayload(selectedDate, formValues);

                await patchMutation.mutateAsync({
                    sessionId: editingSession.id,
                    payload,
                });

                toast.success("Sesión outdoor actualizada.");
            } else {
                const payload = buildOutdoorCreatePayload(selectedDate, formValues);

                await createMutation.mutateAsync(payload);
                toast.success("Sesión outdoor guardada.");
            }

            closeModal();
            await outdoorDay.refetch();
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "No se pudo guardar la sesión outdoor.";
            toast.error(message);
        }
    }

    async function handleDelete(session: WorkoutSession) {
        const confirmed = window.confirm(
            "¿Seguro que quieres eliminar esta sesión outdoor?"
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

            toast.success("Sesión outdoor eliminada.");
            await outdoorDay.refetch();
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "No se pudo eliminar la sesión outdoor.";
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

                        <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
                                Outdoor del día: {outdoorDay.sessions.length}
                            </span>

                            {outdoorDay.isFetching ? (
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

                <OutdoorDaySummaryCard stats={dayStats} />

                <div className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h2 className="text-base font-semibold text-foreground">
                                Sesiones outdoor del día
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Aquí solo se muestran walking/running guardados en el WorkoutDay.
                            </p>
                        </div>

                        <Button type="button" variant="outline" onClick={() => void outdoorDay.refetch()}>
                            Refetch
                        </Button>
                    </div>

                    {outdoorDay.isLoading ? (
                        <div className="rounded-2xl border bg-card p-4 text-sm text-muted-foreground">
                            Cargando sesiones outdoor...
                        </div>
                    ) : null}

                    {outdoorDay.isError ? (
                        <div className="rounded-2xl border bg-card p-4 text-sm text-destructive">
                            {outdoorDay.error?.message ?? "No se pudo cargar Outdoor."}
                        </div>
                    ) : null}

                    {!outdoorDay.isLoading &&
                        !outdoorDay.isError &&
                        outdoorDay.sessions.length === 0 ? (
                        <EmptyState
                            title="Sin sesiones outdoor"
                            description="No hay walking o running manual/importado para este día."
                        />
                    ) : null}

                    {outdoorDay.sessions.length > 0 ? (
                        <div className="space-y-4">
                            {outdoorDay.sessions.map((session) => (
                                <OutdoorSessionCard
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

            <OutdoorSessionModal
                open={modalOpen}
                title={
                    formMode === "create"
                        ? "Nueva sesión outdoor"
                        : "Editar sesión outdoor"
                }
                onClose={closeModal}
            >
                <OutdoorSessionForm
                    t={t}
                    mode={formMode}
                    values={formValues}
                    selectedDate={selectedDate}
                    isSubmitting={isSubmitting}
                    onChange={setField}
                    onSubmit={handleSubmit}
                    onCancel={closeModal}
                />
            </OutdoorSessionModal>
        </>
    );
}
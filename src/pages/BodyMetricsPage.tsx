// src/pages/BodyMetricsPage.tsx
// MUI page for body metrics history and entry management.

import * as React from "react";
import { toast } from "sonner";

import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { JsonDetails } from "@/components/JsonDetails";
import { BodyMetricFormModal } from "@/components/bodyMetrics/BodyMetricFormModal";
import { BodyMetricsEmptyState } from "@/components/bodyMetrics/BodyMetricsEmptyState";
import { BodyMetricsEntryCard } from "@/components/bodyMetrics/BodyMetricsEntryCard";
import { BodyMetricsHeroCard } from "@/components/bodyMetrics/BodyMetricsHeroCard";
import { AppCard, AppConfirmDialog, AppEmptyState, AppPage } from "@/components/mui";
import { useBodyMetrics } from "@/hooks/useBodyMetrics";
import { useDeleteBodyMetric } from "@/hooks/useDeleteBodyMetric";
import { useLatestBodyMetric } from "@/hooks/useLatestBodyMetric";
import { useUpsertBodyMetric } from "@/hooks/useUpsertBodyMetric";
import type { UserMetricEntry } from "@/types/bodyMetrics.types";

function sortEntriesDesc(entries: UserMetricEntry[]): UserMetricEntry[] {
    return [...entries].sort((a, b) => {
        if (a.date === b.date) {
            return b.updatedAt.localeCompare(a.updatedAt);
        }

        return b.date.localeCompare(a.date);
    });
}

export function BodyMetricsPage() {
    const bodyMetricsQuery = useBodyMetrics();
    const latestMetricQuery = useLatestBodyMetric();
    const upsertMutation = useUpsertBodyMetric();
    const deleteMutation = useDeleteBodyMetric();

    const [modalOpen, setModalOpen] = React.useState(false);
    const [editingEntry, setEditingEntry] = React.useState<UserMetricEntry | null>(null);
    const [entryPendingDelete, setEntryPendingDelete] = React.useState<UserMetricEntry | null>(null);

    const entries = React.useMemo(
        () => sortEntriesDesc(bodyMetricsQuery.data?.metrics ?? []),
        [bodyMetricsQuery.data?.metrics]
    );

    React.useEffect(() => {
        if (bodyMetricsQuery.isError) {
            toast.error(bodyMetricsQuery.error.message);
        }
    }, [bodyMetricsQuery.isError, bodyMetricsQuery.error]);

    React.useEffect(() => {
        if (latestMetricQuery.isError) {
            toast.error(latestMetricQuery.error.message);
        }
    }, [latestMetricQuery.isError, latestMetricQuery.error]);

    const openCreate = React.useCallback(() => {
        setEditingEntry(null);
        setModalOpen(true);
    }, []);

    const openEdit = React.useCallback((entry: UserMetricEntry) => {
        setEditingEntry(entry);
        setModalOpen(true);
    }, []);

    const handleConfirmDelete = React.useCallback(async () => {
        if (!entryPendingDelete) return;

        try {
            await deleteMutation.mutateAsync({ date: entryPendingDelete.date });
            toast.success("Registro corporal eliminado");
            setEntryPendingDelete(null);
        } catch (error) {
            const message = error instanceof Error ? error.message : "No se pudo eliminar el registro";
            toast.error(message);
        }
    }, [deleteMutation, entryPendingDelete]);

    const handleSave = React.useCallback(
        async ({
            date,
            payload,
        }: {
            date: string;
            payload: {
                weightKg?: number | null;
                bodyFatPct?: number | null;
                waistCm?: number | null;
                notes?: string | null;
                source?: "manual" | "profile" | "device" | "import" | "coach";
            };
        }) => {
            try {
                await upsertMutation.mutateAsync({ date, payload });
                setModalOpen(false);
                setEditingEntry(null);
                toast.success(editingEntry ? "Registro corporal actualizado" : "Registro corporal guardado");
            } catch (error) {
                const message = error instanceof Error ? error.message : "No se pudo guardar el registro";
                toast.error(message);
            }
        },
        [editingEntry, upsertMutation]
    );

    return (
        <AppPage
            title="Métricas corporales"
            subtitle="Registra peso, cintura y composición corporal para enriquecer tu progreso."
            actions={<Button variant="contained" onClick={openCreate}>Nuevo registro</Button>}
        >
            <BodyMetricsHeroCard latest={latestMetricQuery.data?.latest ?? null} onCreate={openCreate} />

            {bodyMetricsQuery.isFetching ? (
                <AppCard padding="sm">
                    <Typography variant="body2" color="text.secondary">
                        Cargando métricas corporales...
                    </Typography>
                </AppCard>
            ) : null}

            {bodyMetricsQuery.isError ? (
                <AppEmptyState title="No se pudo cargar tu historial corporal" description="Intenta nuevamente." />
            ) : null}

            {!bodyMetricsQuery.isLoading && !bodyMetricsQuery.isError && entries.length === 0 ? (
                <BodyMetricsEmptyState onCreate={openCreate} />
            ) : null}

            {entries.length > 0 ? (
                <AppCard
                    title="Historial"
                    subtitle={`${entries.length} registro(s) guardado(s)`}
                    action={<Button variant="outlined" onClick={openCreate}>Nuevo</Button>}
                >
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
                        {entries.map((entry) => (
                            <BodyMetricsEntryCard
                                key={entry.id}
                                entry={entry}
                                onEdit={() => openEdit(entry)}
                                onDelete={() => setEntryPendingDelete(entry)}
                            />
                        ))}
                    </Box>
                </AppCard>
            ) : null}

            <JsonDetails
                title="JSON body metrics"
                data={{
                    latest: latestMetricQuery.data?.latest ?? null,
                    list: bodyMetricsQuery.data?.metrics ?? [],
                }}
                defaultOpen={false}
            />

            <BodyMetricFormModal
                open={modalOpen}
                initialEntry={editingEntry}
                saving={upsertMutation.isPending}
                onClose={() => {
                    if (upsertMutation.isPending) return;
                    setModalOpen(false);
                    setEditingEntry(null);
                }}
                onSave={handleSave}
            />

            <AppConfirmDialog
                open={Boolean(entryPendingDelete)}
                title="Eliminar registro corporal"
                description={
                    entryPendingDelete
                        ? `¿Deseas eliminar el registro del ${entryPendingDelete.date}?`
                        : undefined
                }
                confirmLabel="Eliminar"
                tone="danger"
                loading={deleteMutation.isPending}
                onConfirm={() => void handleConfirmDelete()}
                onCancel={() => setEntryPendingDelete(null)}
            />
        </AppPage>
    );
}

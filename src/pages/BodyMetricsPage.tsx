// src/pages/BodyMetricsPage.tsx

import * as React from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { JsonDetails } from "@/components/JsonDetails";
import { BodyMetricFormModal } from "@/components/bodyMetrics/BodyMetricFormModal";
import { BodyMetricsEmptyState } from "@/components/bodyMetrics/BodyMetricsEmptyState";
import { BodyMetricsEntryCard } from "@/components/bodyMetrics/BodyMetricsEntryCard";
import { BodyMetricsHeroCard } from "@/components/bodyMetrics/BodyMetricsHeroCard";
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

    const handleDelete = React.useCallback(
        async (entry: UserMetricEntry) => {
            const confirmed = window.confirm(`¿Deseas eliminar el registro del ${entry.date}?`);
            if (!confirmed) return;

            try {
                await deleteMutation.mutateAsync({ date: entry.date });
                toast.success("Registro corporal eliminado");
            } catch (error) {
                const message =
                    error instanceof Error ? error.message : "No se pudo eliminar el registro";
                toast.error(message);
            }
        },
        [deleteMutation]
    );

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
                await upsertMutation.mutateAsync({
                    date,
                    payload,
                });

                setModalOpen(false);
                setEditingEntry(null);
                toast.success(editingEntry ? "Registro corporal actualizado" : "Registro corporal guardado");
            } catch (error) {
                const message =
                    error instanceof Error ? error.message : "No se pudo guardar el registro";
                toast.error(message);
            }
        },
        [editingEntry, upsertMutation]
    );

    return (
        <div className="space-y-6">
            <PageHeader
                title="Métricas corporales"
                subtitle="Registra peso, cintura y composición corporal para enriquecer tu progreso."
                right={
                    <Button onClick={openCreate}>
                        Nuevo registro
                    </Button>
                }
            />

            <BodyMetricsHeroCard
                latest={latestMetricQuery.data?.latest ?? null}
                onCreate={openCreate}
            />

            {bodyMetricsQuery.isFetching ? (
                <div className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
                    Cargando métricas corporales...
                </div>
            ) : null}

            {bodyMetricsQuery.isError ? (
                <EmptyState
                    title="No se pudo cargar tu historial corporal"
                    description="Intenta nuevamente."
                />
            ) : null}

            {!bodyMetricsQuery.isLoading && !bodyMetricsQuery.isError && entries.length === 0 ? (
                <BodyMetricsEmptyState onCreate={openCreate} />
            ) : null}

            {entries.length > 0 ? (
                <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <div className="text-lg font-semibold">Historial</div>
                            <div className="text-sm text-muted-foreground">
                                {entries.length} registro(s) guardado(s)
                            </div>
                        </div>

                        <Button variant="outline" onClick={openCreate}>
                            Nuevo
                        </Button>
                    </div>

                    {entries.map((entry) => (
                        <BodyMetricsEntryCard
                            key={entry.id}
                            entry={entry}
                            onEdit={() => openEdit(entry)}
                            onDelete={() => void handleDelete(entry)}
                        />
                    ))}
                </div>
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
        </div>
    );
}
import React from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/I18nProvider";

import type { ApiError } from "@/api/httpErrors";
import type { Movement, MovementsListQuery } from "@/types/movements.types";

import {
    useMovements,
    useCreateMovement,
    useUpdateMovement,
} from "@/hooks/useMovements";

import { MediaViewerModal, type MediaLikeItem } from "@/components/media/MediaViewerModal";
import { MediaCard } from "@/components/media/MediaCard";

import {
    MuscleGroupDropdown,
    EquipmentDropdown,
    type MuscleGroupKey,
    type EquipmentKey,
} from "@/components/ui/domain-dropdowns";
import { MuscleGroupSelect } from "@/components/MuscleGroupSelect";
import { EquipmentSelect } from "@/components/EquipmentSelect";

// -------------------- Helpers --------------------

function toastApiError(e: unknown, fallback: string) {
    const err = e as Partial<ApiError> | undefined;
    const msg = err?.message ?? fallback;
    const details = err?.details ? JSON.stringify(err.details, null, 2) : undefined;
    toast.error(msg, { description: details });
}

function cleanStrOrNull(v: unknown): string | null {
    const s = String(v ?? "").trim();
    return s.length ? s : null;
}

function sortMovements(list: Movement[]) {
    // activos primero, luego por nombre
    return [...list].sort((a, b) => {
        if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
        return a.name.localeCompare(b.name, "es", { sensitivity: "base" });
    });
}

type FormState = {
    name: string;
    muscleGroup: string;
    equipment: string;
    isActive: boolean;
};

function movementToForm(m: Movement): FormState {
    return {
        name: m.name ?? "",
        muscleGroup: m.muscleGroup ?? "",
        equipment: m.equipment ?? "",
        isActive: Boolean(m.isActive),
    };
}

// Map Movement.media -> MediaLikeItem para el viewer
function movementToMediaItem(m: Movement): MediaLikeItem | null {
    if (!m.media) return null;

    const media = m.media;

    return {
        url: media.url,
        publicId: media.publicId,
        resourceType: media.resourceType ?? null, // "image" | "video" | null
        format: media.format ?? null,
        createdAt: media.createdAt ?? null,
        date: media.createdAt ?? null,
        sessionType: "Movement Media",
        source: "movement",
        meta: media.meta ?? null,
        originalName: media.originalName ?? m.name ?? null,
    };
}

// Hook sencillo de preview para un solo archivo
function useSingleFilePreview(file: File | null) {
    const [url, setUrl] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (!file) {
            setUrl((prev) => {
                if (prev) URL.revokeObjectURL(prev);
                return null;
            });
            return;
        }

        const nextUrl = URL.createObjectURL(file);
        setUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return nextUrl;
        });

        return () => {
            URL.revokeObjectURL(nextUrl);
        };
    }, [file]);

    return url;
}

function isImageFile(file: File | null) {
    return !!file?.type?.startsWith("image/");
}

// -------------------- Page --------------------

export function MovementsPage() {
    const { t, lang } = useI18n();

    // filtros (query)
    const [activeOnly, setActiveOnly] = React.useState<boolean>(true);
    const [q, setQ] = React.useState<string>("");

    // create form
    const [createForm, setCreateForm] = React.useState<FormState>({
        name: "",
        muscleGroup: "",
        equipment: "",
        isActive: true,
    });
    const [createImageFile, setCreateImageFile] = React.useState<File | null>(null);
    const createImagePreview = useSingleFilePreview(createImageFile);
    const createImageInputRef = React.useRef<HTMLInputElement | null>(null);

    // edit form
    const [editingId, setEditingId] = React.useState<string | null>(null);
    const [editForm, setEditForm] = React.useState<FormState>({
        name: "",
        muscleGroup: "",
        equipment: "",
        isActive: true,
    });
    const [editImageFile, setEditImageFile] = React.useState<File | null>(null);
    const editImagePreview = useSingleFilePreview(editImageFile);
    const editImageInputRef = React.useRef<HTMLInputElement | null>(null);

    // viewer modal state
    const [selectedMedia, setSelectedMedia] = React.useState<MediaLikeItem | null>(null);

    // Normalizamos filtros para pasarlos al hook
    const movementsQuery: MovementsListQuery = React.useMemo(() => {
        const params: MovementsListQuery = {};
        if (activeOnly) params.activeOnly = true;
        const needle = q.trim();
        if (needle) params.q = needle;
        return params;
    }, [activeOnly, q]);

    // -------------------- Hooks reales --------------------

    const listQuery = useMovements(movementsQuery);
    const createMovementMutation = useCreateMovement(movementsQuery);
    const updateMovementMutation = useUpdateMovement(movementsQuery);
    const toggleActiveMutation = useUpdateMovement(movementsQuery);

    const busy =
        listQuery.isFetching ||
        createMovementMutation.isPending ||
        updateMovementMutation.isPending ||
        toggleActiveMutation.isPending;

    const movements = sortMovements(listQuery.data ?? []);
    const empty = !listQuery.isFetching && movements.length === 0;

    // -------------------- Handlers --------------------

    function startEdit(m: Movement) {
        setEditingId(m.id);
        setEditForm(movementToForm(m));
        setEditImageFile(null); // al entrar a editar, reseteamos imagen pendiente
    }

    function cancelEdit() {
        setEditingId(null);
        setEditForm({ name: "", muscleGroup: "", equipment: "", isActive: true });
        setEditImageFile(null);
    }

    async function onCreate() {
        const name = createForm.name.trim();
        if (!name) {
            toast.error(lang === "es" ? "Escribe un nombre" : "Enter a name");
            return;
        }

        const formData = new FormData();
        formData.append("name", name);

        const mg = cleanStrOrNull(createForm.muscleGroup);
        if (mg !== null) formData.append("muscleGroup", mg);

        const eq = cleanStrOrNull(createForm.equipment);
        if (eq !== null) formData.append("equipment", eq);

        formData.append("isActive", String(createForm.isActive));

        if (createImageFile) {
            formData.append("media", createImageFile);
        }

        try {
            await createMovementMutation.mutateAsync(formData);
            toast.success(lang === "es" ? "Movimiento creado" : "Movement created");

            setCreateForm({ name: "", muscleGroup: "", equipment: "", isActive: true });
            setCreateImageFile(null);
        } catch (e) {
            toastApiError(e, lang === "es" ? "No se pudo crear" : "Failed to create");
        }
    }

    async function onSaveEdit() {
        if (!editingId) return;

        const name = editForm.name.trim();
        if (!name) {
            toast.error(lang === "es" ? "El nombre no puede ir vacío" : "Name cannot be empty");
            return;
        }

        const formData = new FormData();
        formData.append("name", name);

        const mg = cleanStrOrNull(editForm.muscleGroup);
        if (mg !== null) formData.append("muscleGroup", mg);

        const eq = cleanStrOrNull(editForm.equipment);
        if (eq !== null) formData.append("equipment", eq);

        formData.append("isActive", String(editForm.isActive));

        if (editImageFile) {
            formData.append("media", editImageFile);
        }

        try {
            await updateMovementMutation.mutateAsync({ id: editingId, formData });
            toast.success(lang === "es" ? "Movimiento actualizado" : "Movement updated");
            setEditingId(null);
            setEditForm({ name: "", muscleGroup: "", equipment: "", isActive: true });
            setEditImageFile(null);
        } catch (e) {
            toastApiError(e, lang === "es" ? "No se pudo actualizar" : "Failed to update");
        }
    }

    function onToggleActive(m: Movement) {
        const nextActive = !m.isActive;

        const formData = new FormData();
        formData.append("isActive", String(nextActive));

        toggleActiveMutation.mutate(
            {
                id: m.id,
                formData,
            },
            {
                onSuccess: () => {
                    toast.success(
                        lang === "es"
                            ? nextActive
                                ? "Movimiento activado"
                                : "Movimiento desactivado"
                            : nextActive
                                ? "Movement activated"
                                : "Movement deactivated"
                    );
                },
                onError: (e) => {
                    toastApiError(
                        e,
                        lang === "es"
                            ? "No se pudo cambiar estatus"
                            : "Failed to change status"
                    );
                },
            }
        );
    }

    function onCreateImageChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0] ?? null;
        setCreateImageFile(file);
        e.currentTarget.value = "";
    }

    function onEditImageChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0] ?? null;
        setEditImageFile(file);
        e.currentTarget.value = "";
    }

    // -------------------- Render --------------------

    return (
        <div className="space-y-6">
            <PageHeader
                title={lang === "es" ? "Movimientos" : "Movements"}
                subtitle={
                    lang === "es"
                        ? "Catálogo para el selector de ejercicios en rutinas."
                        : "Catalog for the routines exercise selector."
                }
                right={
                    <div className="flex w-full sm:w-auto items-center gap-2">
                        <label className="w-full sm:w-auto inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm bg-background">
                            <input
                                type="checkbox"
                                checked={activeOnly}
                                onChange={(e) => setActiveOnly(e.target.checked)}
                                disabled={busy}
                            />
                            <span className="whitespace-nowrap">{lang === "es" ? "Solo activos" : "Active only"}</span>
                        </label>
                    </div>
                }
            />

            <div className="rounded-xl border bg-card p-3 sm:p-4 space-y-3">
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="md:col-span-1">
                        <label className="text-xs font-medium">
                            {lang === "es" ? "Buscar" : "Search"}
                        </label>
                        <input
                            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            disabled={busy}
                            placeholder={lang === "es" ? "Nombre..." : "Name..."}
                        />
                    </div>

                    <div className="md:col-span-2 space-y-3">
                        <div>
                            <label className="text-xs font-medium">
                                {lang === "es" ? "Nuevo movimiento" : "New movement"}
                            </label>

                            <div className="mt-2 grid gap-2 sm:grid-cols-2 md:grid-cols-4">
                                <div className="flex flex-col sm:col-span-2 md:col-span-2 justify-between">
                                    <span className="text-xs font-medium">
                                        {lang == "es" ? "Nombre" : "Name"}
                                    </span>
                                    <input
                                        className="rounded-md border bg-background px-3 py-2 text-sm"
                                        value={createForm.name}
                                        onChange={(e) =>
                                            setCreateForm((p) => ({ ...p, name: e.target.value }))
                                        }
                                        disabled={busy}
                                        placeholder={
                                            lang === "es"
                                                ? "Nombre (requerido)"
                                                : "Name (required)"
                                        }
                                    />
                                </div>

                                <MuscleGroupSelect
                                    t={t}
                                    value={createForm.muscleGroup ? createForm.muscleGroup : null}
                                    onChange={(v) => setCreateForm((p) => ({ ...p, muscleGroup: v ?? "" }))}
                                />

                                <EquipmentSelect
                                    t={t}
                                    value={createForm.equipment ? createForm.equipment : null}
                                    onChange={(v) => setCreateForm((p) => ({ ...p, equipment: v ?? "" }))}
                                />
                            </div>
                        </div>

                        {/* Campo de imagen (Create) */}
                        <div className="grid gap-2 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
                            <div className="flex flex-wrap items-center gap-2">
                                <input
                                    ref={createImageInputRef}
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={onCreateImageChange}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="h-8"
                                    onClick={() => createImageInputRef.current?.click()}
                                    disabled={busy}
                                >
                                    {lang === "es" ? "Elegir imagen" : "Choose image"}
                                </Button>
                                {createImageFile ? (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="h-8"
                                        onClick={() => setCreateImageFile(null)}
                                        disabled={busy}
                                    >
                                        {lang === "es" ? "Quitar imagen" : "Remove image"}
                                    </Button>
                                ) : null}
                            </div>

                            {createImagePreview && isImageFile(createImageFile) ? (
                                <div className="flex items-center gap-2">
                                    <div className="text-xs text-muted-foreground">
                                        {lang === "es" ? "Vista previa" : "Preview"}
                                    </div>
                                    <img
                                        src={createImagePreview}
                                        alt="Movimiento"
                                        className="h-16 w-16 rounded-md border object-cover"
                                    />
                                </div>
                            ) : null}
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <label className="inline-flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={createForm.isActive}
                                    onChange={(e) =>
                                        setCreateForm((p) => ({
                                            ...p,
                                            isActive: e.target.checked,
                                        }))
                                    }
                                    disabled={busy}
                                />
                                <span>{lang === "es" ? "Activo" : "Active"}</span>
                            </label>

                            <Button className="h-9 w-full sm:w-auto" onClick={onCreate} disabled={busy}>
                                {lang === "es" ? "Crear" : "Create"}
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="text-xs text-muted-foreground">
                    {listQuery.isFetching
                        ? lang === "es"
                            ? "Cargando movimientos..."
                            : "Loading movements..."
                        : lang === "es"
                            ? `Mostrando ${movements.length}`
                            : `Showing ${movements.length}`}
                </div>
            </div>

            {empty ? (
                <EmptyState
                    title={lang === "es" ? "No hay movimientos" : "No movements"}
                    description={
                        lang === "es"
                            ? "Crea tu primer movimiento para usarlo en rutinas."
                            : "Create your first movement."
                    }
                />
            ) : null}

            {!empty ? (
                <div className="rounded-xl border bg-card p-2 border-primary/40">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {movements.map((m) => {
                            const isEditing = editingId === m.id;
                            const mediaItem = movementToMediaItem(m);

                            return (
                                <div
                                    key={m.id}
                                    className="p-3 flex flex-col gap-3 border rounded-2xl border-primary/40"
                                >
                                    <div className="min-w-0">
                                        {isEditing ? (
                                            <div className="space-y-3">
                                                <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                                                    {/* Columna izquierda: imagen + botones */}
                                                    <div className="flex flex-row sm:flex-col items-start gap-3">
                                                        <div className="shrink-0">
                                                            {editImagePreview && isImageFile(editImageFile) ? (
                                                                <img
                                                                    src={editImagePreview}
                                                                    alt="Movimiento"
                                                                    className="h-16 w-16 rounded-md border object-cover"
                                                                />
                                                            ) : mediaItem ? (
                                                                <MediaCard
                                                                    item={mediaItem}
                                                                    onOpen={(it) => setSelectedMedia(it)}
                                                                    showMetaInfo={false}
                                                                    showTitle={false}
                                                                    className="w-16"
                                                                />
                                                            ) : null}
                                                        </div>

                                                        <div className="flex flex-col gap-2">
                                                            <input
                                                                ref={editImageInputRef}
                                                                type="file"
                                                                className="hidden"
                                                                accept="image/*"
                                                                onChange={onEditImageChange}
                                                            />
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                className="h-8"
                                                                onClick={() => editImageInputRef.current?.click()}
                                                                disabled={busy}
                                                            >
                                                                {lang === "es" ? "Elegir imagen" : "Choose image"}
                                                            </Button>
                                                            {editImageFile ? (
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    className="h-8"
                                                                    onClick={() => setEditImageFile(null)}
                                                                    disabled={busy}
                                                                >
                                                                    {lang === "es" ? "Quitar imagen" : "Remove image"}
                                                                </Button>
                                                            ) : null}
                                                        </div>
                                                    </div>

                                                    {/* Columna derecha: inputs */}
                                                    <div className="flex-1 min-w-0 space-y-2">
                                                        <div className="grid gap-2 md:grid-cols-3">
                                                            <input
                                                                className="rounded-md border bg-background px-3 py-2 text-sm md:col-span-2"
                                                                value={editForm.name}
                                                                onChange={(e) =>
                                                                    setEditForm((p) => ({
                                                                        ...p,
                                                                        name: e.target.value,
                                                                    }))
                                                                }
                                                                disabled={busy}
                                                                placeholder={lang === "es" ? "Nombre" : "Name"}
                                                            />
                                                            <label className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm bg-background">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={editForm.isActive}
                                                                    onChange={(e) =>
                                                                        setEditForm((p) => ({
                                                                            ...p,
                                                                            isActive: e.target.checked,
                                                                        }))
                                                                    }
                                                                    disabled={busy}
                                                                />
                                                                <span className="whitespace-nowrap">
                                                                    {lang === "es" ? "Activo" : "Active"}
                                                                </span>
                                                            </label>
                                                        </div>

                                                        <div className="grid gap-2 md:grid-cols-2">
                                                            <MuscleGroupSelect
                                                                t={t}
                                                                value={editForm.muscleGroup ? editForm.muscleGroup : null}
                                                                onChange={(v) => setEditForm((p) => ({ ...p, muscleGroup: v ?? "" }))}
                                                            />

                                                            <EquipmentSelect
                                                                t={t}
                                                                value={editForm.equipment ? editForm.equipment : null}
                                                                onChange={(v) => setEditForm((p) => ({ ...p, equipment: v ?? "" }))}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col sm:flex-row gap-2">
                                                    <Button
                                                        className="h-9 w-full sm:w-auto"
                                                        onClick={onSaveEdit}
                                                        disabled={busy}
                                                    >
                                                        {lang === "es" ? "Guardar" : "Save"}
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        className="h-9 w-full sm:w-auto"
                                                        onClick={cancelEdit}
                                                        disabled={busy}
                                                    >
                                                        {lang === "es" ? "Cancelar" : "Cancel"}
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-row items-start gap-3">
                                                {/* Media thumbnail en modo lectura */}
                                                {mediaItem ? (
                                                    <MediaCard
                                                        item={mediaItem}
                                                        onOpen={(it) => setSelectedMedia(it)}
                                                        showMetaInfo={false}
                                                        showTitle={false}
                                                        className="w-16 shrink-0"
                                                    />
                                                ) : null}

                                                <div className="min-w-0">
                                                    <div className="text-sm font-semibold truncate">
                                                        {m.name}{" "}
                                                        {!m.isActive ? (
                                                            <span className="ml-2 inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] opacity-70">
                                                                {lang === "es" ? "Inactivo" : "Inactive"}
                                                            </span>
                                                        ) : null}
                                                    </div>

                                                    <div className="text-xs text-muted-foreground wrap-break-words">
                                                        {(m.muscleGroup ?? "").trim()
                                                            ? `${lang === "es" ? "Músculo" : "Muscle"}: ${m.muscleGroup}`
                                                            : lang === "es"
                                                                ? "Músculo: —"
                                                                : "Muscle: —"}
                                                        {" • "}
                                                        {(m.equipment ?? "").trim()
                                                            ? `${lang === "es" ? "Equipo" : "Equipment"}: ${m.equipment}`
                                                            : lang === "es"
                                                                ? "Equipo: —"
                                                                : "Equipment: —"}
                                                    </div>

                                                    <div className="text-[11px] text-muted-foreground font-mono truncate">
                                                        {m.id}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {!isEditing ? (
                                        <div className="flex flex-col sm:flex-row sm:justify-end flex-wrap gap-2">
                                            <Button
                                                variant="outline"
                                                className="h-9 w-full sm:w-auto"
                                                onClick={() => startEdit(m)}
                                                disabled={busy}
                                            >
                                                {lang === "es" ? "Editar" : "Edit"}
                                            </Button>

                                            <Button
                                                variant="outline"
                                                className="h-9 w-full sm:w-auto"
                                                onClick={() => onToggleActive(m)}
                                                disabled={busy}
                                            >
                                                {lang === "es"
                                                    ? m.isActive
                                                        ? "Desactivar"
                                                        : "Activar"
                                                    : m.isActive
                                                        ? "Deactivate"
                                                        : "Activate"}
                                            </Button>
                                        </div>
                                    ) : null}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : null}

            {selectedMedia ? (
                <MediaViewerModal
                    item={selectedMedia}
                    onClose={() => setSelectedMedia(null)}
                />
            ) : null}
        </div>
    );
}
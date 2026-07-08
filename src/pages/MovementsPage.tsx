// src/pages/MovementsPage.tsx
// MUI movements catalog page. Keeps existing hooks/services/contracts and migrates only visible UI.

import React from "react";
import { toast } from "sonner";

import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { MediaCard } from "@/components/media/MediaCard";
import { MediaViewerModal, type MediaLikeItem } from "@/components/media/MediaViewerModal";
import { AppActionRow, AppCard, AppEmptyState, AppPage } from "@/components/mui";
import type { ApiError } from "@/api/httpErrors";
import { useI18n } from "@/i18n/I18nProvider";
import { useCreateMovement, useMovements, useUpdateMovement } from "@/hooks/useMovements";
import type { Movement, MovementsListQuery } from "@/types/movements.types";

function toastApiError(errorValue: unknown, fallback: string) {
    const error = errorValue as Partial<ApiError> | undefined;
    const message = error?.message ?? fallback;
    const details = error?.details ? JSON.stringify(error.details, null, 2) : undefined;
    toast.error(message, { description: details });
}

function normalizeUniqueStrings(values: string[]): string[] {
    const normalizedValues = values.map((value) => String(value ?? "").trim()).filter((value) => value.length > 0);
    return Array.from(new Set(normalizedValues));
}

function sortMovements(list: Movement[]) {
    return [...list].sort((a, b) => {
        if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
        return a.name.localeCompare(b.name, "es", { sensitivity: "base" });
    });
}

type FormState = {
    name: string;
    muscleGroup: string[];
    equipment: string[];
    isActive: boolean;
};

function movementToForm(movement: Movement): FormState {
    return {
        name: movement.name ?? "",
        muscleGroup: Array.isArray(movement.muscleGroup) ? movement.muscleGroup : [],
        equipment: Array.isArray(movement.equipment) ? movement.equipment : [],
        isActive: Boolean(movement.isActive),
    };
}

function movementToMediaItem(movement: Movement): MediaLikeItem | null {
    if (!movement.media) return null;
    const media = movement.media;

    return {
        url: media.url,
        publicId: media.publicId,
        resourceType: media.resourceType ?? null,
        format: media.format ?? null,
        createdAt: media.createdAt ?? null,
        date: media.createdAt ?? null,
        sessionType: "Movement Media",
        source: "movement",
        meta: media.meta ?? null,
        originalName: media.originalName ?? movement.name ?? null,
    };
}

function useSingleFilePreview(file: File | null) {
    const [url, setUrl] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (!file) {
            setUrl((previousUrl) => {
                if (previousUrl) URL.revokeObjectURL(previousUrl);
                return null;
            });
            return;
        }

        const nextUrl = URL.createObjectURL(file);
        setUrl((previousUrl) => {
            if (previousUrl) URL.revokeObjectURL(previousUrl);
            return nextUrl;
        });

        return () => URL.revokeObjectURL(nextUrl);
    }, [file]);

    return url;
}

function isImageFile(file: File | null) {
    return Boolean(file?.type?.startsWith("image/"));
}

function appendStringArray(formData: FormData, fieldName: string, values: string[]) {
    normalizeUniqueStrings(values).forEach((value) => formData.append(fieldName, value));
}

function formatMovementDetails(values: string[], label: string) {
    const normalizedValues = normalizeUniqueStrings(values);
    if (!normalizedValues.length) return `${label}: —`;
    return `${label}: ${normalizedValues.join(", ")}`;
}

const MUSCLE_OPTIONS = [
    "chest",
    "back",
    "shoulders",
    "biceps",
    "triceps",
    "quads",
    "hamstrings",
    "glutes",
    "calves",
    "core",
    "abs",
    "fullBody",
    "cardio",
    "mobility",
];

const EQUIPMENT_OPTIONS = [
    "bodyweight",
    "dumbbells",
    "barbell",
    "kettlebell",
    "machines",
    "cable",
    "bands",
    "smithMachine",
    "trapBar",
    "bench",
    "pullupBar",
    "treadmill",
    "bike",
    "rower",
    "elliptical",
    "medicineBall",
    "foamRoller",
];

function MovementFormControls({
    form,
    disabled,
    imagePreview,
    imageFile,
    inputRef,
    submitLabel,
    onFormChange,
    onImageChange,
    onSubmit,
    onCancel,
}: {
    form: FormState;
    disabled: boolean;
    imagePreview: string | null;
    imageFile: File | null;
    inputRef: React.RefObject<HTMLInputElement | null>;
    submitLabel: string;
    onFormChange: (next: FormState) => void;
    onImageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onSubmit: () => void;
    onCancel?: () => void;
}) {
    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" }, gap: 1.25 }}>
                <TextField
                    label="Nombre"
                    value={form.name}
                    onChange={(event) => onFormChange({ ...form, name: event.target.value })}
                    disabled={disabled}
                    placeholder="Nombre (requerido)"
                    size="small"
                    fullWidth
                />
                <Autocomplete
                    multiple
                    freeSolo
                    options={MUSCLE_OPTIONS}
                    value={form.muscleGroup}
                    onChange={(_event, nextValue) => onFormChange({ ...form, muscleGroup: normalizeUniqueStrings(nextValue) })}
                    disabled={disabled}
                    renderInput={(params) => <TextField {...params} label="Grupo muscular" size="small" placeholder="Selecciona o escribe..." />}
                />
                <Autocomplete
                    multiple
                    freeSolo
                    options={EQUIPMENT_OPTIONS}
                    value={form.equipment}
                    onChange={(_event, nextValue) => onFormChange({ ...form, equipment: normalizeUniqueStrings(nextValue) })}
                    disabled={disabled}
                    renderInput={(params) => <TextField {...params} label="Equipo" size="small" placeholder="Selecciona o escribe..." />}
                />
            </Box>

            <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, alignItems: { xs: "stretch", sm: "center" }, justifyContent: "space-between", gap: 1.25 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, flexWrap: "wrap" }}>
                    <input ref={inputRef} type="file" hidden accept="image/*" onChange={onImageChange} />
                    <Button type="button" variant="outlined" onClick={() => inputRef.current?.click()} disabled={disabled}>
                        Elegir imagen
                    </Button>
                    {imageFile ? <Chip label={imageFile.name} size="small" /> : null}
                    {imagePreview && isImageFile(imageFile) ? (
                        <Box component="img" src={imagePreview} alt="Preview" sx={{ height: 70, width: 110, objectFit: "cover", borderRadius: 2, border: 1, borderColor: "divider" }} />
                    ) : null}
                </Box>

                <FormControlLabel
                    control={<Switch checked={form.isActive} onChange={(event) => onFormChange({ ...form, isActive: event.target.checked })} disabled={disabled} />}
                    label="Activo"
                />
            </Box>

            <AppActionRow dense>
                {onCancel ? <Button variant="outlined" onClick={onCancel} disabled={disabled}>Cancelar</Button> : null}
                <Button variant="contained" onClick={onSubmit} disabled={disabled}>{submitLabel}</Button>
            </AppActionRow>
        </Box>
    );
}

export function MovementsPage() {
    const { t, lang } = useI18n();

    const [activeOnly, setActiveOnly] = React.useState<boolean>(true);
    const [q, setQ] = React.useState<string>("");
    const [createForm, setCreateForm] = React.useState<FormState>({ name: "", muscleGroup: [], equipment: [], isActive: true });
    const [createImageFile, setCreateImageFile] = React.useState<File | null>(null);
    const createImagePreview = useSingleFilePreview(createImageFile);
    const createImageInputRef = React.useRef<HTMLInputElement | null>(null);
    const [editingId, setEditingId] = React.useState<string | null>(null);
    const [editForm, setEditForm] = React.useState<FormState>({ name: "", muscleGroup: [], equipment: [], isActive: true });
    const [editImageFile, setEditImageFile] = React.useState<File | null>(null);
    const editImagePreview = useSingleFilePreview(editImageFile);
    const editImageInputRef = React.useRef<HTMLInputElement | null>(null);
    const [selectedMedia, setSelectedMedia] = React.useState<MediaLikeItem | null>(null);

    const movementsQuery: MovementsListQuery = React.useMemo(() => {
        const params: MovementsListQuery = {};
        if (activeOnly) params.activeOnly = true;
        const needle = q.trim();
        if (needle) params.q = needle;
        return params;
    }, [activeOnly, q]);

    const listQuery = useMovements(movementsQuery);
    const createMovementMutation = useCreateMovement(movementsQuery);
    const updateMovementMutation = useUpdateMovement(movementsQuery);
    const toggleActiveMutation = useUpdateMovement(movementsQuery);

    const busy = listQuery.isFetching || createMovementMutation.isPending || updateMovementMutation.isPending || toggleActiveMutation.isPending;
    const movements = sortMovements(listQuery.data ?? []);
    const empty = !listQuery.isFetching && movements.length === 0;

    function startEdit(movement: Movement) {
        setEditingId(movement.id);
        setEditForm(movementToForm(movement));
        setEditImageFile(null);
    }

    function cancelEdit() {
        setEditingId(null);
        setEditForm({ name: "", muscleGroup: [], equipment: [], isActive: true });
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
        appendStringArray(formData, "muscleGroup", createForm.muscleGroup);
        appendStringArray(formData, "equipment", createForm.equipment);
        formData.append("isActive", String(createForm.isActive));
        if (createImageFile) formData.append("media", createImageFile);

        try {
            await createMovementMutation.mutateAsync(formData);
            toast.success(lang === "es" ? "Movimiento creado" : "Movement created");
            setCreateForm({ name: "", muscleGroup: [], equipment: [], isActive: true });
            setCreateImageFile(null);
        } catch (errorValue) {
            toastApiError(errorValue, lang === "es" ? "No se pudo crear" : "Failed to create");
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
        appendStringArray(formData, "muscleGroup", editForm.muscleGroup);
        appendStringArray(formData, "equipment", editForm.equipment);
        formData.append("isActive", String(editForm.isActive));
        if (editImageFile) formData.append("media", editImageFile);

        try {
            await updateMovementMutation.mutateAsync({ id: editingId, formData });
            toast.success(lang === "es" ? "Movimiento actualizado" : "Movement updated");
            cancelEdit();
        } catch (errorValue) {
            toastApiError(errorValue, lang === "es" ? "No se pudo actualizar" : "Failed to update");
        }
    }

    function onToggleActive(movement: Movement) {
        const nextActive = !movement.isActive;
        const formData = new FormData();
        formData.append("isActive", String(nextActive));

        toggleActiveMutation.mutate(
            { id: movement.id, formData },
            {
                onSuccess: () => toast.success(nextActive ? "Movimiento activado" : "Movimiento desactivado"),
                onError: (errorValue) => toastApiError(errorValue, "No se pudo cambiar estatus"),
            }
        );
    }

    function onCreateImageChange(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0] ?? null;
        setCreateImageFile(file);
        event.currentTarget.value = "";
    }

    function onEditImageChange(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0] ?? null;
        setEditImageFile(file);
        event.currentTarget.value = "";
    }

    return (
        <AppPage
            title={lang === "es" ? "Movimientos" : "Movements"}
            subtitle={lang === "es" ? "Catálogo para el selector de ejercicios en rutinas." : "Catalog for the routines exercise selector."}
            actions={<FormControlLabel control={<Switch checked={activeOnly} onChange={(event) => setActiveOnly(event.target.checked)} disabled={busy} />} label={lang === "es" ? "Solo activos" : "Active only"} />}
        >
            <AppCard title={lang === "es" ? "Buscar y crear" : "Search and create"}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                    <TextField label={lang === "es" ? "Buscar" : "Search"} value={q} onChange={(event) => setQ(event.target.value)} disabled={busy} placeholder={lang === "es" ? "Nombre..." : "Name..."} size="small" fullWidth />
                    <MovementFormControls
                        form={createForm}
                        disabled={busy}
                        imagePreview={createImagePreview}
                        imageFile={createImageFile}
                        inputRef={createImageInputRef}
                        submitLabel={lang === "es" ? "Crear" : "Create"}
                        onFormChange={setCreateForm}
                        onImageChange={onCreateImageChange}
                        onSubmit={() => void onCreate()}
                    />
                </Box>
            </AppCard>

            <AppCard title={lang === "es" ? "Listado" : "List"} subtitle={`${lang === "es" ? "Mostrando" : "Showing"} ${movements.length}`}>
                {listQuery.isError ? (
                    <AppEmptyState title="No se pudo cargar movimientos" description={listQuery.error.message} variant="inline" />
                ) : null}

                {empty ? (
                    <AppEmptyState title={lang === "es" ? "Sin movimientos" : "No movements"} description={lang === "es" ? "Ajusta los filtros o crea uno nuevo." : "Adjust filters or create a new one."} variant="inline" />
                ) : null}

                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "repeat(2, minmax(0, 1fr))" }, gap: 1.25 }}>
                    {movements.map((movement) => {
                        const mediaItem = movementToMediaItem(movement);
                        const editing = editingId === movement.id;

                        return (
                            <AppCard key={movement.id} padding="sm" sx={{ height: "100%" }}>
                                {editing ? (
                                    <MovementFormControls
                                        form={editForm}
                                        disabled={busy}
                                        imagePreview={editImagePreview}
                                        imageFile={editImageFile}
                                        inputRef={editImageInputRef}
                                        submitLabel={lang === "es" ? "Guardar" : "Save"}
                                        onFormChange={setEditForm}
                                        onImageChange={onEditImageChange}
                                        onSubmit={() => void onSaveEdit()}
                                        onCancel={cancelEdit}
                                    />
                                ) : (
                                    <Box sx={{ display: "grid", gridTemplateColumns: mediaItem ? { xs: "1fr", sm: "160px minmax(0, 1fr)" } : "1fr", gap: 1.25 }}>
                                        {mediaItem ? (
                                            <MediaCard item={mediaItem} onOpen={setSelectedMedia} showMetaInfo={false} showTitle={false} />
                                        ) : null}

                                        <Box sx={{ minWidth: 0 }}>
                                            <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, alignItems: "flex-start" }}>
                                                <Box sx={{ minWidth: 0 }}>
                                                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }} noWrap>{movement.name}</Typography>
                                                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", overflowWrap: "anywhere" }}>id: {movement.id}</Typography>
                                                </Box>
                                                <Chip size="small" color={movement.isActive ? "success" : "default"} label={movement.isActive ? "Activo" : "Inactivo"} />
                                            </Box>

                                            <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 0.5 }}>
                                                <Typography variant="body2" color="text.secondary">{formatMovementDetails(movement.muscleGroup, "Músculo")}</Typography>
                                                <Typography variant="body2" color="text.secondary">{formatMovementDetails(movement.equipment, "Equipo")}</Typography>
                                            </Box>

                                            <AppActionRow dense sx={{ mt: 1.25 }}>
                                                <Button variant="outlined" onClick={() => startEdit(movement)} disabled={busy}>Editar</Button>
                                                <Button variant="outlined" color={movement.isActive ? "warning" : "success"} onClick={() => onToggleActive(movement)} disabled={busy}>
                                                    {movement.isActive ? "Desactivar" : "Activar"}
                                                </Button>
                                            </AppActionRow>
                                        </Box>
                                    </Box>
                                )}
                            </AppCard>
                        );
                    })}
                </Box>
            </AppCard>

            {selectedMedia ? <MediaViewerModal item={selectedMedia} onClose={() => setSelectedMedia(null)} /> : null}
        </AppPage>
    );
}

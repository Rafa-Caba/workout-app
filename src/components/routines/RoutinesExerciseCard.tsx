// src/components/routines/RoutinesExerciseCard.tsx
// MUI exercise editor card for routine builder.

import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { ExerciseAttachmentPicker } from "@/components/routines/ExerciseAttachmentPicker";
import type { AttachmentOption } from "@/utils/routines/attachments";
import type { ExerciseItem, DayKey } from "@/utils/routines/plan";
import type { I18nKey } from "@/i18n/translations";
import { useSettingsStore } from "@/state/settings.store";
import { normalizeDefaultRpe } from "@/utils/defaults";
import { AppCard, AppActionRow, AppFormGrid } from "@/components/mui";

type TFn = (key: I18nKey) => string;

type Placeholders = {
    exNotes: string;
    sets: string;
    reps: string;
    load: string;
};

export type MovementOption = {
    id: string;
    name: string;
    muscleGroup?: string | null;
    equipment?: string | null;
};

type Props = {
    dayKey: DayKey;
    idx: number;
    exercise: ExerciseItem;
    movementOptions?: MovementOption[];
    attachmentOptions: AttachmentOption[];
    selectedIds: string[];
    pendingFiles: File[];
    onPickFiles: (files: File[]) => void;
    onRemovePending: (fileIndex?: number) => void;
    busy: boolean;
    isThisUploading: boolean;
    t: TFn;
    lang: string;
    ph: Placeholders;
    onRemove: () => void;
    onChangeName: (next: string) => void;
    onChangeMovement: (args: { movementId?: string; movementName?: string }) => void;
    onChangeNotes: (next: string) => void;
    onChangeSets: (next: string) => void;
    onChangeReps: (next: string) => void;
    onChangeRpe: (next: string) => void;
    onChangeLoad: (next: string) => void;
    onToggleAttachment: (publicId: string) => void;
};

export function RoutinesExerciseCard({
    dayKey,
    idx,
    exercise,
    movementOptions,
    attachmentOptions,
    selectedIds,
    pendingFiles,
    onPickFiles,
    onRemovePending,
    busy,
    isThisUploading,
    t,
    lang,
    ph,
    onRemove,
    onChangeName,
    onChangeMovement,
    onChangeNotes,
    onChangeSets,
    onChangeReps,
    onChangeRpe,
    onChangeLoad,
    onToggleAttachment,
}: Props) {
    const hasMovements = Array.isArray(movementOptions) && movementOptions.length > 0;
    const hasMovementMapping = Boolean(exercise.movementId);
    const defaults = useSettingsStore((s) => s.settings.defaults);
    const defaultRpeNorm = normalizeDefaultRpe(defaults?.defaultRpe ?? null);

    const plannedRpeSelectValue = exercise.rpe != null
        ? String(exercise.rpe)
        : defaultRpeNorm != null
            ? `__default__:${defaultRpeNorm}`
            : "";

    return (
        <AppCard
            title={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                    <Typography component="span" variant="subtitle1" sx={{ fontWeight: 850 }}>
                        {t("routines.exercise")} #{idx + 1}
                    </Typography>
                    <Chip size="small" color="primary" label={String(dayKey)} />
                    {hasMovementMapping && exercise.movementName ? <Chip size="small" label={`${lang === "es" ? "Catálogo" : "Catalog"} · ${exercise.movementName}`} /> : null}
                </Box>
            }
            action={<Button type="button" variant="outlined" color="error" size="small" onClick={onRemove} disabled={busy}>{t("routines.remove")}</Button>}
            sx={{ borderColor: hasMovementMapping ? "primary.light" : undefined }}
            padding="sm"
        >
            <AppFormGrid columns={{ xs: 1, md: 2 }} gap={1.5}>
                <TextField
                    fullWidth
                    select
                    size="small"
                    label={lang === "es" ? "Movimiento" : "Movement"}
                    value={exercise.movementId ?? ""}
                    disabled={busy || !hasMovements}
                    onChange={(event) => {
                        const nextId = event.target.value || "";
                        if (!nextId) {
                            onChangeMovement({ movementId: undefined, movementName: undefined });
                            return;
                        }
                        const movement = movementOptions?.find((item) => item.id === nextId);
                        const snapshot = movement?.name ?? "";
                        onChangeMovement({ movementId: nextId, movementName: snapshot || undefined });
                        if (snapshot) onChangeName(snapshot);
                    }}
                    sx={{ gridColumn: { md: "1 / -1" } }}
                >
                    <MenuItem value="">
                        {hasMovements
                            ? lang === "es" ? "Seleccionar movimiento…" : "Select movement…"
                            : lang === "es" ? "No hay movimientos" : "No movements available"}
                    </MenuItem>
                    {movementOptions?.map((movement) => (
                        <MenuItem key={movement.id} value={movement.id}>{movement.name}</MenuItem>
                    )) ?? null}
                </TextField>

                <TextField fullWidth size="small" label={t("routines.exName")} value={exercise.name} onChange={(event) => onChangeName(event.target.value)} disabled={busy} placeholder={t("routines.exNamePh")} />
                <TextField fullWidth size="small" label={t("routines.exNotes")} value={exercise.notes ?? ""} onChange={(event) => onChangeNotes(event.target.value)} disabled={busy} placeholder={ph.exNotes} />
                <TextField fullWidth size="small" label={t("routines.sets")} value={exercise.sets ?? ""} onChange={(event) => onChangeSets(event.target.value)} disabled={busy} placeholder={ph.sets} inputMode="numeric" />
                <TextField fullWidth size="small" label={t("routines.reps")} value={exercise.reps ?? ""} onChange={(event) => onChangeReps(event.target.value)} disabled={busy} placeholder={ph.reps} />
                <TextField
                    fullWidth
                    select
                    size="small"
                    label="RPE"
                    value={plannedRpeSelectValue}
                    onChange={(event) => {
                        const raw = event.target.value;
                        if (raw.startsWith("__default__:")) {
                            onChangeRpe("");
                            return;
                        }
                        onChangeRpe(raw);
                    }}
                    disabled={busy}
                >
                    <MenuItem value="">{lang === "es" ? "Sin RPE" : "No RPE"}</MenuItem>
                    {defaultRpeNorm != null ? <MenuItem value={`__default__:${defaultRpeNorm}`}>{lang === "es" ? `Default (${defaultRpeNorm})` : `Default (${defaultRpeNorm})`}</MenuItem> : null}
                    {[6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10].map((value) => (
                        <MenuItem key={value} value={String(value)}>{value}</MenuItem>
                    ))}
                </TextField>
                <TextField fullWidth size="small" label={t("routines.load")} value={exercise.load ?? ""} onChange={(event) => onChangeLoad(event.target.value)} disabled={busy} placeholder={ph.load} />
            </AppFormGrid>

            {exercise.movementName ? (
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                    Snapshot: <Box component="span" sx={{ fontFamily: "monospace" }}>{exercise.movementName}</Box>
                </Typography>
            ) : null}

            <Box sx={{ mt: 1.5 }}>
                <ExerciseAttachmentPicker
                    title={lang === "es" ? "Media del ejercicio" : "Exercise media"}
                    hint={lang === "es" ? "Selecciona media ya subida o agrega archivos pendientes antes de guardar." : "Select uploaded media or add pending files before saving."}
                    emptyText={lang === "es" ? "Sin adjuntos enlazados." : "No linked attachments."}
                    uploadAndAttachLabel={isThisUploading ? (lang === "es" ? "Subiendo…" : "Uploading…") : (lang === "es" ? "Agregar" : "Add")}
                    attachmentOptions={attachmentOptions}
                    selectedIds={selectedIds}
                    pendingFiles={pendingFiles}
                    disabled={busy}
                    busy={isThisUploading}
                    onToggle={onToggleAttachment}
                    onPickFiles={onPickFiles}
                    onRemovePending={onRemovePending}
                />
            </Box>

            <AppActionRow align="right" sx={{ mt: 1.5 }}>
                <Button type="button" variant="outlined" color="error" size="small" onClick={onRemove} disabled={busy}>
                    {t("routines.remove")}
                </Button>
            </AppActionRow>
        </AppCard>
    );
}

// src/components/routines/RoutinesDayEditor.tsx
// MUI day editor for routine plan details and exercise cards.

import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import { SessionTypeSelect } from "@/components/SessionTypeSelect";
import { RoutinesExerciseCard, type MovementOption } from "@/components/routines/RoutinesExerciseCard";
import type { AttachmentOption } from "@/utils/routines/attachments";
import type { DayPlan, DayKey, ExerciseItem } from "@/utils/routines/plan";
import type { I18nKey } from "@/i18n/translations";
import { AppActionRow, AppCard, AppFormGrid } from "@/components/mui";

type TFn = (key: I18nKey) => string;

type Placeholders = {
    sessionType: string;
    focus: string;
    tags: string;
    notes: string;
    exNotes: string;
    sets: string;
    reps: string;
    load: string;
};

type Props = {
    activePlan: DayPlan;
    busy: boolean;
    t: TFn;
    lang: string;
    ph: Placeholders;
    scrollRootEl?: HTMLElement | null;
    attachmentOptions: AttachmentOption[];
    movementOptions?: MovementOption[];
    exerciseUploadBusy: boolean;
    uploadingExercise: { dayKey: DayKey; exerciseId: string } | null;
    getPendingFilesForExercise: (exerciseId: string) => File[];
    onPickFilesForExercise: (exerciseId: string, files: File[]) => void;
    onRemovePendingForExercise: (exerciseId: string, fileIndex?: number) => void;
    onAddExercise: (dayKey: DayKey) => void;
    onRemoveExercise: (dayKey: DayKey, idx: number) => void;
    onUpdatePlan: (dayKey: DayKey, patch: Partial<DayPlan>) => void;
    onUpdateExercise: (dayKey: DayKey, idx: number, patch: Partial<ExerciseItem>) => void;
};

export function RoutinesDayEditor({
    activePlan,
    busy,
    t,
    lang,
    ph,
    attachmentOptions,
    movementOptions,
    exerciseUploadBusy,
    uploadingExercise,
    getPendingFilesForExercise,
    onPickFilesForExercise,
    onRemovePendingForExercise,
    onAddExercise,
    onRemoveExercise,
    onUpdatePlan,
    onUpdateExercise,
}: Props) {
    const exercises = activePlan.exercises ?? [];
    const dayKey = activePlan.dayKey as DayKey;

    return (
        <Box sx={{ display: "grid", gap: { xs: 1.5, md: 2 } }}>
            <AppCard
                title={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                        <Typography component="span" variant="subtitle1" sx={{ fontWeight: 850 }}>{t("routines.day")}</Typography>
                        <Chip size="small" color="primary" label={activePlan.dayKey} />
                    </Box>
                }
                action={<Button variant="outlined" onClick={() => onAddExercise(dayKey)} disabled={busy}>{t("routines.addExercise")}</Button>}
                padding="sm"
            >
                <AppFormGrid columns={{ xs: 1, md: 2 }} gap={1.5}>
                    <Box sx={{ minWidth: 0 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5, fontWeight: 800 }}>
                            {ph.sessionType || t("routines.sessionType")}
                        </Typography>
                        <SessionTypeSelect
                            t={t}
                            value={activePlan.sessionType}
                            onChange={(next) => onUpdatePlan(dayKey, { sessionType: next ?? undefined })}
                            disabled={busy}
                            selectClassName="h-11"
                        />
                    </Box>
                    <TextField
                        fullWidth
                        size="small"
                        label={t("routines.focus")}
                        value={activePlan.focus ?? ""}
                        onChange={(event) => onUpdatePlan(dayKey, { focus: event.target.value || undefined })}
                        disabled={busy}
                        placeholder={ph.focus}
                        sx={{ alignSelf: "end" }}
                    />
                    <TextField
                        fullWidth
                        size="small"
                        label={t("routines.tagsCsv")}
                        value={(activePlan.tags ?? []).join(", ")}
                        onChange={(event) => onUpdatePlan(dayKey, { tags: event.target.value.split(",").map((part) => part.trim()).filter(Boolean) })}
                        disabled={busy}
                        placeholder={ph.tags}
                    />
                    <TextField
                        fullWidth
                        size="small"
                        label={t("routines.notes")}
                        value={activePlan.notes ?? ""}
                        onChange={(event) => onUpdatePlan(dayKey, { notes: event.target.value || undefined })}
                        disabled={busy}
                        placeholder={ph.notes}
                    />
                </AppFormGrid>
            </AppCard>

            <AppCard
                title={lang === "es" ? "Ejercicios del día" : "Day exercises"}
                subtitle={exercises.length > 0 ? `${exercises.length} ${lang === "es" ? "ejercicio(s)" : "exercise(s)"}` : undefined}
                padding="sm"
                action={<Button variant="outlined" onClick={() => onAddExercise(dayKey)} disabled={busy}>{t("routines.addExercise")}</Button>}
            >
                <Box sx={{ display: "grid", gap: 1.5 }}>
                    {exercises.map((exercise, idx) => {
                        const exerciseId = exercise.id;
                        const selectedIds = Array.isArray(exercise.attachmentPublicIds) ? exercise.attachmentPublicIds : [];
                        const isThisUploading = exerciseUploadBusy && uploadingExercise?.dayKey === dayKey && uploadingExercise?.exerciseId === exerciseId;
                        const pendingFiles = getPendingFilesForExercise(exerciseId);

                        return (
                            <RoutinesExerciseCard
                                key={exerciseId}
                                dayKey={dayKey}
                                idx={idx}
                                exercise={exercise}
                                movementOptions={movementOptions}
                                attachmentOptions={attachmentOptions}
                                selectedIds={selectedIds}
                                pendingFiles={pendingFiles}
                                onPickFiles={(files) => onPickFilesForExercise(exerciseId, files)}
                                onRemovePending={(fileIndex) => onRemovePendingForExercise(exerciseId, fileIndex)}
                                busy={busy}
                                isThisUploading={isThisUploading}
                                t={t}
                                lang={lang}
                                ph={ph}
                                onRemove={() => onRemoveExercise(dayKey, idx)}
                                onChangeMovement={({ movementId, movementName }) => {
                                    onUpdateExercise(dayKey, idx, { movementId, movementName, name: movementName ?? exercise.name });
                                }}
                                onChangeName={(next) => onUpdateExercise(dayKey, idx, { name: next })}
                                onChangeNotes={(next) => onUpdateExercise(dayKey, idx, { notes: next || undefined })}
                                onChangeSets={(next) => onUpdateExercise(dayKey, idx, { sets: next || undefined })}
                                onChangeReps={(next) => onUpdateExercise(dayKey, idx, { reps: next || undefined })}
                                onChangeRpe={(next) => onUpdateExercise(dayKey, idx, { rpe: next || undefined })}
                                onChangeLoad={(next) => onUpdateExercise(dayKey, idx, { load: next || undefined })}
                                onToggleAttachment={(publicId) => {
                                    const nextIds = new Set(selectedIds);
                                    if (nextIds.has(publicId)) nextIds.delete(publicId);
                                    else nextIds.add(publicId);
                                    onUpdateExercise(dayKey, idx, { attachmentPublicIds: Array.from(nextIds) });
                                }}
                            />
                        );
                    })}

                    {exercises.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                            {lang === "es" ? "Agrega tu primer ejercicio para este día." : "Add your first exercise for this day."}
                        </Typography>
                    ) : null}

                    <AppActionRow align="left">
                        <Button type="button" variant="outlined" onClick={() => onAddExercise(dayKey)} disabled={busy}>
                            {t("routines.addExercise")}
                        </Button>
                    </AppActionRow>
                </Box>
            </AppCard>
        </Box>
    );
}

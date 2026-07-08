// src/components/gymCheck/GymCheckExerciseCard.tsx
// MUI exercise card used by Gym Check normal and trainee flows.

import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Collapse from "@mui/material/Collapse";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { AppCard } from "@/components/mui";
import type { DayKey, ExerciseItem } from "@/utils/routines/plan";
import type { AttachmentOption } from "@/utils/routines/attachments";
import { GymCheckExerciseMediaStrip } from "@/components/gymCheck/GymCheckExerciseMediaStrip";
import type { WorkoutExerciseSet } from "@/types/workoutDay.types";

function formatNullable(value: unknown): string {
    if (value === null || value === undefined || value === "") return "—";
    return String(value);
}

function numberToInputValue(value: number | null | undefined): string {
    return value === null || value === undefined || Number.isNaN(value) ? "" : String(value);
}

function MetricLine(props: { label: string; value: string }) {
    return (
        <Box
            sx={{
                display: "flex",
                justifyContent: "space-between",
                gap: 1.5,
                py: 0.7,
                borderBottom: 1,
                borderColor: "divider",
                flexWrap: "wrap",
            }}
        >
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 750 }}>
                {props.label}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 800, textAlign: "right" }}>
                {props.value}
            </Typography>
        </Box>
    );
}

type Props = {
    lang: "es" | "en";
    busy: boolean;
    dayKey: DayKey;
    exercise: ExerciseItem;
    index: number;
    exerciseId: string;
    isDone: boolean;
    uploading: boolean;
    mediaPublicIds: string[];
    attachmentByPublicId: Map<string, AttachmentOption>;
    performedSets: WorkoutExerciseSet[];
    onToggleDone: () => void;
    onUploadFiles: (files: File[]) => void;
    onChangePerformedSet: (setIndex: number, patch: Partial<WorkoutExerciseSet>) => void;
    onAddPerformedSet: () => void;
    onRemovePerformedSet: (setIndex: number) => void;
    onOpenViewer: (opt: AttachmentOption) => void;
    onRemoveMediaAt: (index: number) => void;
};

export function GymCheckExerciseCard(props: Props) {
    const {
        lang,
        busy,
        dayKey,
        exercise,
        index,
        exerciseId,
        isDone,
        uploading,
        mediaPublicIds,
        attachmentByPublicId,
        performedSets,
        onToggleDone,
        onUploadFiles,
        onChangePerformedSet,
        onAddPerformedSet,
        onRemovePerformedSet,
        onOpenViewer,
        onRemoveMediaAt,
    } = props;

    const inputId = `gymcheck-file-${dayKey}-${exerciseId}`;
    const [performedSetsOpen, setPerformedSetsOpen] = React.useState(false);
    const setsInputsDisabled = busy || isDone;
    const canEditPerformedSets = !setsInputsDisabled;

    return (
        <AppCard
            title={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", minWidth: 0 }}>
                    <Typography component="span" variant="subtitle1" sx={{ fontWeight: 850 }}>
                        {lang === "es" ? `Ejercicio #${index + 1}` : `Exercise #${index + 1}`}
                    </Typography>
                    <Chip size="small" label={formatNullable(exercise.name)} color={isDone ? "success" : "default"} sx={{ maxWidth: "100%" }} />
                </Box>
            }
            subtitle={exercise.notes ? formatNullable(exercise.notes) : lang === "es" ? "Sin notas" : "No notes"}
            action={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                    <FormControlLabel
                        control={<Checkbox checked={isDone} onChange={onToggleDone} disabled={busy} />}
                        label={lang === "es" ? "Hecho" : "Done"}
                    />
                    <input
                        id={inputId}
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        hidden
                        onChange={(event) => {
                            const files = Array.from(event.target.files ?? []);
                            event.target.value = "";
                            onUploadFiles(files);
                        }}
                        disabled={busy}
                    />
                    <Button variant="outlined" size="small" onClick={() => document.getElementById(inputId)?.click()} disabled={busy || uploading}>
                        {uploading ? (lang === "es" ? "Subiendo…" : "Uploading…") : (lang === "es" ? "Subir media" : "Upload media")}
                    </Button>
                </Box>
            }
            sx={{ opacity: isDone ? 0.92 : 1 }}
        >
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(0, 0.9fr) minmax(0, 1.1fr)" }, gap: 1.5, minWidth: 0 }}>
                <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 1.25, bgcolor: "background.default", minWidth: 0 }}>
                    <MetricLine label={lang === "es" ? "Series planeadas" : "Planned sets"} value={formatNullable(exercise.sets)} />
                    <MetricLine label={lang === "es" ? "Reps planeadas" : "Planned reps"} value={formatNullable(exercise.reps)} />
                    <MetricLine label={lang === "es" ? "RPE planeado" : "Planned RPE"} value={formatNullable(exercise.rpe)} />
                    <MetricLine label={lang === "es" ? "Carga planeada" : "Planned load"} value={formatNullable(exercise.load)} />
                </Box>

                <Box sx={{ minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.75, fontWeight: 800 }}>
                        {lang === "es" ? "Media" : "Media"}
                    </Typography>
                    <GymCheckExerciseMediaStrip
                        lang={lang}
                        mediaPublicIds={mediaPublicIds}
                        attachmentByPublicId={attachmentByPublicId}
                        onOpenViewer={onOpenViewer}
                        onRemoveAt={onRemoveMediaAt}
                    />
                </Box>
            </Box>

            <Divider sx={{ my: 1.75 }} />

            <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: { xs: 1.25, md: 1.5 }, bgcolor: "background.default" }}>
                <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", gap: 1.25, mb: 1.25 }}>
                    <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 850 }}>
                            {lang === "es" ? "Sets ejecutados" : "Performed sets"}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {lang === "es" ? "Estos valores se guardarán en la sesión real." : "These values will be saved into the real session."}
                        </Typography>
                    </Box>
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                        <Button type="button" variant="outlined" size="small" onClick={() => setPerformedSetsOpen((prev) => !prev)} disabled={busy}>
                            {performedSetsOpen ? (lang === "es" ? "Ocultar sets" : "Hide sets") : (lang === "es" ? "Mostrar sets" : "Show sets")}
                        </Button>
                        <Button type="button" variant="outlined" size="small" onClick={onAddPerformedSet} disabled={!canEditPerformedSets}>
                            {lang === "es" ? "Agregar set" : "Add set"}
                        </Button>
                    </Box>
                </Box>

                <Collapse in={performedSetsOpen} unmountOnExit>
                    <Box sx={{ display: "grid", gap: 1, opacity: setsInputsDisabled ? 0.65 : 1 }}>
                        {performedSets.map((setItem, setIndex) => (
                            <Box
                                key={`${exerciseId}-set-${setItem.setIndex}-${setIndex}`}
                                sx={{
                                    display: "grid",
                                    gridTemplateColumns: { xs: "1fr", sm: "80px repeat(3, minmax(0, 1fr)) auto" },
                                    gap: 1,
                                    alignItems: "end",
                                    border: 1,
                                    borderColor: "divider",
                                    borderRadius: 2,
                                    p: 1,
                                    bgcolor: "background.paper",
                                }}
                            >
                                <Typography variant="body2" sx={{ fontWeight: 850, alignSelf: "center" }}>
                                    {lang === "es" ? `Set ${setItem.setIndex}` : `Set ${setItem.setIndex}`}
                                </Typography>
                                <TextField
                                    size="small"
                                    type="number"
                                    label={lang === "es" ? "Reps" : "Reps"}
                                    value={numberToInputValue(setItem.reps)}
                                    onChange={(event) => {
                                        const value = event.target.value.trim();
                                        onChangePerformedSet(setIndex, { reps: value === "" ? null : Math.trunc(Number(value)) });
                                    }}
                                    disabled={setsInputsDisabled}
                                    inputMode="numeric"
                                />
                                <TextField
                                    size="small"
                                    type="number"
                                    label={lang === "es" ? "Carga" : "Load"}
                                    value={numberToInputValue(setItem.weight)}
                                    onChange={(event) => {
                                        const value = event.target.value.trim();
                                        onChangePerformedSet(setIndex, { weight: value === "" ? null : Number(value), unit: setItem.unit });
                                    }}
                                    disabled={setsInputsDisabled}
                                    inputMode="decimal"
                                />
                                <TextField
                                    size="small"
                                    type="number"
                                    label="RPE"
                                    value={numberToInputValue(setItem.rpe)}
                                    onChange={(event) => {
                                        const value = event.target.value.trim();
                                        onChangePerformedSet(setIndex, { rpe: value === "" ? null : Number(value) });
                                    }}
                                    disabled={setsInputsDisabled}
                                    inputMode="decimal"
                                />
                                <Button type="button" variant="text" color="error" size="small" onClick={() => onRemovePerformedSet(setIndex)} disabled={setsInputsDisabled || performedSets.length <= 1}>
                                    {lang === "es" ? "Quitar" : "Remove"}
                                </Button>
                            </Box>
                        ))}
                    </Box>
                </Collapse>

                {!performedSetsOpen ? (
                    <Typography variant="body2" color="text.secondary" sx={{ border: 1, borderStyle: "dashed", borderColor: "divider", borderRadius: 2, p: 1.25 }}>
                        {lang === "es" ? "La sección de sets reales inicia colapsada. Ábrela si necesitas editar los valores ejecutados." : "The performed sets section starts collapsed. Expand it if you need to edit executed values."}
                    </Typography>
                ) : null}
            </Box>
        </AppCard>
    );
}

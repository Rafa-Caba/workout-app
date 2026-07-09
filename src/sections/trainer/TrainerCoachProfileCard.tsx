// src/sections/trainer/TrainerCoachProfileCard.tsx
// MUI coach profile editor for a selected trainee.

import React from "react";
import { toast } from "sonner";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";

import { AppCard, AppFormGrid } from "@/components/mui";
import { useI18n } from "@/i18n/I18nProvider";
import { useTrainerCoachProfile } from "@/hooks/trainer/useTrainerCoachProfile";
import { useUpsertTrainerCoachProfile } from "@/hooks/trainer/useUpsertTrainerCoachProfile";
import type { TrainingLevel } from "@/types/trainerCoachProfile.types";

const LEVELS: Array<{ value: Exclude<TrainingLevel, null>; labelEs: string; labelEn: string }> = [
    { value: "BEGINNER", labelEs: "Principiante", labelEn: "Beginner" },
    { value: "INTERMEDIATE", labelEs: "Intermedio", labelEn: "Intermediate" },
    { value: "ADVANCED", labelEs: "Avanzado", labelEn: "Advanced" },
];

function normalizeLevel(value: unknown): TrainingLevel {
    if (value === "BEGINNER" || value === "INTERMEDIATE" || value === "ADVANCED") return value;
    return null;
}

function readLevelFromInput(value: string): TrainingLevel {
    return normalizeLevel(value);
}

export function TrainerCoachProfileCard({ traineeId }: { traineeId: string }) {
    const { lang } = useI18n();
    const q = useTrainerCoachProfile({ traineeId });
    const mutation = useUpsertTrainerCoachProfile();
    const loadedProfile = q.data?.profile ?? null;

    const [level, setLevel] = React.useState<TrainingLevel>(null);
    const [notes, setNotes] = React.useState<string>("");
    const [dirty, setDirty] = React.useState(false);

    React.useEffect(() => {
        setLevel(normalizeLevel(loadedProfile?.coachAssessedLevel));
        setNotes(typeof loadedProfile?.coachNotes === "string" ? loadedProfile.coachNotes : "");
        setDirty(false);
    }, [traineeId, loadedProfile?.id, loadedProfile?.coachAssessedLevel, loadedProfile?.coachNotes]);

    const onSave = async () => {
        try {
            await mutation.mutateAsync({
                traineeId,
                body: {
                    coachAssessedLevel: level,
                    coachNotes: notes.trim() ? notes.trim() : null,
                },
            });
            setDirty(false);
            toast.success(lang === "es" ? "Notas del coach guardadas." : "Coach notes saved.");
        } catch {
            toast.error(lang === "es" ? "No se pudo guardar." : "Failed to save.");
        }
    };

    return (
        <AppCard
            title={lang === "es" ? "Perfil del coach" : "Coach profile"}
            subtitle={
                lang === "es"
                    ? "Estos datos los llena el coach después de evaluar al trainee."
                    : "These fields are filled by the coach after assessing the trainee."
            }
            action={
                <Button variant="contained" onClick={() => void onSave()} disabled={q.isLoading || mutation.isPending || !dirty}>
                    {mutation.isPending ? (lang === "es" ? "Guardando…" : "Saving…") : lang === "es" ? "Guardar" : "Save"}
                </Button>
            }
        >
            {q.isError ? (
                <Chip color="error" label={lang === "es" ? "Error al cargar perfil" : "Failed to load profile"} sx={{ mb: 1.5 }} />
            ) : null}

            <AppFormGrid columns={{ xs: 1, md: 2 }} gap={1.5}>
                <TextField
                    select
                    size="small"
                    label={lang === "es" ? "Nivel (coach)" : "Level (coach)"}
                    value={level ?? ""}
                    disabled={q.isLoading}
                    onChange={(event) => {
                        setLevel(readLevelFromInput(event.target.value));
                        setDirty(true);
                    }}
                >
                    <MenuItem value="">{lang === "es" ? "Sin definir" : "Not set"}</MenuItem>
                    {LEVELS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                            {lang === "es" ? option.labelEs : option.labelEn}
                        </MenuItem>
                    ))}
                </TextField>

                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                    <Chip
                        color={loadedProfile ? "primary" : "default"}
                        label={
                            q.isLoading
                                ? lang === "es"
                                    ? "Cargando…"
                                    : "Loading…"
                                : loadedProfile
                                    ? lang === "es"
                                        ? "Guardado"
                                        : "Saved"
                                    : lang === "es"
                                        ? "Nuevo"
                                        : "New"
                        }
                    />
                    {dirty ? <Chip color="warning" label={lang === "es" ? "Cambios sin guardar" : "Unsaved changes"} /> : null}
                </Box>
            </AppFormGrid>

            <TextField
                fullWidth
                multiline
                minRows={4}
                size="small"
                label={lang === "es" ? "Notas del coach" : "Coach notes"}
                value={notes}
                disabled={q.isLoading}
                onChange={(event) => {
                    setNotes(event.target.value);
                    setDirty(true);
                }}
                placeholder={
                    lang === "es"
                        ? "Ej: técnica, prioridades, consideraciones, lesiones, objetivos..."
                        : "E.g., technique, priorities, considerations, injuries, goals..."
                }
                sx={{ mt: 1.5 }}
            />
        </AppCard>
    );
}

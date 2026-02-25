import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/I18nProvider";

import { useTrainerCoachProfile } from "@/hooks/trainer/useTrainerCoachProfile";
import { useUpsertTrainerCoachProfile } from "@/hooks/trainer/useUpsertTrainerCoachProfile";

import type { TrainingLevel } from "@/types/trainerCoachProfile.types";

const LEVELS: Array<{ value: Exclude<TrainingLevel, null>; labelEs: string; labelEn: string }> = [
    { value: "BEGINNER", labelEs: "Principiante", labelEn: "Beginner" },
    { value: "INTERMEDIATE", labelEs: "Intermedio", labelEn: "Intermediate" },
    { value: "ADVANCED", labelEs: "Avanzado", labelEn: "Advanced" },
];

function normalizeLevel(v: unknown): TrainingLevel {
    if (v === "BEGINNER" || v === "INTERMEDIATE" || v === "ADVANCED") return v;
    return null;
}

type Props = {
    traineeId: string;
};

export function TrainerCoachProfileCard({ traineeId }: Props) {
    const { lang } = useI18n();

    const q = useTrainerCoachProfile({ traineeId });
    const m = useUpsertTrainerCoachProfile();

    const loadedProfile = q.data?.profile ?? null;

    const [level, setLevel] = React.useState<TrainingLevel>(null);
    const [notes, setNotes] = React.useState<string>("");

    const [dirty, setDirty] = React.useState(false);

    React.useEffect(() => {
        // Reset local state when trainee changes or profile loads
        const lvl = normalizeLevel(loadedProfile?.coachAssessedLevel);
        const n = typeof loadedProfile?.coachNotes === "string" ? loadedProfile.coachNotes : "";

        setLevel(lvl);
        setNotes(n);
        setDirty(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [traineeId, loadedProfile?.id]);

    const isSaving = m.isPending;
    const isLoading = q.isLoading;

    const onSave = async () => {
        try {
            await m.mutateAsync({
                traineeId,
                body: {
                    coachAssessedLevel: level,
                    coachNotes: notes.trim() ? notes.trim() : null,
                },
            });

            setDirty(false);
            toast.success(lang === "es" ? "Notas del coach guardadas." : "Coach notes saved.");
        } catch (e: any) {
            toast.error(lang === "es" ? "No se pudo guardar." : "Failed to save.");
        }
    };

    return (
        <div className="rounded-xl border bg-card p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="text-sm font-semibold">
                        {lang === "es" ? "Perfil del coach" : "Coach profile"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                        {lang === "es"
                            ? "Estos datos los llena el coach (ej. después de la primera cita)."
                            : "These fields are filled by the coach (e.g., after the first session)."}
                    </div>
                </div>

                <Button
                    type="button"
                    variant="outline"
                    onClick={onSave}
                    disabled={isLoading || isSaving || !dirty}
                    className={cn("h-9", !dirty ? "opacity-80" : "")}
                >
                    {isSaving ? (lang === "es" ? "Guardando…" : "Saving…") : lang === "es" ? "Guardar" : "Save"}
                </Button>
            </div>

            {q.isError ? (
                <div className="text-sm text-destructive">
                    {lang === "es"
                        ? "Error al cargar el perfil del coach. Intenta recargar."
                        : "Failed to load coach profile. Try again."}
                </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                    <label className="block text-xs text-muted-foreground">
                        {lang === "es" ? "Nivel (coach)" : "Level (coach)"}
                    </label>

                    <select
                        value={level ?? ""}
                        onChange={(e) => {
                            const v = e.target.value;
                            setLevel(v ? (v as any) : null);
                            setDirty(true);
                        }}
                        className={cn(
                            "h-9 w-full rounded-md border bg-background px-3 text-sm",
                            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        )}
                        disabled={isLoading}
                    >
                        <option value="">
                            {lang === "es" ? "Sin definir" : "Not set"}
                        </option>
                        {LEVELS.map((o) => (
                            <option key={o.value} value={o.value}>
                                {lang === "es" ? o.labelEs : o.labelEn}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-1">
                    <label className="block text-xs text-muted-foreground">
                        {lang === "es" ? "Estado" : "Status"}
                    </label>
                    <div className="h-9 rounded-md border bg-background px-3 text-sm flex items-center">
                        {q.isLoading
                            ? lang === "es"
                                ? "Cargando…"
                                : "Loading…"
                            : loadedProfile
                                ? lang === "es"
                                    ? "Guardado"
                                    : "Saved"
                                : lang === "es"
                                    ? "Nuevo"
                                    : "New"}
                    </div>
                </div>
            </div>

            <div className="space-y-1">
                <label className="block text-xs text-muted-foreground">
                    {lang === "es" ? "Notas del coach" : "Coach notes"}
                </label>
                <textarea
                    value={notes}
                    onChange={(e) => {
                        setNotes(e.target.value);
                        setDirty(true);
                    }}
                    placeholder={
                        lang === "es"
                            ? "Ej: técnica, prioridades, consideraciones, lesiones, objetivos..."
                            : "E.g., technique, priorities, considerations, injuries, goals..."
                    }
                    rows={4}
                    className={cn(
                        "w-full rounded-md border bg-background px-3 py-2 text-sm",
                        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    )}
                    disabled={isLoading}
                />
            </div>
        </div>
    );
}
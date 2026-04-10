// src/components/gymCheck/GymCheckExerciseCard.tsx

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type { DayKey, ExerciseItem } from "@/utils/routines/plan";
import type { AttachmentOption } from "@/utils/routines/attachments";
import { GymCheckExerciseMediaStrip } from "@/components/gymCheck/GymCheckExerciseMediaStrip";
import { useAuthStore } from "@/state/auth.store";
import type { WorkoutExerciseSet } from "@/types/workoutDay.types";

function formatNullable(value: unknown): string {
    if (value === null || value === undefined || value === "") return "—";
    return String(value);
}

function numberToInputValue(value: number | null | undefined): string {
    return value === null || value === undefined || Number.isNaN(value) ? "" : String(value);
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

    onChangePerformedSet: (
        setIndex: number,
        patch: Partial<WorkoutExerciseSet>
    ) => void;
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

    const { user } = useAuthStore();
    const unitLoad = user?.units?.weight ?? "lb";

    const inputId = `gymcheck-file-${dayKey}-${exerciseId}`;

    /**
     * UI only:
     * - Same behavior as RN: performed sets section starts collapsed.
     * - User can expand/collapse manually without affecting data.
     */
    const [performedSetsOpen, setPerformedSetsOpen] = React.useState(false);

    const setsInputsDisabled = busy || isDone;
    const canEditPerformedSets = !setsInputsDisabled;

    return (
        <Card className={isDone ? "w-full min-w-0 opacity-95" : "w-full min-w-0"}>
            <CardHeader className="min-w-0 pb-3">
                <div className="min-w-0 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                        <CardTitle className="min-w-0 text-base wrap-break-words">
                            {lang === "es" ? `Ejercicio #${index + 1}` : `Exercise #${index + 1}`}{" "}
                            <span className="text-muted-foreground">•</span>{" "}
                            <span className="font-semibold wrap-break-words">{formatNullable(exercise.name)}</span>
                        </CardTitle>

                        <CardDescription className="min-w-0 text-xs wrap-break-words">
                            {exercise.notes
                                ? formatNullable(exercise.notes)
                                : lang === "es"
                                    ? "Sin notas"
                                    : "No notes"}
                        </CardDescription>
                    </div>

                    <div className="flex w-full min-w-0 flex-col items-stretch justify-start gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-3">
                        <div className="min-w-0">
                            <label className="flex select-none items-center gap-2 text-sm">
                                <input type="checkbox" checked={isDone} onChange={onToggleDone} disabled={busy} />
                                {lang === "es" ? "Hecho" : "Done"}
                            </label>

                            <input
                                id={inputId}
                                type="file"
                                accept="image/*,video/*"
                                multiple
                                className="hidden"
                                onChange={(e) => {
                                    const files = Array.from(e.target.files ?? []);
                                    e.target.value = "";
                                    onUploadFiles(files);
                                }}
                                disabled={busy}
                            />
                        </div>

                        <Button
                            variant="outline"
                            onClick={() => document.getElementById(inputId)?.click()}
                            disabled={busy || uploading}
                            className="w-full whitespace-nowrap sm:w-auto"
                        >
                            {lang === "es" ? "Subir media" : "Upload media"}
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="min-w-0 space-y-4">
                <div className="min-w-0 grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                    <div className="mb-2 flex min-w-0 flex-col justify-center gap-2 md:mb-0">
                        <div className="min-w-0 flex justify-between gap-3 md:mr-5">
                            <span className="shrink-0 font-extrabold text-muted-foreground">
                                {lang === "es" ? "Series planeadas" : "Planned sets"}
                            </span>
                            <span className="min-w-0 wrap-break-words text-right">{formatNullable(exercise.sets)}</span>
                        </div>
                        <div className="min-w-0 flex justify-between gap-3 md:mr-5">
                            <span className="shrink-0 font-extrabold text-muted-foreground">
                                {lang === "es" ? "Reps planeadas" : "Planned reps"}
                            </span>
                            <span className="min-w-0 wrap-break-words text-right">{formatNullable(exercise.reps)}</span>
                        </div>
                        <div className="min-w-0 flex justify-between gap-3 md:mr-5">
                            <span className="shrink-0 font-extrabold text-muted-foreground">
                                {lang === "es" ? "RPE planeado" : "Planned RPE"}
                            </span>
                            <span className="min-w-0 wrap-break-words text-right">{formatNullable(exercise.rpe)}</span>
                        </div>
                        <div className="min-w-0 flex justify-between gap-3 md:mr-5">
                            <span className="shrink-0 font-extrabold text-muted-foreground">
                                {lang === "es" ? "Carga planeada" : "Planned load"}
                            </span>
                            <span className="min-w-0 wrap-break-words text-right">{`${formatNullable(exercise.load)} ${unitLoad}`}</span>
                        </div>
                    </div>

                    <GymCheckExerciseMediaStrip
                        lang={lang}
                        mediaPublicIds={mediaPublicIds}
                        attachmentByPublicId={attachmentByPublicId}
                        onOpenViewer={onOpenViewer}
                        onRemoveAt={onRemoveMediaAt}
                    />
                </div>

                <div className="space-y-3 rounded-xl border p-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="font-semibold">
                                {lang === "es" ? "Sets ejecutados" : "Performed sets"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                {lang === "es"
                                    ? "Estos valores se guardarán en la sesión real."
                                    : "These values will be saved into the real session."}
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setPerformedSetsOpen((prev) => !prev)}
                                disabled={busy}
                            >
                                {performedSetsOpen
                                    ? lang === "es"
                                        ? "Ocultar sets"
                                        : "Hide sets"
                                    : lang === "es"
                                        ? "Mostrar sets"
                                        : "Show sets"}
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={onAddPerformedSet}
                                disabled={!canEditPerformedSets}
                            >
                                {lang === "es" ? "Agregar set" : "Add set"}
                            </Button>
                        </div>
                    </div>

                    {performedSetsOpen ? (
                        <div
                            className={cn(
                                "space-y-2 transition-opacity",
                                setsInputsDisabled && "opacity-60"
                            )}
                        >
                            {performedSets.map((setItem, setIndex) => (
                                <div
                                    key={`${exerciseId}-set-${setItem.setIndex}-${setIndex}`}
                                    className={cn(
                                        "grid grid-cols-1 gap-2 rounded-lg border p-3 sm:grid-cols-[80px_1fr_1fr_1fr_auto]",
                                        setsInputsDisabled && "bg-muted/40"
                                    )}
                                >
                                    <div className="flex items-center text-sm font-semibold">
                                        {lang === "es" ? `Set ${setItem.setIndex}` : `Set ${setItem.setIndex}`}
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs text-muted-foreground">
                                            {lang === "es" ? "Reps" : "Reps"}
                                        </label>
                                        <input
                                            type="number"
                                            min={0}
                                            step={1}
                                            inputMode="numeric"
                                            className={cn(
                                                "w-full rounded-md border bg-background px-3 py-2 text-sm",
                                                setsInputsDisabled &&
                                                "cursor-not-allowed bg-muted text-muted-foreground"
                                            )}
                                            value={numberToInputValue(setItem.reps)}
                                            onChange={(e) => {
                                                const value = e.target.value.trim();
                                                onChangePerformedSet(setIndex, {
                                                    reps: value === "" ? null : Math.trunc(Number(value)),
                                                });
                                            }}
                                            disabled={setsInputsDisabled}
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs text-muted-foreground">
                                            {lang === "es" ? `Carga (${unitLoad})` : `Load (${unitLoad})`}
                                        </label>
                                        <input
                                            type="number"
                                            min={0}
                                            step="0.1"
                                            inputMode="decimal"
                                            className={cn(
                                                "w-full rounded-md border bg-background px-3 py-2 text-sm",
                                                setsInputsDisabled &&
                                                "cursor-not-allowed bg-muted text-muted-foreground"
                                            )}
                                            value={numberToInputValue(setItem.weight)}
                                            onChange={(e) => {
                                                const value = e.target.value.trim();
                                                onChangePerformedSet(setIndex, {
                                                    weight: value === "" ? null : Number(value),
                                                    unit: unitLoad,
                                                });
                                            }}
                                            disabled={setsInputsDisabled}
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs text-muted-foreground">
                                            {lang === "es" ? "RPE" : "RPE"}
                                        </label>
                                        <input
                                            type="number"
                                            min={0}
                                            max={10}
                                            step="0.1"
                                            inputMode="decimal"
                                            className={cn(
                                                "w-full rounded-md border bg-background px-3 py-2 text-sm",
                                                setsInputsDisabled &&
                                                "cursor-not-allowed bg-muted text-muted-foreground"
                                            )}
                                            value={numberToInputValue(setItem.rpe)}
                                            onChange={(e) => {
                                                const value = e.target.value.trim();
                                                onChangePerformedSet(setIndex, {
                                                    rpe: value === "" ? null : Number(value),
                                                });
                                            }}
                                            disabled={setsInputsDisabled}
                                        />
                                    </div>

                                    <div className="flex items-end justify-end">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onRemovePerformedSet(setIndex)}
                                            disabled={setsInputsDisabled || performedSets.length <= 1}
                                        >
                                            {lang === "es" ? "Quitar" : "Remove"}
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
                            {lang === "es"
                                ? "La sección de sets reales inicia colapsada. Ábrela si necesitas editar los valores ejecutados."
                                : "The performed sets section starts collapsed. Expand it if you need to edit executed values."}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
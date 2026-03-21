// src/components/gymCheck/GymCheckExerciseCard.tsx

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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

    return (
        <Card className={isDone ? "opacity-95 w-full min-w-0" : "w-full min-w-0"}>
            <CardHeader className="pb-3 min-w-0">
                <div className="min-w-0 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                        <CardTitle className="text-base min-w-0 wrap-break-words">
                            {lang === "es" ? `Ejercicio #${index + 1}` : `Exercise #${index + 1}`}{" "}
                            <span className="text-muted-foreground">•</span>{" "}
                            <span className="font-semibold wrap-break-words">{formatNullable((exercise as any).name)}</span>
                        </CardTitle>

                        <CardDescription className="text-xs min-w-0 wrap-break-words">
                            {(exercise as any).notes
                                ? formatNullable((exercise as any).notes)
                                : lang === "es"
                                    ? "Sin notas"
                                    : "No notes"}
                        </CardDescription>
                    </div>

                    <div className="w-full sm:w-auto min-w-0 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-start sm:justify-end gap-2 sm:gap-3">
                        <div className="min-w-0">
                            <label className="text-sm flex items-center gap-2 select-none">
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
                            className="w-full sm:w-auto whitespace-nowrap"
                        >
                            {lang === "es" ? "Subir media" : "Upload media"}
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="min-w-0 space-y-4">
                <div className="min-w-0 grid text-sm gap-3 grid-cols-1 md:grid-cols-2">
                    <div className="min-w-0 flex flex-col gap-2 justify-center mb-2 md:mb-0">
                        <div className="min-w-0 flex justify-between gap-3 md:mr-5">
                            <span className="text-muted-foreground font-extrabold shrink-0">
                                {lang === "es" ? "Series planeadas" : "Planned sets"}
                            </span>
                            <span className="min-w-0 wrap-break-words text-right">{formatNullable((exercise as any).sets)}</span>
                        </div>
                        <div className="min-w-0 flex justify-between gap-3 md:mr-5">
                            <span className="text-muted-foreground font-extrabold shrink-0">
                                {lang === "es" ? "Reps planeadas" : "Planned reps"}
                            </span>
                            <span className="min-w-0 wrap-break-words text-right">{formatNullable((exercise as any).reps)}</span>
                        </div>
                        <div className="min-w-0 flex justify-between gap-3 md:mr-5">
                            <span className="text-muted-foreground font-extrabold shrink-0">
                                {lang === "es" ? "RPE planeado" : "Planned RPE"}
                            </span>
                            <span className="min-w-0 wrap-break-words text-right">{formatNullable((exercise).rpe)}</span>
                        </div>
                        <div className="min-w-0 flex justify-between gap-3 md:mr-5">
                            <span className="text-muted-foreground font-extrabold shrink-0">
                                {lang === "es" ? "Carga planeada" : "Planned load"}
                            </span>
                            <span className="min-w-0 wrap-break-words text-right">{`${formatNullable((exercise as any).load)} ${unitLoad}`}</span>
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

                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={onAddPerformedSet}
                            disabled={busy}
                        >
                            {lang === "es" ? "Agregar set" : "Add set"}
                        </Button>
                    </div>

                    <div className="space-y-2">
                        {performedSets.map((setItem, setIndex) => (
                            <div
                                key={`${exerciseId}-set-${setItem.setIndex}-${setIndex}`}
                                className="grid grid-cols-1 gap-2 rounded-lg border p-3 sm:grid-cols-[80px_1fr_1fr_1fr_auto]"
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
                                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                        value={numberToInputValue(setItem.reps)}
                                        onChange={(e) => {
                                            const value = e.target.value.trim();
                                            onChangePerformedSet(setIndex, {
                                                reps: value === "" ? null : Math.trunc(Number(value)),
                                            });
                                        }}
                                        disabled={busy}
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
                                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                        value={numberToInputValue(setItem.weight)}
                                        onChange={(e) => {
                                            const value = e.target.value.trim();
                                            onChangePerformedSet(setIndex, {
                                                weight: value === "" ? null : Number(value),
                                                unit: unitLoad,
                                            });
                                        }}
                                        disabled={busy}
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
                                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                        value={numberToInputValue(setItem.rpe)}
                                        onChange={(e) => {
                                            const value = e.target.value.trim();
                                            onChangePerformedSet(setIndex, {
                                                rpe: value === "" ? null : Number(value),
                                            });
                                        }}
                                        disabled={busy}
                                    />
                                </div>

                                <div className="flex items-end justify-end">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onRemovePerformedSet(setIndex)}
                                        disabled={busy || performedSets.length <= 1}
                                    >
                                        {lang === "es" ? "Quitar" : "Remove"}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
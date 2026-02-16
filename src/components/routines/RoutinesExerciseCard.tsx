import React from "react";
import { Button } from "@/components/ui/button";
import { ExerciseAttachmentPicker } from "@/components/routines/ExerciseAttachmentPicker";
import type { AttachmentOption } from "@/utils/routines/attachments";
import type { ExerciseItem, DayKey } from "@/utils/routines/plan";
import type { I18nKey } from "@/i18n/translations";
import { cn } from "@/lib/utils";

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

    // name is still editable
    onChangeName: (next: string) => void;

    // movement mapping
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
    const hasMovementMapping = !!exercise.movementId;

    return (
        <div
            className={cn(
                "rounded-xl border p-4 space-y-4 transition-colors shadow-sm",
                hasMovementMapping
                    ? "border-primary/30 bg-primary/5"
                    : "border-primary/30 bg-primary/5"
            )}
        >
            {/* Header ejercicio + botón eliminar */}
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <div className="text-sm font-medium">
                        {t("routines.exercise")} #{idx + 1}
                    </div>

                    <span className="inline-flex items-center rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[11px] font-mono text-primary">
                        {String(dayKey)}
                    </span>

                    {hasMovementMapping && exercise.movementName ? (
                        <span className="inline-flex items-center rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[11px] text-accent-foreground">
                            {lang === "es" ? "Catálogo" : "Catalog"} · {exercise.movementName}
                        </span>
                    ) : null}
                </div>

                <Button
                    variant="outline"
                    className="h-8 px-3 text-xs"
                    onClick={onRemove}
                    disabled={busy}
                >
                    {t("routines.remove")}
                </Button>
            </div>

            {/* Campos principales */}
            <div className="grid gap-3 md:grid-cols-2">
                {/* Movement selector */}
                <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-medium">
                        {lang === "es" ? "Movimiento" : "Movement"}
                    </label>

                    <select
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                        value={exercise.movementId ?? ""}
                        disabled={busy || !hasMovements}
                        onChange={(ev) => {
                            const nextId = ev.target.value || "";
                            if (!nextId) {
                                onChangeMovement({ movementId: undefined, movementName: undefined });
                                return;
                            }
                            const m = movementOptions!.find((x) => x.id === nextId);
                            const snap = m?.name ?? "";
                            onChangeMovement({ movementId: nextId, movementName: snap || undefined });
                            if (snap) onChangeName(snap);
                        }}
                    >
                        <option value="">
                            {hasMovements
                                ? lang === "es"
                                    ? "Seleccionar movimiento…"
                                    : "Select movement…"
                                : lang === "es"
                                    ? "No hay movimientos"
                                    : "No movements available"}
                        </option>

                        {hasMovements
                            ? movementOptions!.map((m) => (
                                <option key={m.id} value={m.id}>
                                    {m.name}
                                </option>
                            ))
                            : null}
                    </select>

                    {exercise.movementName ? (
                        <div className="text-[11px] text-muted-foreground">
                            {lang === "es" ? "Snapshot:" : "Snapshot:"}{" "}
                            <span className="font-mono">{exercise.movementName}</span>
                        </div>
                    ) : null}
                </div>

                {/* Name (editable) */}
                <div className="space-y-1">
                    <label className="text-xs font-medium">
                        {t("routines.exName")}
                    </label>
                    <input
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                        value={exercise.name}
                        onChange={(ev) => onChangeName(ev.target.value)}
                        disabled={busy}
                        placeholder={t("routines.exNamePh")}
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-medium">
                        {t("routines.exNotes")}
                    </label>
                    <input
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                        value={exercise.notes ?? ""}
                        onChange={(ev) => onChangeNotes(ev.target.value)}
                        disabled={busy}
                        placeholder={ph.exNotes}
                    />
                </div>

                {/* Sets / Reps / RPE / Load */}
                <div className="space-y-1">
                    <label className="text-xs font-medium">
                        {t("routines.sets")}
                    </label>
                    <input
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                        value={exercise.sets ?? ""}
                        onChange={(ev) => onChangeSets(ev.target.value)}
                        disabled={busy}
                        placeholder={ph.sets}
                        inputMode="numeric"
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-medium">
                        {t("routines.reps")}
                    </label>
                    <input
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                        value={exercise.reps ?? ""}
                        onChange={(ev) => onChangeReps(ev.target.value)}
                        disabled={busy}
                        placeholder={ph.reps}
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-medium">
                        {lang === "es" ? "RPE (planeado)" : "Planned RPE"}
                    </label>
                    <input
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                        value={exercise.rpe ?? ""}
                        onChange={(ev) => onChangeRpe(ev.target.value)}
                        disabled={busy}
                        placeholder={lang === "es" ? "Ej. 8" : "e.g. 8"}
                        inputMode="decimal"
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-medium">
                        {t("routines.load")}
                    </label>
                    <input
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                        value={exercise.load ?? ""}
                        onChange={(ev) => onChangeLoad(ev.target.value)}
                        disabled={busy}
                        placeholder={ph.load}
                    />
                </div>
            </div>

            {/* Attachments */}
            <ExerciseAttachmentPicker
                title={t("routines.exerciseAttachments")}
                emptyText={t("routines.noAttachmentsToLink")}
                hint={t("routines.attachmentsHint")}
                uploadAndAttachLabel={
                    lang === "es" ? "Seleccionar archivo(s)" : "Select file(s)"
                }
                attachmentOptions={attachmentOptions}
                selectedIds={selectedIds}
                pendingFiles={pendingFiles}
                onPickFiles={(files) =>
                    onPickFiles(Array.isArray(files) ? files : [])
                }
                onRemovePending={onRemovePending}
                busy={isThisUploading}
                disabled={busy}
                onToggle={onToggleAttachment}
            />
        </div>
    );
}

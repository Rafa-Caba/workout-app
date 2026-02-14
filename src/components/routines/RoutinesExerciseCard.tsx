import React from "react";
import { Button } from "@/components/ui/button";
import { ExerciseAttachmentPicker } from "@/components/routines/ExerciseAttachmentPicker";
import type { AttachmentOption } from "@/utils/routines/attachments";
import type { ExerciseItem, DayKey } from "@/utils/routines/plan";
import type { I18nKey } from "@/i18n/translations";

type TFn = (key: I18nKey) => string;

type Placeholders = {
    exNotes: string;
    sets: string;
    reps: string;
    load: string;
};

type Props = {
    dayKey: DayKey;
    idx: number;

    exercise: ExerciseItem;

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
    onChangeNotes: (next: string) => void;
    onChangeSets: (next: string) => void;
    onChangeReps: (next: string) => void;
    onChangeLoad: (next: string) => void;

    onToggleAttachment: (publicId: string) => void;
};

export function RoutinesExerciseCard({
    idx,
    exercise,
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
    onChangeNotes,
    onChangeSets,
    onChangeReps,
    onChangeLoad,
    onToggleAttachment,
}: Props) {
    return (
        <div className="rounded-lg border bg-background p-3 space-y-3">
            <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-medium">
                    {t("routines.exercise")} #{idx + 1}
                </div>
                <Button variant="outline" className="h-8 px-3" onClick={onRemove} disabled={busy}>
                    {t("routines.remove")}
                </Button>
            </div>

            <div className="grid gap-2 md:grid-cols-2">
                <div className="space-y-1">
                    <label className="text-xs font-medium">{t("routines.exName")}</label>
                    <input
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                        value={exercise.name}
                        onChange={(ev) => onChangeName(ev.target.value)}
                        disabled={busy}
                        placeholder={t("routines.exNamePh")}
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-medium">{t("routines.exNotes")}</label>
                    <input
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                        value={exercise.notes ?? ""}
                        onChange={(ev) => onChangeNotes(ev.target.value)}
                        disabled={busy}
                        placeholder={ph.exNotes}
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-medium">{t("routines.sets")}</label>
                    <input
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                        value={exercise.sets ?? ""}
                        onChange={(ev) => onChangeSets(ev.target.value)}
                        disabled={busy}
                        placeholder={ph.sets}
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-medium">{t("routines.reps")}</label>
                    <input
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                        value={exercise.reps ?? ""}
                        onChange={(ev) => onChangeReps(ev.target.value)}
                        disabled={busy}
                        placeholder={ph.reps}
                    />
                </div>

                <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-medium">{t("routines.load")}</label>
                    <input
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                        value={exercise.load ?? ""}
                        onChange={(ev) => onChangeLoad(ev.target.value)}
                        disabled={busy}
                        placeholder={ph.load}
                    />
                </div>
            </div>

            <ExerciseAttachmentPicker
                title={t("routines.exerciseAttachments")}
                emptyText={t("routines.noAttachmentsToLink")}
                hint={t("routines.attachmentsHint")}
                uploadAndAttachLabel={lang === "es" ? "Seleccionar archivo(s)" : "Select file(s)"}
                attachmentOptions={attachmentOptions}
                selectedIds={selectedIds}
                pendingFiles={pendingFiles}
                onPickFiles={(files) => onPickFiles(Array.isArray(files) ? files : [])}
                onRemovePending={onRemovePending}
                busy={isThisUploading}
                disabled={busy}
                onToggle={onToggleAttachment}
            />
        </div>
    );
}

import React from "react";
import { Button } from "@/components/ui/button";
import { RoutinesExerciseCard } from "@/components/routines/RoutinesExerciseCard";
import type { AttachmentOption } from "@/utils/routines/attachments";
import type { DayPlan, DayKey, ExerciseItem } from "@/utils/routines/plan";
import type { I18nKey } from "@/i18n/translations";

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

    attachmentOptions: AttachmentOption[];

    exerciseUploadBusy: boolean;
    uploadingExercise: { dayKey: DayKey; exerciseId: string } | null;

    // ✅ pending is exerciseId-based
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

    return (
        <div className="rounded-xl border bg-card p-4 space-y-4">
            <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-semibold">
                    {t("routines.day")} <span className="font-mono">{activePlan.dayKey}</span>
                </div>
                <Button
                    variant="outline"
                    className="h-8 px-3"
                    onClick={() => onAddExercise(activePlan.dayKey as DayKey)}
                    disabled={busy}
                >
                    {t("routines.addExercise")}
                </Button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                    <label className="text-xs font-medium">{t("routines.sessionType")}</label>
                    <input
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                        value={activePlan.sessionType ?? ""}
                        onChange={(e) => onUpdatePlan(activePlan.dayKey as DayKey, { sessionType: e.target.value || undefined })}
                        disabled={busy}
                        placeholder={ph.sessionType}
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-medium">{t("routines.focus")}</label>
                    <input
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                        value={activePlan.focus ?? ""}
                        onChange={(e) => onUpdatePlan(activePlan.dayKey as DayKey, { focus: e.target.value || undefined })}
                        disabled={busy}
                        placeholder={ph.focus}
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-medium">{t("routines.tagsCsv")}</label>
                    <input
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                        value={(activePlan.tags ?? []).join(", ")}
                        onChange={(e) =>
                            onUpdatePlan(activePlan.dayKey as DayKey, {
                                tags: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                            })
                        }
                        disabled={busy}
                        placeholder={ph.tags}
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-medium">{t("routines.notes")}</label>
                    <input
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                        value={activePlan.notes ?? ""}
                        onChange={(e) => onUpdatePlan(activePlan.dayKey as DayKey, { notes: e.target.value || undefined })}
                        disabled={busy}
                        placeholder={ph.notes}
                    />
                </div>
            </div>

            <div className="space-y-3">
                {exercises.map((ex, idx) => {
                    const exerciseId = ex.id; // MUST exist
                    const selectedIds = Array.isArray(ex.attachmentPublicIds) ? ex.attachmentPublicIds : [];

                    const isThisUploading =
                        exerciseUploadBusy &&
                        uploadingExercise?.dayKey === (activePlan.dayKey as DayKey) &&
                        uploadingExercise?.exerciseId === exerciseId;

                    const pendingFiles = getPendingFilesForExercise(exerciseId);

                    return (
                        <RoutinesExerciseCard
                            key={exerciseId}
                            dayKey={activePlan.dayKey as DayKey}
                            idx={idx}
                            exercise={ex}
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
                            onRemove={() => onRemoveExercise(activePlan.dayKey as DayKey, idx)}
                            onChangeName={(next) => onUpdateExercise(activePlan.dayKey as DayKey, idx, { name: next })}
                            onChangeNotes={(next) => onUpdateExercise(activePlan.dayKey as DayKey, idx, { notes: next || undefined })}
                            onChangeSets={(next) => onUpdateExercise(activePlan.dayKey as DayKey, idx, { sets: next || undefined })}
                            onChangeReps={(next) => onUpdateExercise(activePlan.dayKey as DayKey, idx, { reps: next || undefined })}
                            onChangeLoad={(next) => onUpdateExercise(activePlan.dayKey as DayKey, idx, { load: next || undefined })}
                            onToggleAttachment={(publicId) => {
                                const curr = new Set(selectedIds);
                                if (curr.has(publicId)) curr.delete(publicId);
                                else curr.add(publicId);

                                onUpdateExercise(activePlan.dayKey as DayKey, idx, {
                                    attachmentPublicIds: Array.from(curr),
                                });
                            }}
                        />
                    );
                })}
            </div>
        </div>
    );
}

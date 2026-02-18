import React from "react";
import { Button } from "@/components/ui/button";
import type { I18nKey } from "@/i18n/translations";
import type { AttachmentOption } from "@/utils/routines/attachments";
import type { DayKey, DayPlan, ExerciseItem } from "@/utils/routines/plan";
import type { RoutineUpsertBody } from "@/utils/routines/putBody";
import { RoutinesDayEditor } from "@/components/routines/RoutinesDayEditor";
import { useSettingsStore } from "@/state/settings.store";
import { MovementOption } from "./RoutinesExerciseCard";
import { cn } from "@/lib/utils";

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

type DayTabItem = { dayKey: DayKey; label: string };
type SplitPreset = { value: string; labelKey: I18nKey };

type Props = {
    t: TFn;
    lang: string;
    busy: boolean;
    isSaving: boolean;

    onSave: () => void;

    putBody: RoutineUpsertBody;
    onChangeTitle: (next: string) => void;

    splitPreset: string;
    splitCustom: string;
    splitPresets: SplitPreset[];
    onChangeSplitPreset: (next: string) => void;
    onChangeSplitCustom: (next: string) => void;

    dayKeys: readonly DayKey[];
    onTogglePlannedDay: (dayKey: string) => void;

    planBuilderTitle: string;
    planBuilderHint: string;

    dayTabItems: DayTabItem[];
    activeDay: DayKey;
    onSelectDay: (dayKey: DayKey) => void;

    activePlan: DayPlan;
    attachmentOptions: AttachmentOption[];

    exerciseUploadBusy: boolean;
    uploadingExercise: { dayKey: DayKey; exerciseId: string } | null;

    // pending is exerciseId-based
    getPendingExerciseFiles: (exerciseId: string) => File[];
    onAddPendingExerciseFiles: (exerciseId: string, files: File[]) => void;
    onClearPendingExerciseFiles: (exerciseId: string, fileIndex?: number) => void;

    onAddExercise: (dayKey: DayKey) => void;
    onRemoveExercise: (dayKey: DayKey, idx: number) => void;
    onUpdatePlan: (dayKey: DayKey, patch: Partial<DayPlan>) => void;
    onUpdateExercise: (dayKey: DayKey, idx: number, patch: Partial<ExerciseItem>) => void;

    movementOptions?: MovementOption[];

    ph: Placeholders;

    debugPutBodyTitle: string;
    debugPutBodyData: unknown;

    debugPlansTitle: string;
    plans: DayPlan[];
};

export function RoutinesPutForm({
    t,
    lang,
    busy,
    isSaving,
    onSave,
    putBody,
    onChangeTitle,
    splitPreset,
    splitCustom,
    splitPresets,
    onChangeSplitPreset,
    onChangeSplitCustom,
    dayKeys,
    onTogglePlannedDay,
    planBuilderTitle,
    planBuilderHint,
    dayTabItems,
    activeDay,
    onSelectDay,
    activePlan,
    attachmentOptions,
    exerciseUploadBusy,
    uploadingExercise,
    getPendingExerciseFiles,
    onAddPendingExerciseFiles,
    onClearPendingExerciseFiles,
    onAddExercise,
    onRemoveExercise,
    onUpdatePlan,
    onUpdateExercise,
    ph,
    debugPutBodyTitle,
    debugPutBodyData,
    debugPlansTitle,
    plans,
    movementOptions,
}: Props) {
    const showJson = useSettingsStore((s) => s.settings.debug.showJson);

    const planned = (putBody.plannedDays ?? []) as string[];

    return (
        <div className="w-full min-w-0 space-y-4">
            {/* Meta / header card */}
            <div className="w-full min-w-0 rounded-xl border bg-primary/5 border-primary/10 p-4 space-y-4">
                <div className="min-w-0 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                        <div className="text-sm font-semibold wrap-break-words">
                            {lang === "es" ? "Editor de rutina" : "Routine editor"}
                        </div>
                        <div className="text-xs text-muted-foreground wrap-break-words">
                            {lang === "es" ? "Edita el plan por día y guarda con PUT." : "Edit day plan and save with PUT."}
                        </div>
                    </div>

                    <Button
                        onClick={onSave}
                        disabled={busy || isSaving}
                        className="h-9 w-full sm:w-auto whitespace-nowrap"
                    >
                        {lang === "es" ? "Guardar (PUT)" : "Save (PUT)"}
                    </Button>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                    {/* Title */}
                    <div className="space-y-1 min-w-0">
                        <label className="text-xs font-medium">{t("routines.titleField")}</label>
                        <input
                            className="w-full rounded-md border bg-background px-3 py-2 text-base sm:text-sm"
                            value={putBody.title ?? ""}
                            onChange={(e) => onChangeTitle(e.target.value)}
                            disabled={busy}
                            placeholder={lang === "es" ? "Título" : "Title"}
                        />
                    </div>

                    {/* Split preset + custom */}
                    <div className="grid gap-2 min-w-0">
                        <div className="space-y-1 min-w-0">
                            <label className="text-xs font-medium">{t("routines.splitField")}</label>
                            <select
                                className="w-full rounded-md border bg-background px-3 py-2 text-base sm:text-sm"
                                value={splitPreset}
                                onChange={(e) => onChangeSplitPreset(e.target.value)}
                                disabled={busy}
                            >
                                {splitPresets.map((p) => (
                                    <option key={p.value} value={p.value}>
                                        {t(p.labelKey)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1 min-w-0">
                            <input
                                className="w-full rounded-md border bg-background px-3 py-2 text-base sm:text-sm"
                                value={splitCustom}
                                onChange={(e) => onChangeSplitCustom(e.target.value)}
                                disabled={busy}
                                placeholder={lang === "es" ? "Split personalizado (opcional)" : "Custom split (optional)"}
                            />
                        </div>
                    </div>
                </div>

                {/* Planned days */}
                <div className="space-y-2 min-w-0">
                    <div className="text-xs font-medium">{t("routines.plannedDays")}</div>
                    <div className="flex flex-wrap gap-2">
                        {dayKeys.map((d) => {
                            const checked = planned.includes(d);
                            return (
                                <label
                                    key={d}
                                    className={cn(
                                        "inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm bg-background transition-colors",
                                        checked && "border-primary/40 bg-primary/8 text-primary"
                                    )}
                                >
                                    <input type="checkbox" checked={checked} onChange={() => onTogglePlannedDay(d)} disabled={busy} />
                                    <span className="font-mono">{d}</span>
                                </label>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Plan builder + day editor */}
            <div className="w-full min-w-0 rounded-xl border bg-accent/10 border-accent/50 p-4 space-y-3">
                <div className="min-w-0">
                    <div className="text-sm font-semibold wrap-break-words">{planBuilderTitle}</div>
                    <div className="text-xs text-muted-foreground wrap-break-words">{planBuilderHint}</div>
                </div>

                {/* Day tabs */}
                <div className="-mx-1 px-1 overflow-x-auto">
                    <div className="flex items-center gap-2 w-max">
                        {dayTabItems.map((d) => (
                            <Button
                                key={d.dayKey}
                                type="button"
                                variant={d.dayKey === activeDay ? "default" : "outline"}
                                className="h-8 whitespace-nowrap"
                                onClick={() => onSelectDay(d.dayKey)}
                                disabled={busy}
                            >
                                {d.label}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Day editor */}
                <RoutinesDayEditor
                    activePlan={activePlan}
                    busy={busy}
                    t={t}
                    lang={lang}
                    ph={ph}
                    attachmentOptions={attachmentOptions}
                    exerciseUploadBusy={exerciseUploadBusy}
                    uploadingExercise={uploadingExercise}
                    getPendingFilesForExercise={(exerciseId) => getPendingExerciseFiles(exerciseId)}
                    onPickFilesForExercise={(exerciseId, files) => onAddPendingExerciseFiles(exerciseId, files)}
                    onRemovePendingForExercise={(exerciseId, fileIndex) => onClearPendingExerciseFiles(exerciseId, fileIndex)}
                    onAddExercise={onAddExercise}
                    onRemoveExercise={onRemoveExercise}
                    onUpdatePlan={onUpdatePlan}
                    onUpdateExercise={onUpdateExercise}
                    movementOptions={movementOptions}
                />
            </div>

            {/* Debug JSON blocks */}
            {showJson && (
                <>
                    <details className="w-full min-w-0 rounded-xl border bg-card p-4">
                        <summary className="cursor-pointer select-none text-sm font-semibold">{debugPutBodyTitle}</summary>
                        <pre className="mt-3 whitespace-pre-wrap wrap-break-words text-xs text-muted-foreground">
                            {typeof debugPutBodyData === "string"
                                ? debugPutBodyData
                                : JSON.stringify(debugPutBodyData, null, 2)}
                        </pre>
                    </details>

                    <details className="w-full min-w-0 rounded-xl border bg-card p-4">
                        <summary className="cursor-pointer select-none text-sm font-semibold">{debugPlansTitle}</summary>
                        <pre className="mt-3 whitespace-pre-wrap wrap-break-words text-xs text-muted-foreground">
                            {JSON.stringify(plans, null, 2)}
                        </pre>
                    </details>
                </>
            )}
        </div>
    );
}

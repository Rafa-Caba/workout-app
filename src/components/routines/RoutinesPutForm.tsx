// src/components/routines/RoutinesPutForm.tsx
// MUI routine form editor wrapper. Business logic stays in page/hooks/utils.

import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import type { I18nKey } from "@/i18n/translations";
import type { AttachmentOption } from "@/utils/routines/attachments";
import type { DayKey, DayPlan, ExerciseItem } from "@/utils/routines/plan";
import type { RoutineUpsertBody } from "@/utils/routines/putBody";
import { RoutinesDayEditor } from "@/components/routines/RoutinesDayEditor";
import { useSettingsStore } from "@/state/settings.store";
import { type MovementOption } from "./RoutinesExerciseCard";
import { AppActionRow, AppCard, AppFormGrid, AppResponsiveTabs } from "@/components/mui";

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
    scrollRootEl?: HTMLElement | null;
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
        <Box sx={{ display: "grid", gap: { xs: 1.5, md: 2.25 } }}>
            <AppCard
                title={lang === "es" ? "Editor de rutina" : "Routine editor"}
                subtitle={lang === "es" ? "Edita el plan por día y guarda con PUT." : "Edit day plan and save with PUT."}
                tone="accent"
                action={<Button onClick={onSave} disabled={busy || isSaving} variant="contained">{lang === "es" ? "Guardar" : "Save"}</Button>}
            >
                <AppFormGrid columns={{ xs: 1, md: 2 }} gap={1.5}>
                    <TextField
                        fullWidth
                        size="small"
                        label={t("routines.titleField")}
                        value={putBody.title ?? ""}
                        onChange={(event) => onChangeTitle(event.target.value)}
                        disabled={busy}
                        placeholder={lang === "es" ? "Título" : "Title"}
                    />
                    <Box sx={{ display: "grid", gap: 1 }}>
                        <TextField
                            fullWidth
                            select
                            size="small"
                            label={t("routines.splitField")}
                            value={splitPreset}
                            onChange={(event) => onChangeSplitPreset(event.target.value)}
                            disabled={busy}
                        >
                            {splitPresets.map((preset) => (
                                <MenuItem key={preset.value} value={preset.value}>
                                    {t(preset.labelKey)}
                                </MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            fullWidth
                            size="small"
                            value={splitCustom}
                            onChange={(event) => onChangeSplitCustom(event.target.value)}
                            disabled={busy}
                            placeholder={lang === "es" ? "Split personalizado (opcional)" : "Custom split (optional)"}
                        />
                    </Box>
                </AppFormGrid>

                <Box sx={{ mt: 1.5 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.75, fontWeight: 800 }}>
                        {t("routines.plannedDays")}
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                        {dayKeys.map((dayKey) => {
                            const checked = planned.includes(dayKey);
                            return (
                                <FormControlLabel
                                    key={dayKey}
                                    control={<Checkbox checked={checked} onChange={() => onTogglePlannedDay(dayKey)} disabled={busy} size="small" />}
                                    label={<Typography component="span" variant="body2" sx={{ fontFamily: "monospace", fontWeight: 800 }}>{dayKey}</Typography>}
                                    sx={{ border: 1, borderColor: checked ? "primary.main" : "divider", borderRadius: 2, px: 1, m: 0, bgcolor: checked ? "action.selected" : "background.paper" }}
                                />
                            );
                        })}
                    </Box>
                </Box>
            </AppCard>

            <AppCard title={planBuilderTitle} subtitle={planBuilderHint}>
                <AppResponsiveTabs
                    ariaLabel="Routine editor day tabs"
                    value={activeDay}
                    onChange={(value) => onSelectDay(value as DayKey)}
                    tabs={dayTabItems.map((item) => ({ value: item.dayKey, label: item.label, disabled: busy }))}
                    sx={{ borderBottom: 0, mb: 1.5 }}
                />

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

                <AppActionRow align="right" sx={{ mt: 1.5 }}>
                    <Button type="button" onClick={onSave} disabled={busy || isSaving} variant="contained">
                        {lang === "es" ? "Guardar" : "Save"}
                    </Button>
                </AppActionRow>
            </AppCard>

            {showJson ? (
                <>
                    <AppCard title={debugPutBodyTitle} padding="sm">
                        <Box component="pre" sx={{ m: 0, whiteSpace: "pre-wrap", overflow: "auto", color: "text.secondary", fontSize: 12 }}>
                            {typeof debugPutBodyData === "string" ? debugPutBodyData : JSON.stringify(debugPutBodyData, null, 2)}
                        </Box>
                    </AppCard>
                    <AppCard title={debugPlansTitle} padding="sm">
                        <Box component="pre" sx={{ m: 0, whiteSpace: "pre-wrap", overflow: "auto", color: "text.secondary", fontSize: 12 }}>
                            {JSON.stringify(plans, null, 2)}
                        </Box>
                    </AppCard>
                </>
            ) : null}
        </Box>
    );
}

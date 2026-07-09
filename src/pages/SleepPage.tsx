// src/pages/SleepPage.tsx
// MUI Sleep editor page. Keeps the existing sleep hooks and backend contract,
// while migrating the visible form, toolbar, and summary cards to MUI.

import React from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import type { ApiError } from "@/api/httpErrors";
import { JsonDetails } from "@/components/JsonDetails";
import { useI18n } from "@/i18n/I18nProvider";
import { useWorkoutDay } from "@/hooks/useWorkoutDay";
import { useUpdateSleep } from "@/hooks/useUpdateSleep";
import type {
    SleepBlock,
    WorkoutDataSource,
    WorkoutSourceDevice,
} from "@/types/workoutDay.types";
import { calcSleepEfficiencyPct } from "@/utils/dayExplorer";
import { DeviceSelect } from "@/components/DeviceSelect";
import {
    AppActionRow,
    AppCard,
    AppEmptyState,
    AppFormGrid,
    AppMetricCard,
    AppPage,
    AppToolbar,
} from "@/components/mui";

function toastApiError(e: unknown, fallback: string) {
    const err = e as Partial<ApiError> | undefined;
    const msg = err?.message ?? fallback;
    const details = err?.details ? JSON.stringify(err.details, null, 2) : undefined;
    toast.error(msg, { description: details });
}

function minutesToHhMm(mins: number | null): string {
    if (mins == null || !Number.isFinite(mins)) return "—";
    const h = Math.floor(mins / 60);
    const m = Math.max(0, mins - h * 60);
    return `${h}h ${m}m`;
}

function numOrEmpty(v: number | null | undefined): string {
    return typeof v === "number" && Number.isFinite(v) ? String(v) : "";
}

function parseNullableInt(v: string): number | null {
    const s = v.trim();
    if (!s) return null;
    const n = Number(s);
    if (!Number.isFinite(n)) return null;
    return Math.max(0, Math.trunc(n));
}

function parseNullableScore(v: string): number | null {
    const n = parseNullableInt(v);
    if (n === null) return null;
    return Math.max(0, Math.min(100, n));
}

function formatPercent(p: number | null): string {
    if (typeof p !== "number" || !Number.isFinite(p)) return "—";
    return `${Math.round(p)}%`;
}

function normalizeWorkoutDataSource(value: string | null): WorkoutDataSource | null {
    if (value === "manual" || value === "healthkit" || value === "health-connect") {
        return value;
    }

    return null;
}

function createEmptySleepBlock(): SleepBlock {
    return {
        timeAsleepMinutes: null,
        timeInBedMinutes: null,
        score: null,
        awakeMinutes: null,
        remMinutes: null,
        coreMinutes: null,
        deepMinutes: null,
        source: null,
        sourceDevice: null,
        importedAt: null,
        lastSyncedAt: null,
        raw: null,
    };
}

function NumericSleepField({
    label,
    helper,
    value,
    placeholder,
    onChange,
}: {
    label: string;
    helper?: string;
    value: number | null;
    placeholder?: string;
    onChange: (next: string) => void;
}) {
    return (
        <TextField
            fullWidth
            label={label}
            value={numOrEmpty(value)}
            placeholder={placeholder}
            onChange={(event) => onChange(event.target.value)}
            helperText={helper}
            type="number"
        />
    );
}

export function SleepPage() {
    const { t } = useI18n();
    const today = React.useMemo(() => new Date(), []);
    const [date, setDate] = React.useState(() => format(today, "yyyy-MM-dd"));

    const query = useWorkoutDay(date, true);
    const updateSleep = useUpdateSleep();

    const [form, setForm] = React.useState<SleepBlock>(createEmptySleepBlock);

    React.useEffect(() => {
        const day = query.data ?? null;
        const sleep = day?.sleep ?? null;

        setForm({
            timeAsleepMinutes: sleep?.timeAsleepMinutes ?? null,
            timeInBedMinutes: sleep?.timeInBedMinutes ?? null,
            score: sleep?.score ?? null,

            awakeMinutes: sleep?.awakeMinutes ?? null,
            remMinutes: sleep?.remMinutes ?? null,
            coreMinutes: sleep?.coreMinutes ?? null,
            deepMinutes: sleep?.deepMinutes ?? null,

            source: sleep?.source ?? null,
            sourceDevice: sleep?.sourceDevice ?? null,
            importedAt: sleep?.importedAt ?? null,
            lastSyncedAt: sleep?.lastSyncedAt ?? null,

            raw: sleep?.raw ?? null,
        });
    }, [query.data]);

    React.useEffect(() => {
        if (query.isError) toastApiError(query.error, t("sleep.toast.loadFail"));
    }, [query.isError, query.error, t]);

    React.useEffect(() => {
        if (updateSleep.isError) toastApiError(updateSleep.error, t("sleep.toast.saveFail"));
    }, [updateSleep.isError, updateSleep.error, t]);

    const isSaving = updateSleep.isPending;

    const total = form.timeAsleepMinutes ?? null;
    const inBed = form.timeInBedMinutes ?? null;
    const score = form.score ?? null;

    const stageSum =
        (form.awakeMinutes ?? 0) +
        (form.remMinutes ?? 0) +
        (form.coreMinutes ?? 0) +
        (form.deepMinutes ?? 0);

    const efficiencyPct = calcSleepEfficiencyPct(form.timeAsleepMinutes, form.timeInBedMinutes);

    const hasAnySleepValue =
        form.timeAsleepMinutes != null ||
        form.timeInBedMinutes != null ||
        form.score != null ||
        form.awakeMinutes != null ||
        form.remMinutes != null ||
        form.coreMinutes != null ||
        form.deepMinutes != null ||
        form.source != null ||
        form.sourceDevice != null;

    const onSave = async () => {
        try {
            await updateSleep.mutateAsync({ date, sleep: form });
            toast.success(t("sleep.toast.saved"));
        } catch {
            // handled by effect
        }
    };

    const onClear = async () => {
        try {
            await updateSleep.mutateAsync({ date, sleep: null });
            toast.success(t("sleep.toast.cleared"));
        } catch {
            // handled by effect
        }
    };

    return (
        <AppPage
            maxWidth="xl"
            title={t("sleep.title")}
            subtitle={t("sleep.subtitle")}
            actions={
                <AppActionRow dense>
                    <Button
                        variant="outlined"
                        onClick={() => query.refetch()}
                        disabled={query.isFetching || isSaving}
                    >
                        {t("common.refetch")}
                    </Button>
                    <Button
                        variant="contained"
                        onClick={onSave}
                        disabled={query.isFetching || isSaving}
                    >
                        {isSaving ? t("common.saving") : t("common.save")}
                    </Button>
                </AppActionRow>
            }
        >
            <AppToolbar
                dense
                start={
                    <TextField
                        label={t("common.date")}
                        type="date"
                        value={date}
                        onChange={(event) => setDate(event.target.value)}
                        sx={{ width: { xs: "100%", sm: 220 } }}
                    />
                }
                end={
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: {
                                xs: "repeat(2, minmax(0, 1fr))",
                                md: "repeat(5, minmax(120px, auto))",
                            },
                            gap: 1,
                            width: "100%",
                        }}
                    >
                        <AppMetricCard compact label={t("sleep.summary.timeAsleep")} value={minutesToHhMm(total)} />
                        <AppMetricCard compact label={t("sleep.summary.timeInBed")} value={minutesToHhMm(inBed)} />
                        <AppMetricCard compact label={t("sleep.summary.efficiency")} value={formatPercent(efficiencyPct)} />
                        <AppMetricCard compact label={t("sleep.summary.score")} value={score == null ? "—" : score} />
                        <AppMetricCard compact label={t("sleep.summary.stagesSum")} value={stageSum > 0 ? `${stageSum} min` : "—"} />
                    </Box>
                }
            />

            {query.isFetching ? (
                <Alert severity="info" variant="outlined">
                    {t("common.fetching")}
                </Alert>
            ) : null}

            {query.isError ? (
                <JsonDetails title={t("sleep.errorJsonTitle")} data={query.error} defaultOpen />
            ) : null}

            {query.isSuccess && !hasAnySleepValue ? (
                <AppEmptyState title={t("sleep.empty.title")} description={t("sleep.empty.desc")} />
            ) : null}

            <AppCard title={t("sleep.title")} subtitle={t("sleep.subtitle")}>
                <AppFormGrid columns={{ xs: 2, sm: 2, lg: 4 }}>
                    <NumericSleepField
                        label={t("sleep.fields.timeAsleepMinutes")}
                        helper={t("sleep.hints.timeAsleepMinutes")}
                        placeholder="e.g. 420"
                        value={form.timeAsleepMinutes}
                        onChange={(next) =>
                            setForm((previous) => ({
                                ...previous,
                                timeAsleepMinutes: parseNullableInt(next),
                            }))
                        }
                    />

                    <NumericSleepField
                        label={t("sleep.fields.timeInBedMinutes")}
                        helper={t("sleep.hints.timeInBedMinutes")}
                        placeholder="e.g. 480"
                        value={form.timeInBedMinutes}
                        onChange={(next) =>
                            setForm((previous) => ({
                                ...previous,
                                timeInBedMinutes: parseNullableInt(next),
                            }))
                        }
                    />

                    <NumericSleepField
                        label={t("sleep.fields.score")}
                        helper={t("sleep.hints.score")}
                        placeholder="0-100"
                        value={form.score}
                        onChange={(next) =>
                            setForm((previous) => ({
                                ...previous,
                                score: parseNullableScore(next),
                            }))
                        }
                    />

                    <NumericSleepField
                        label={t("sleep.fields.awakeMinutes")}
                        value={form.awakeMinutes}
                        onChange={(next) =>
                            setForm((previous) => ({
                                ...previous,
                                awakeMinutes: parseNullableInt(next),
                            }))
                        }
                    />

                    <NumericSleepField
                        label={t("sleep.fields.remMinutes")}
                        value={form.remMinutes}
                        onChange={(next) =>
                            setForm((previous) => ({
                                ...previous,
                                remMinutes: parseNullableInt(next),
                            }))
                        }
                    />

                    <NumericSleepField
                        label={t("sleep.fields.coreMinutes")}
                        value={form.coreMinutes}
                        onChange={(next) =>
                            setForm((previous) => ({
                                ...previous,
                                coreMinutes: parseNullableInt(next),
                            }))
                        }
                    />

                    <NumericSleepField
                        label={t("sleep.fields.deepMinutes")}
                        value={form.deepMinutes}
                        onChange={(next) =>
                            setForm((previous) => ({
                                ...previous,
                                deepMinutes: parseNullableInt(next),
                            }))
                        }
                    />

                    <TextField
                        select
                        fullWidth
                        label={t("sleep.fields.source")}
                        value={form.source ?? ""}
                        onChange={(event) =>
                            setForm((previous) => ({
                                ...previous,
                                source: normalizeWorkoutDataSource(event.target.value || null),
                            }))
                        }
                    >
                        <MenuItem value="">{t("sleep.placeholders.source")}</MenuItem>
                        <MenuItem value="manual">manual</MenuItem>
                        <MenuItem value="healthkit">healthkit</MenuItem>
                        <MenuItem value="health-connect">health-connect</MenuItem>
                    </TextField>

                    <Box sx={{ gridColumn: { xs: "span 2", sm: "span 2", lg: "span 2" } }}>
                        <DeviceSelect
                            t={t}
                            value={form.sourceDevice}
                            onChange={(value) =>
                                setForm((previous) => ({
                                    ...previous,
                                    sourceDevice: (value ?? null) as WorkoutSourceDevice | null,
                                }))
                            }
                        />
                    </Box>
                </AppFormGrid>

                <AppActionRow sx={{ mt: 2 }} dense>
                    <Button
                        variant="outlined"
                        color="error"
                        onClick={onClear}
                        disabled={query.isFetching || isSaving}
                    >
                        {t("sleep.clear")}
                    </Button>
                    <Button
                        variant="contained"
                        onClick={onSave}
                        disabled={query.isFetching || isSaving}
                    >
                        {isSaving ? t("common.saving") : t("common.save")}
                    </Button>
                </AppActionRow>
            </AppCard>

            {query.isSuccess ? (
                <JsonDetails title={t("sleep.debugJsonTitle")} data={query.data} />
            ) : null}
        </AppPage>
    );
}

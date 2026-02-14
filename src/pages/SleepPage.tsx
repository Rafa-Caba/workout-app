import React from "react";
import { format } from "date-fns";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { ApiError } from "@/api/httpErrors";

import { PageHeader } from "@/components/PageHeader";
import { JsonDetails } from "@/components/JsonDetails";
import { EmptyState } from "@/components/EmptyState";

import { useI18n } from "@/i18n/I18nProvider";
import { useWorkoutDay } from "@/hooks/useWorkoutDay";
import { useUpdateSleep } from "@/hooks/useUpdateSleep";

import type { SleepBlock } from "@/types/workoutDay.types";

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

export function SleepPage() {
    const { t } = useI18n();
    const today = React.useMemo(() => new Date(), []);
    const [date, setDate] = React.useState(() => format(today, "yyyy-MM-dd"));

    const query = useWorkoutDay(date, true);
    const updateSleep = useUpdateSleep();

    const [form, setForm] = React.useState<SleepBlock>({
        timeAsleepMinutes: null,
        score: null,

        awakeMinutes: null,
        remMinutes: null,
        coreMinutes: null,
        deepMinutes: null,

        source: null,
        raw: null,
    });

    // Hydrate form when day changes / loads
    React.useEffect(() => {
        const day = query.data ?? null;
        const sleep = day?.sleep ?? null;

        setForm({
            timeAsleepMinutes: sleep?.timeAsleepMinutes ?? null,
            score: sleep?.score ?? null,

            awakeMinutes: sleep?.awakeMinutes ?? null,
            remMinutes: sleep?.remMinutes ?? null,
            coreMinutes: sleep?.coreMinutes ?? null,
            deepMinutes: sleep?.deepMinutes ?? null,

            source: sleep?.source ?? null,
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
    const score = form.score ?? null;

    const stageSum =
        (form.awakeMinutes ?? 0) + (form.remMinutes ?? 0) + (form.coreMinutes ?? 0) + (form.deepMinutes ?? 0);

    const hasAnySleepValue =
        form.timeAsleepMinutes != null ||
        form.score != null ||
        form.awakeMinutes != null ||
        form.remMinutes != null ||
        form.coreMinutes != null ||
        form.deepMinutes != null ||
        (form.source ?? null) != null;

    const onSave = async () => {
        try {
            await updateSleep.mutateAsync({ date, sleep: form });
            toast.success(t("sleep.toast.saved"));
        } catch (e) {
            // handled by effect
        }
    };

    const onClear = async () => {
        try {
            await updateSleep.mutateAsync({ date, sleep: null });
            toast.success(t("sleep.toast.cleared"));
        } catch (e) {
            // handled by effect
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title={t("sleep.title")}
                subtitle={t("sleep.subtitle")}
                right={
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => query.refetch()} disabled={query.isFetching || isSaving}>
                            {t("common.refetch")}
                        </Button>

                        <Button onClick={onSave} disabled={query.isFetching || isSaving}>
                            {isSaving ? t("common.saving") : t("common.save")}
                        </Button>
                    </div>
                }
            />

            <div className="rounded-xl border bg-card p-4">
                <div className="flex flex-wrap items-end gap-3">
                    <div className="space-y-1">
                        <label className="text-sm font-medium">{t("common.date")}</label>
                        <input
                            type="date"
                            className="rounded-md border bg-background px-3 py-2 text-sm"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </div>

                    <div className="ml-auto flex flex-wrap items-center gap-2">
                        <div className="rounded-lg border bg-background px-3 py-2 text-sm">
                            <div className="text-xs text-muted-foreground">{t("sleep.summary.timeAsleep")}</div>
                            <div className="font-mono">{minutesToHhMm(total)}</div>
                        </div>

                        <div className="rounded-lg border bg-background px-3 py-2 text-sm">
                            <div className="text-xs text-muted-foreground">{t("sleep.summary.score")}</div>
                            <div className="font-mono">{score == null ? "—" : score}</div>
                        </div>

                        <div className="rounded-lg border bg-background px-3 py-2 text-sm">
                            <div className="text-xs text-muted-foreground">{t("sleep.summary.stagesSum")}</div>
                            <div className="font-mono">{stageSum > 0 ? `${stageSum} min` : "—"}</div>
                        </div>

                        <Button variant="outline" onClick={onClear} disabled={query.isFetching || isSaving}>
                            {t("sleep.clear")}
                        </Button>
                    </div>
                </div>
            </div>

            {query.isFetching ? (
                <div className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">{t("common.fetching")}</div>
            ) : null}

            {query.isError ? <JsonDetails title={t("sleep.errorJsonTitle")} data={query.error} defaultOpen /> : null}

            {query.isSuccess && !hasAnySleepValue ? (
                <EmptyState title={t("sleep.empty.title")} description={t("sleep.empty.desc")} />
            ) : null}

            {/* Form */}
            <div className="rounded-xl border bg-card p-4 space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-1">
                        <label className="text-sm font-medium">{t("sleep.fields.timeAsleepMinutes")}</label>
                        <input
                            inputMode="numeric"
                            placeholder="e.g. 420"
                            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                            value={numOrEmpty(form.timeAsleepMinutes)}
                            onChange={(e) =>
                                setForm((p) => ({
                                    ...p,
                                    timeAsleepMinutes: parseNullableInt(e.target.value),
                                }))
                            }
                        />
                        <div className="text-xs text-muted-foreground">{t("sleep.hints.timeAsleepMinutes")}</div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium">{t("sleep.fields.score")}</label>
                        <input
                            inputMode="numeric"
                            placeholder="0-100"
                            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                            value={numOrEmpty(form.score)}
                            onChange={(e) =>
                                setForm((p) => ({
                                    ...p,
                                    score: parseNullableScore(e.target.value),
                                }))
                            }
                        />
                        <div className="text-xs text-muted-foreground">{t("sleep.hints.score")}</div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium">{t("sleep.fields.awakeMinutes")}</label>
                        <input
                            inputMode="numeric"
                            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                            value={numOrEmpty(form.awakeMinutes)}
                            onChange={(e) => setForm((p) => ({ ...p, awakeMinutes: parseNullableInt(e.target.value) }))}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium">{t("sleep.fields.remMinutes")}</label>
                        <input
                            inputMode="numeric"
                            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                            value={numOrEmpty(form.remMinutes)}
                            onChange={(e) => setForm((p) => ({ ...p, remMinutes: parseNullableInt(e.target.value) }))}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium">{t("sleep.fields.coreMinutes")}</label>
                        <input
                            inputMode="numeric"
                            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                            value={numOrEmpty(form.coreMinutes)}
                            onChange={(e) => setForm((p) => ({ ...p, coreMinutes: parseNullableInt(e.target.value) }))}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium">{t("sleep.fields.deepMinutes")}</label>
                        <input
                            inputMode="numeric"
                            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                            value={numOrEmpty(form.deepMinutes)}
                            onChange={(e) => setForm((p) => ({ ...p, deepMinutes: parseNullableInt(e.target.value) }))}
                        />
                    </div>

                    <div className="space-y-1 md:col-span-2 lg:col-span-2">
                        <label className="text-sm font-medium">{t("sleep.fields.source")}</label>
                        <input
                            placeholder={t("sleep.placeholders.source")}
                            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                            value={form.source ?? ""}
                            onChange={(e) =>
                                setForm((p) => ({
                                    ...p,
                                    source: e.target.value.trim() ? e.target.value : null,
                                }))
                            }
                        />
                        {/* <div className="text-xs text-muted-foreground">{t("sleep.hints.source")}</div> */}
                    </div>
                </div>
            </div>

            {query.isSuccess ? <JsonDetails title={t("sleep.debugJsonTitle")} data={query.data} /> : null}
        </div>
    );
}

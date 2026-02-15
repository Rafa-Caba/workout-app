import React from "react";
import { format } from "date-fns";
import { toast } from "sonner";

import type { ApiError } from "@/api/httpErrors";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { JsonDetails } from "@/components/JsonDetails";
import { EmptyState } from "@/components/EmptyState";
import { StatCard } from "@/components/StatCard";
import { useI18n } from "@/i18n/I18nProvider";

import type { StreaksMode } from "@/services/workout/insights.service";
import { useStreaks } from "@/hooks/useStreaks";

function toastApiError(e: unknown, fallback: string) {
    const err = e as Partial<ApiError> | undefined;
    const msg = err?.message ?? fallback;
    const details = err?.details ? JSON.stringify(err.details, null, 2) : undefined;
    toast.error(msg, { description: details });
}

function isRecord(v: unknown): v is Record<string, unknown> {
    return typeof v === "object" && v !== null;
}

function pickNumber(obj: Record<string, unknown>, keys: string[]): number | null {
    for (const k of keys) {
        const v = obj[k];
        if (typeof v === "number") return v;
    }
    return null;
}

export function InsightsStreaksPage() {
    const { t } = useI18n();
    const today = React.useMemo(() => new Date(), []);

    const [mode, setMode] = React.useState<StreaksMode>("both");
    const [gapDays, setGapDays] = React.useState<string>("0");
    const [asOf, setAsOf] = React.useState<string>(() => format(today, "yyyy-MM-dd"));

    const parsedGapDays =
        gapDays.trim() === ""
            ? undefined
            : Number.isFinite(Number(gapDays))
                ? Number(gapDays)
                : undefined;

    // ✅ Auto-load state (debounced)
    const [run, setRun] = React.useState<{ mode: StreaksMode; gapDays?: number; asOf?: string }>(() => ({
        mode: "both",
        gapDays: 0,
        asOf,
    }));

    const query = useStreaks(run, Boolean(run));

    // Debounce user input changes -> run
    const debounceRef = React.useRef<number | null>(null);
    const lastAutoKeyRef = React.useRef<string>("");

    React.useEffect(() => {
        const next = {
            mode,
            gapDays: parsedGapDays,
            asOf: asOf || undefined,
        };

        const key = `${next.mode}:${String(next.gapDays ?? "")}:${String(next.asOf ?? "")}`;
        if (key === lastAutoKeyRef.current) return;

        if (debounceRef.current) window.clearTimeout(debounceRef.current);

        debounceRef.current = window.setTimeout(() => {
            lastAutoKeyRef.current = key;
            setRun(next);
        }, 350);

        return () => {
            if (debounceRef.current) window.clearTimeout(debounceRef.current);
        };
    }, [mode, parsedGapDays, asOf]);

    React.useEffect(() => {
        if (query.isError) toastApiError(query.error, t("streaks.toast.loadFail"));
    }, [query.isError, query.error, t]);

    const kpis = React.useMemo(() => {
        if (!isRecord(query.data)) return null;
        const current = pickNumber(query.data, ["currentStreakDays", "current", "currentStreak", "currentDays"]);
        const best = pickNumber(query.data, ["longestStreakDays", "best", "bestStreak", "maxDays"]);
        const total = pickNumber(query.data, ["total", "totalDays", "count"]);
        return { current, best, total };
    }, [query.data]);

    return (
        <div className="space-y-6">
            <PageHeader
                title={`${t("insights.title")} — ${t("insights.streaks.title")}`}
                subtitle={t("pages.insights.streaks.subtitle")}
                right={
                    <Button variant="outline" onClick={() => query.refetch()} disabled={query.isFetching}>
                        {t("common.refetch")}
                    </Button>
                }
            />

            <div className="rounded-xl border bg-card p-4">
                <div className="flex flex-wrap items-end gap-3">
                    <div className="space-y-1">
                        <label className="text-sm font-medium">{t("common.mode")}</label>
                        <select
                            className="rounded-md border bg-background px-3 py-2 text-sm"
                            value={mode}
                            onChange={(e) => setMode(e.target.value as StreaksMode)}
                        >
                            <option value="training">{t("streaks.mode.training")}</option>
                            <option value="sleep">{t("streaks.mode.sleep")}</option>
                            <option value="both">{t("streaks.mode.both")}</option>
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium">{t("common.gapDays")}</label>
                        <input
                            className="w-[40] rounded-md border bg-background px-3 py-2 text-sm"
                            value={gapDays}
                            onChange={(e) => setGapDays(e.target.value)}
                            placeholder="0"
                            inputMode="numeric"
                        />
                        <p className="text-xs text-muted-foreground">{t("streaks.gapHint")}</p>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium">{t("common.asOf")}</label>
                        <input
                            type="date"
                            className="rounded-md border bg-background px-3 py-2 text-sm"
                            value={asOf}
                            onChange={(e) => setAsOf(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {query.isFetching ? (
                <div className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">{t("common.fetching")}</div>
            ) : null}

            {query.isError ? <JsonDetails title={t("streaks.errorJsonTitle")} data={query.error} defaultOpen /> : null}

            {!query.isFetching && query.isSuccess && !kpis ? (
                <EmptyState title={t("common.couldNotInterpret")} description={t("common.showingDebugJson")} />
            ) : null}

            {query.isSuccess && kpis ? (
                <div className="space-y-4">
                    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
                        <StatCard label={t("streaks.kpi.current")} value={kpis.current ?? "—"} />
                        <StatCard label={t("streaks.kpi.best")} value={kpis.best ?? "—"} />
                        <StatCard label={t("streaks.kpi.totalApprox")} value={kpis.total ?? "—"} />
                    </div>

                    <JsonDetails title={t("streaks.errorJsonTitle")} data={query.data} />
                </div>
            ) : null}
        </div>
    );
}

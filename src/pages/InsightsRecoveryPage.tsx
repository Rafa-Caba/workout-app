import React from "react";
import { format, subDays } from "date-fns";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { ApiError } from "@/api/httpErrors";
import { useRecovery } from "@/hooks/useRecovery";
import { PageHeader } from "@/components/PageHeader";
import { JsonDetails } from "@/components/JsonDetails";
import { EmptyState } from "@/components/EmptyState";
import { StatCard } from "@/components/StatCard";
import { useI18n } from "@/i18n/I18nProvider";

function toastApiError(e: unknown, fallback: string) {
    const err = e as Partial<ApiError> | undefined;
    const msg = err?.message ?? fallback;
    const details = err?.details ? JSON.stringify(err.details, null, 2) : undefined;
    toast.error(msg, { description: details });
}

function isRecord(v: unknown): v is Record<string, unknown> {
    return typeof v === "object" && v !== null;
}

function extractSummary(data: unknown): Record<string, unknown> | null {
    if (!isRecord(data)) return null;
    if (isRecord((data as Record<string, unknown>).summary)) return (data as Record<string, unknown>).summary as Record<string, unknown>;
    if (isRecord((data as Record<string, unknown>).overview)) return (data as Record<string, unknown>).overview as Record<string, unknown>;
    return null;
}

function pickNumber(obj: Record<string, unknown>, keys: string[]): number | null {
    for (const k of keys) {
        const v = obj[k];
        if (typeof v === "number") return v;
    }
    return null;
}

function computeKpisFromPoints(data: unknown): { score: number | null; sleep: number | null; strain: number | null } | null {
    if (!isRecord(data)) return null;
    const pts = (data as Record<string, unknown>).points;
    if (!Array.isArray(pts) || pts.length === 0) return null;

    const numbers = (key: string) =>
        pts
            .map((p) => (isRecord(p) ? (p as Record<string, unknown>)[key] : null))
            .filter((v): v is number => typeof v === "number");

    const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);

    const score = avg(numbers("recoveryScore")) ?? avg(numbers("sleepScore"));
    const sleep = avg(numbers("totalSleepMinutes")) ?? avg(numbers("deepMinutes"));
    const strain = avg(numbers("trainingLoad"));

    return { score, sleep, strain };
}

export function InsightsRecoveryPage() {
    const { t } = useI18n();
    const today = React.useMemo(() => new Date(), []);

    const [from, setFrom] = React.useState(() => format(subDays(today, 30), "yyyy-MM-dd"));
    const [to, setTo] = React.useState(() => format(today, "yyyy-MM-dd"));

    // ✅ Auto-load state (debounced)
    const [run, setRun] = React.useState<{ from?: string; to?: string }>(() => ({ from, to }));

    const enabled = Boolean(run?.from && run?.to);
    const query = useRecovery(run ?? { from, to }, enabled);

    const debounceRef = React.useRef<number | null>(null);
    const lastAutoKeyRef = React.useRef<string>("");

    React.useEffect(() => {
        const next = { from: from || undefined, to: to || undefined };
        const key = `${next.from ?? ""}:${next.to ?? ""}`;
        if (key === lastAutoKeyRef.current) return;

        if (debounceRef.current) window.clearTimeout(debounceRef.current);

        debounceRef.current = window.setTimeout(() => {
            lastAutoKeyRef.current = key;
            setRun(next);
        }, 350);

        return () => {
            if (debounceRef.current) window.clearTimeout(debounceRef.current);
        };
    }, [from, to]);

    React.useEffect(() => {
        if (query.isError) toastApiError(query.error, t("recovery.toast.loadFail"));
    }, [query.isError, query.error, t]);

    const summary = React.useMemo(() => extractSummary(query.data), [query.data]);

    const kpis = React.useMemo(() => {
        if (summary) {
            const score = pickNumber(summary, ["score", "avgScore", "recoveryScore"]);
            const sleep = pickNumber(summary, ["sleep", "avgSleepMinutes", "avgTotalMinutes"]);
            const strain = pickNumber(summary, ["strain", "load", "trainingLoad"]);
            return { score, sleep, strain };
        }
        return computeKpisFromPoints(query.data);
    }, [summary, query.data]);

    return (
        <div className="space-y-6">
            <PageHeader
                title={`${t("insights.title")} — ${t("insights.recovery.title")}`}
                subtitle={t("pages.insights.recovery.subtitle")}
                right={
                    <Button variant="outline" onClick={() => query.refetch()} disabled={!enabled || query.isFetching}>
                        {t("common.refetch")}
                    </Button>
                }
            />

            <div className="rounded-xl border bg-card p-4">
                <div className="flex flex-wrap items-end gap-3">
                    <div className="space-y-1">
                        <label className="text-sm font-medium">{t("common.from")}</label>
                        <input
                            type="date"
                            className="rounded-md border bg-background px-3 py-2 text-sm"
                            value={from}
                            onChange={(e) => setFrom(e.target.value)}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium">{t("common.to")}</label>
                        <input
                            type="date"
                            className="rounded-md border bg-background px-3 py-2 text-sm"
                            value={to}
                            onChange={(e) => setTo(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {!enabled ? <EmptyState title={t("recovery.empty.title")} description={t("recovery.empty.desc")} /> : null}

            {enabled && query.isFetching ? (
                <div className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">{t("common.fetching")}</div>
            ) : null}

            {enabled && query.isSuccess && kpis ? (
                <div className="grid gap-4 sm:grid-cols-3">
                    <StatCard label={t("recovery.kpi.score")} value={kpis.score ?? "—"} />
                    <StatCard label={t("recovery.kpi.sleep")} value={kpis.sleep ?? "—"} />
                    <StatCard label={t("recovery.kpi.strain")} value={kpis.strain ?? "—"} />
                </div>
            ) : null}

            {enabled && query.isSuccess ? <JsonDetails title={t("recovery.debugJsonTitle")} data={query.data} /> : null}

            {enabled && query.isError ? <JsonDetails title={t("common.errorTitle")} data={query.error} defaultOpen /> : null}
        </div>
    );
}

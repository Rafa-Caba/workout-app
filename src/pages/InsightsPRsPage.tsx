import React from "react";
import { format, subDays } from "date-fns";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { ApiError } from "@/api/httpErrors";
import { usePRs } from "@/hooks/usePRs";

import { PageHeader } from "@/components/PageHeader";
import { JsonDetails } from "@/components/JsonDetails";
import { EmptyState } from "@/components/EmptyState";
import { useI18n } from "@/i18n/I18nProvider";

import type { PrRecord } from "@/services/workout/insights.service";

function toastApiError(e: unknown, fallback: string) {
    const err = e as Partial<ApiError> | undefined;
    const msg = err?.message ?? fallback;
    const details = err?.details ? JSON.stringify(err.details, null, 2) : undefined;
    toast.error(msg, { description: details });
}

function formatMetricLabel(metric: string, mode: "max" | "min") {
    // Keep it simple and stable (no guessing translations)
    // Example: durationSeconds (max)
    return `${metric} (${mode})`;
}

export function InsightsPRsPage() {
    const { t } = useI18n();
    const today = React.useMemo(() => new Date(), []);

    const [from, setFrom] = React.useState(() => format(subDays(today, 90), "yyyy-MM-dd"));
    const [to, setTo] = React.useState(() => format(today, "yyyy-MM-dd"));

    // ✅ Auto-load (debounced) when date inputs change
    const [run, setRun] = React.useState<{ from?: string; to?: string }>(() => ({ from, to }));
    const query = usePRs(run, Boolean(run));

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
        if (query.isError) toastApiError(query.error, t("prs.toast.loadFail"));
    }, [query.isError, query.error, t]);

    const rows: PrRecord[] = query.data?.prs ?? [];

    return (
        <div className="space-y-6">
            <PageHeader
                title={`${t("insights.title")} — ${t("insights.prs.title")}`}
                subtitle={t("pages.insights.prs.subtitle")}
                right={
                    <Button variant="outline" onClick={() => query.refetch()} disabled={query.isFetching}>
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

            {query.isFetching ? (
                <div className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">{t("common.fetching")}</div>
            ) : null}

            {query.isError ? <JsonDetails title={t("prs.errorJsonTitle")} data={query.error} defaultOpen /> : null}

            {query.isSuccess && rows.length === 0 ? (
                <EmptyState title={t("prs.empty.title")} description={t("prs.empty.desc")} />
            ) : null}

            {query.isSuccess && rows.length > 0 ? (
                <div className="rounded-xl border bg-card overflow-auto">
                    <table className="w-full text-sm">
                        <thead className="border-b">
                            <tr className="text-left">
                                <th className="p-3">{t("prs.table.exercise")}</th>
                                <th className="p-3">{t("prs.table.metric")}</th>
                                <th className="p-3 text-right">{t("prs.table.value")}</th>
                                <th className="p-3 text-right">{t("prs.table.date")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r, idx) => (
                                <tr key={`${r.sessionId}-${r.metric}-${r.mode}-${idx}`} className="border-b last:border-b-0">
                                    {/* En este API, "Ejercicio" realmente es el tipo de sesión */}
                                    <td className="p-3">{r.sessionType?.trim() ? r.sessionType : "—"}</td>

                                    <td className="p-3 font-mono">{formatMetricLabel(r.metric, r.mode)}</td>

                                    <td className="p-3 font-mono text-right">{r.value}</td>

                                    <td className="p-3 font-mono text-right">{r.date}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : null}

            {query.isSuccess ? <JsonDetails title={t("prs.debugJsonTitle")} data={query.data} /> : null}
        </div>
    );
}

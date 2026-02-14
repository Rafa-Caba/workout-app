import React from "react";
import { Button } from "@/components/ui/button";
import { JsonDetails } from "@/components/JsonDetails";
import { EmptyState } from "@/components/EmptyState";
import { StatCard } from "@/components/StatCard";
import { usePlanVsActual } from "@/hooks/usePlanVsActual";
import { useI18n } from "@/i18n/I18nProvider";

function isRecord(v: unknown): v is Record<string, unknown> {
    return typeof v === "object" && v !== null;
}

type PvaDay = {
    date: string;
    dayKey: string;
    planned: { sessionType: string | null; focus: string | null; tags: string[] | null } | null;
    actual: { sessions: Array<{ id: string; type: string }> } | null;
    status: string;
};

type PlanVsActualResponse = {
    weekKey: string;
    range: { from: string; to: string };
    hasRoutineTemplate: boolean;
    days: PvaDay[];
};

function looksLikePva(resp: unknown): resp is PlanVsActualResponse {
    if (!isRecord(resp)) return false;
    if (typeof resp.weekKey !== "string") return false;
    if (!isRecord(resp.range)) return false;
    if (!Array.isArray(resp.days)) return false;
    return true;
}

function isPlannedNonEmpty(p: PvaDay["planned"]): boolean {
    if (!p) return false;
    const hasType = typeof p.sessionType === "string" && p.sessionType.trim().length > 0;
    const hasFocus = typeof p.focus === "string" && p.focus.trim().length > 0;
    const hasTags = Array.isArray(p.tags) && p.tags.length > 0;
    return hasType || hasFocus || hasTags;
}

function normalizePva(resp: unknown) {
    if (!looksLikePva(resp)) {
        return {
            planned: null as number | null,
            actual: null as number | null,
            matched: null as number | null,
            missing: null as number | null,
        };
    }

    const plannedDays = resp.days.filter((d) => isPlannedNonEmpty(d.planned));
    const planned = plannedDays.length;

    const actual = resp.days.reduce((acc, d) => acc + (d.actual?.sessions?.length ?? 0), 0);

    const matched = plannedDays.filter((d) => (d.actual?.sessions?.length ?? 0) > 0).length;
    const missing = plannedDays.filter((d) => (d.actual?.sessions?.length ?? 0) === 0).length;

    return { planned, actual, matched, missing };
}

export function PlanVsActualPanel({ weekKey }: { weekKey: string }) {
    const { t } = useI18n();
    const q = usePlanVsActual(weekKey); // Option A call
    const norm = React.useMemo(() => normalizePva(q.data), [q.data]);
    const busy = q.isFetching;

    return (
        <div className="rounded-xl border bg-card p-4 space-y-4">
            <div className="flex items-center justify-between gap-2">
                <div>
                    <div className="text-lg font-semibold">{t("routines.planVsActualTitle")}</div>
                    <div className="text-sm text-muted-foreground">{t("routines.planVsActualHint")}</div>
                </div>

                <Button variant="outline" onClick={() => q.refetch()} disabled={busy}>
                    {busy ? t("common.loading") : t("common.refetch")}
                </Button>
            </div>

            {!q.data && !q.isFetching && !q.isError ? (
                <EmptyState title={t("routines.noDataYetTitle")} description={t("routines.noDataYetDesc")} />
            ) : null}

            {q.isError ? <JsonDetails title="Error (JSON)" data={q.error} defaultOpen /> : null}

            {q.data ? (
                <>
                    <div className="grid gap-4 sm:grid-cols-4">
                        <StatCard label={t("pva.planned")} value={norm.planned ?? "—"} />
                        <StatCard label={t("pva.actual")} value={norm.actual ?? "—"} />
                        <StatCard label={t("pva.matched")} value={norm.matched ?? "—"} />
                        <StatCard label={t("pva.missing")} value={norm.missing ?? "—"} />
                    </div>

                    <JsonDetails title={t("pva.debugJson")} data={q.data} />
                </>
            ) : null}
        </div>
    );
}

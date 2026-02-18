import React from "react";
import { StatCard } from "@/components/StatCard";
import type { I18nKey } from "@/i18n/keys";
import type { DayExplorerKpis } from "@/utils/dayExplorer";

function formatMaybeNumber(value: number | null): string {
    if (typeof value !== "number") return "—";
    return String(value);
}

export function DayExplorerKpisPanel({
    t,
    kpis,
}: {
    t: (k: I18nKey, vars?: Record<string, string | number>) => string;
    kpis: DayExplorerKpis | null;
}) {
    if (!kpis) return null;

    return (
        <div className="w-full min-w-0 grid gap-3 sm:gap-4 grid-cols-1 xs:grid-cols-2 sm:grid-cols-3">
            <StatCard label={t("days.kpi.trainingSeconds")} value={formatMaybeNumber(kpis.trainingSeconds)} />
            <StatCard label={t("days.kpi.activeKcal")} value={formatMaybeNumber(kpis.activeKcal)} />
            <StatCard label={t("days.kpi.sleepMinutes")} value={formatMaybeNumber(kpis.sleepMinutes)} />
        </div>
    );
}

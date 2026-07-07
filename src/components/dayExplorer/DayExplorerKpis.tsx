// src/components/dayExplorer/DayExplorerKpis.tsx
// MUI KPI cards for the Day Explorer summary view.

import type { I18nKey } from "@/i18n/keys";
import type { DayExplorerKpis } from "@/utils/dayExplorer";
import { AppMetricCard } from "@/components/mui";
import Box from "@mui/material/Box";

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

    const secondsToMinutes = kpis.trainingSeconds ? kpis.trainingSeconds / 60 : 0;

    return (
        <Box
            sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" },
                gap: { xs: 1, md: 1.25 },
                minWidth: 0,
            }}
        >
            <AppMetricCard compact label={t("days.kpi.trainingSeconds")} value={formatMaybeNumber(secondsToMinutes)} />
            <AppMetricCard compact label={t("days.kpi.activeKcal")} value={formatMaybeNumber(kpis.activeKcal)} />
            <AppMetricCard compact label={t("days.kpi.sleepMinutes")} value={formatMaybeNumber(kpis.sleepMinutes)} />
        </Box>
    );
}

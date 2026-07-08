// src/components/pva/PlanVsActualPanel.tsx
// MUI embedded Plan vs Real summary panel used inside routines / related pages.

import React from "react";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";

import { JsonDetails } from "@/components/JsonDetails";
import { AppCard, AppEmptyState, AppMetricCard, AppSectionHeader } from "@/components/mui";
import { usePlanVsActual } from "@/hooks/usePlanVsActual";
import { useI18n } from "@/i18n/I18nProvider";

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
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

function looksLikePva(response: unknown): response is PlanVsActualResponse {
    if (!isRecord(response)) return false;
    if (typeof response.weekKey !== "string") return false;
    if (!isRecord(response.range)) return false;
    if (!Array.isArray(response.days)) return false;
    return true;
}

function isPlannedNonEmpty(planned: PvaDay["planned"]): boolean {
    if (!planned) return false;

    const hasType = typeof planned.sessionType === "string" && planned.sessionType.trim().length > 0;
    const hasFocus = typeof planned.focus === "string" && planned.focus.trim().length > 0;
    const hasTags = Array.isArray(planned.tags) && planned.tags.length > 0;

    return hasType || hasFocus || hasTags;
}

function normalizePva(response: unknown) {
    if (!looksLikePva(response)) {
        return {
            planned: null as number | null,
            actual: null as number | null,
            matched: null as number | null,
            missing: null as number | null,
        };
    }

    const plannedDays = response.days.filter((day) => isPlannedNonEmpty(day.planned));
    const planned = plannedDays.length;
    const actual = response.days.reduce((acc, day) => acc + (day.actual?.sessions.length ?? 0), 0);
    const matched = plannedDays.filter((day) => (day.actual?.sessions.length ?? 0) > 0).length;
    const missing = plannedDays.filter((day) => (day.actual?.sessions.length ?? 0) === 0).length;

    return { planned, actual, matched, missing };
}

function formatValue(value: number | null): string {
    if (typeof value !== "number" || !Number.isFinite(value)) return "—";
    return Number(value.toFixed(2)).toString();
}

export function PlanVsActualPanel({ weekKey }: { weekKey: string }) {
    const { t } = useI18n();
    const query = usePlanVsActual(weekKey);
    const norm = React.useMemo(() => normalizePva(query.data), [query.data]);
    const busy = query.isFetching;

    return (
        <AppCard>
            <AppSectionHeader
                title={t("routines.planVsActualTitle")}
                description={t("routines.planVsActualHint")}
                actions={
                    <Button variant="outlined" onClick={() => query.refetch()} disabled={busy}>
                        {busy ? t("common.loading") : t("common.refetch")}
                    </Button>
                }
            />

            <Box sx={{ mt: { xs: 1.5, md: 2 }, display: "flex", flexDirection: "column", gap: { xs: 1.5, md: 2 } }}>
                {!query.data && !query.isFetching && !query.isError ? (
                    <AppEmptyState title={t("routines.noDataYetTitle")} description={t("routines.noDataYetDesc")} variant="inline" />
                ) : null}

                {query.isError ? <JsonDetails title="Error (JSON)" data={query.error} defaultOpen /> : null}

                {query.data ? (
                    <>
                        <Box
                            sx={{
                                display: "grid",
                                gridTemplateColumns: {
                                    xs: "repeat(2, minmax(0, 1fr))",
                                    md: "repeat(4, minmax(0, 1fr))",
                                },
                                gap: { xs: 1, md: 1.5 },
                            }}
                        >
                            <AppMetricCard label={t("pva.planned")} value={formatValue(norm.planned)} compact />
                            <AppMetricCard label={t("pva.actual")} value={formatValue(norm.actual)} compact />
                            <AppMetricCard label={t("pva.matched")} value={formatValue(norm.matched)} compact />
                            <AppMetricCard label={t("pva.missing")} value={formatValue(norm.missing)} compact />
                        </Box>

                        <JsonDetails title={t("pva.debugJson")} data={query.data} />
                    </>
                ) : null}
            </Box>
        </AppCard>
    );
}

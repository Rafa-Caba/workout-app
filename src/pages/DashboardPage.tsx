// src/pages/DashboardPage.tsx
// MUI dashboard page. Keeps dashboard hooks/services unchanged while moving
// the visible dashboard layout to the shared MUI primitives.

import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import ButtonBase from "@mui/material/ButtonBase";

import { useAuthStore } from "@/state/auth.store";
import { useDashboard } from "@/hooks/useDashboard";
import { useI18n } from "@/i18n/I18nProvider";
import {
    formatIsoToPPP,
    getSafeUserName,
    minutesToHhMm,
    pickTrendPointForWeek,
    secondsToHhMm,
} from "@/utils/dashboard/format";
import type { MediaFeedItem } from "@/types/media.types";
import { MediaViewerModal } from "@/components/media/MediaViewerModal";
import { useWorkoutProgress } from "@/hooks/useWorkoutProgress";
import { ProgressExercisePreviewCard } from "@/components/progress/ProgressExercisePreviewCard";
import { AppCard, AppEmptyState, AppMetricCard, AppPage } from "@/components/mui";

function formatDashboardNumber(value: number | null | undefined): string {
    if (typeof value !== "number" || !Number.isFinite(value)) {
        return "—";
    }

    return Number(value.toFixed(2)).toString();
}

function getErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof Error && error.message.trim().length > 0) {
        return error.message;
    }

    return fallback;
}

function InlineMetric({ label, value }: { label: string; value: string }) {
    return (
        <Box
            sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 1.25,
                minWidth: 0,
                py: 0.25,
            }}
        >
            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 0 }}>
                {label}
            </Typography>
            <Typography
                variant="body2"
                sx={{
                    fontWeight: 750,
                    textAlign: "right",
                    overflowWrap: "anywhere",
                }}
            >
                {value}
            </Typography>
        </Box>
    );
}

export function DashboardPage() {
    const { t } = useI18n();
    const user = useAuthStore((s) => s.user);
    const name = getSafeUserName(user);

    const [selected, setSelected] = React.useState<MediaFeedItem | null>(null);

    const d = useDashboard();

    const progress = useWorkoutProgress({
        mode: "last30",
        compareTo: "previous_period",
        includeExerciseProgress: true,
    });

    const todayLabel = React.useMemo(() => formatIsoToPPP(d.today), [d.today]);

    const rangeTraining = d.rangeSummary.data?.training ?? null;
    const rangeSleep = d.rangeSummary.data?.sleep ?? null;

    const day = d.daySummary.data ?? null;
    const week = d.weekSummary.data ?? null;

    const trendPoint = React.useMemo(
        () => pickTrendPointForWeek(d.weekTrend.data, d.weekKey),
        [d.weekTrend.data, d.weekKey]
    );

    const streaks = d.streaks.data ?? null;
    const media = d.media.data?.items ?? [];

    return (
        <AppPage
            maxWidth="xl"
            title={t("dashboard.welcome", { name })}
            subtitle={
                <>
                    {t("dashboard.todayLabel")} {d.today} · {todayLabel} · {t("dashboard.weekLabel")} {d.weekKey}
                </>
            }
        >
            {d.error ? (
                <Alert severity="error" variant="outlined">
                    {getErrorMessage(d.error, t("dashboard.loadError"))}
                </Alert>
            ) : null}

            <AppCard
                title={t("dashboard.last7.title")}
                subtitle={
                    <>
                        {t("dashboard.last7.range")} {d.range.from} → {d.range.to}
                    </>
                }
            >
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
                        gap: { xs: 1.25, md: 1.5 },
                    }}
                >
                    <AppCard title={t("dashboard.training.title")} tone="accent" padding="sm">
                        <InlineMetric
                            label={t("dashboard.training.sessions")}
                            value={formatDashboardNumber(rangeTraining?.sessionsCount ?? 0)}
                        />
                        <InlineMetric
                            label={t("dashboard.training.duration")}
                            value={secondsToHhMm(rangeTraining?.durationSeconds ?? 0)}
                        />
                        <InlineMetric
                            label={t("dashboard.training.activeKcal")}
                            value={formatDashboardNumber(rangeTraining?.activeKcal)}
                        />
                        <InlineMetric
                            label={`${t("dashboard.training.hr")} / ${t("dashboard.training.maxHr")}`}
                            value={`${formatDashboardNumber(rangeTraining?.avgHr)} / ${formatDashboardNumber(rangeTraining?.maxHr)}`}
                        />
                        <InlineMetric
                            label={t("dashboard.training.media")}
                            value={formatDashboardNumber(rangeTraining?.mediaCount ?? 0)}
                        />
                    </AppCard>

                    <AppCard title={t("dashboard.sleep.title")} tone="accent" padding="sm">
                        <InlineMetric
                            label={t("dashboard.sleep.daysWithSleep")}
                            value={formatDashboardNumber(rangeSleep?.daysWithSleep ?? 0)}
                        />
                        <InlineMetric
                            label={t("dashboard.sleep.avgTotal")}
                            value={rangeSleep?.avgTotalMinutes ? minutesToHhMm(rangeSleep.avgTotalMinutes) : "—"}
                        />
                        <InlineMetric
                            label={`${t("dashboard.sleep.avgDeep")} / ${t("dashboard.sleep.avgRem")}`}
                            value={`${formatDashboardNumber(rangeSleep?.avgDeepMinutes)} / ${formatDashboardNumber(rangeSleep?.avgRemMinutes)} min`}
                        />
                        <InlineMetric
                            label={t("dashboard.sleep.avgScore")}
                            value={formatDashboardNumber(rangeSleep?.avgScore)}
                        />
                    </AppCard>
                </Box>
            </AppCard>

            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", lg: "repeat(2, minmax(0, 1fr))" },
                    gap: { xs: 1.5, md: 2 },
                    alignItems: "start",
                }}
            >
                <AppCard title={t("dashboard.todayCard.title")}>
                    {!day && d.isLoading ? (
                        <Typography variant="body2" color="text.secondary">
                            {t("common.loading")}
                        </Typography>
                    ) : null}

                    {!day && !d.isLoading ? (
                        <AppEmptyState
                            title={t("dashboard.todayCard.empty")}
                            variant="inline"
                        />
                    ) : null}

                    {day ? (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
                            <Typography variant="caption" color="text.secondary">
                                {t("dashboard.todayCard.date")} {day.date} · {t("dashboard.todayCard.weekKey")} {day.weekKey ?? "—"}
                            </Typography>

                            <AppCard title={t("dashboard.training.title")} tone="accent" padding="sm">
                                <InlineMetric
                                    label={t("dashboard.training.sessions")}
                                    value={formatDashboardNumber(day.training.sessionsCount)}
                                />
                                <InlineMetric
                                    label={t("dashboard.training.duration")}
                                    value={secondsToHhMm(day.training.durationSeconds)}
                                />
                                <InlineMetric
                                    label={t("dashboard.training.activeKcal")}
                                    value={formatDashboardNumber(day.training.activeKcal)}
                                />
                                <InlineMetric
                                    label={`${t("dashboard.training.hr")} / ${t("dashboard.training.maxHr")}`}
                                    value={`${formatDashboardNumber(day.training.avgHr)} / ${formatDashboardNumber(day.training.maxHr)}`}
                                />
                            </AppCard>

                            <AppCard title={t("dashboard.sleep.title")} tone="soft" padding="sm">
                                {!day.sleep ? (
                                    <Typography variant="body2" color="text.secondary">
                                        {t("dashboard.sleep.noData")}
                                    </Typography>
                                ) : (
                                    <>
                                        <InlineMetric
                                            label={t("dashboard.sleep.total")}
                                            value={day.sleep.totalMinutes ? minutesToHhMm(day.sleep.totalMinutes) : "—"}
                                        />
                                        <InlineMetric
                                            label={`${t("dashboard.sleep.deep")} / ${t("dashboard.sleep.rem")}`}
                                            value={`${formatDashboardNumber(day.sleep.deepMinutes)} / ${formatDashboardNumber(day.sleep.remMinutes)} min`}
                                        />
                                        <InlineMetric
                                            label={t("dashboard.sleep.score")}
                                            value={formatDashboardNumber(day.sleep.score)}
                                        />
                                    </>
                                )}
                            </AppCard>
                        </Box>
                    ) : null}
                </AppCard>

                <AppCard title={t("dashboard.thisWeek.title")}>
                    {!week && d.isLoading ? (
                        <Typography variant="body2" color="text.secondary">
                            {t("common.loading")}
                        </Typography>
                    ) : null}

                    {!week && !d.isLoading ? (
                        <AppEmptyState title={t("dashboard.thisWeek.empty")} variant="inline" />
                    ) : null}

                    {week ? (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
                            <Typography variant="caption" color="text.secondary">
                                {week.weekKey} · {week.range.from} → {week.range.to}
                            </Typography>

                            <AppCard title={t("dashboard.thisWeek.summaryTitle")} tone="accent" padding="sm">
                                <InlineMetric
                                    label={t("dashboard.training.sessions")}
                                    value={formatDashboardNumber(week.training.sessionsCount)}
                                />
                                <InlineMetric
                                    label={t("dashboard.training.duration")}
                                    value={secondsToHhMm(week.training.durationSeconds)}
                                />
                                <InlineMetric
                                    label={t("dashboard.training.activeKcal")}
                                    value={formatDashboardNumber(week.training.activeKcal)}
                                />
                                <InlineMetric
                                    label={`${t("dashboard.training.hr")} / ${t("dashboard.training.maxHr")}`}
                                    value={`${formatDashboardNumber(week.training.avgHr)} / ${formatDashboardNumber(week.training.maxHr)}`}
                                />
                            </AppCard>

                            <AppCard title={t("dashboard.thisWeek.trendTitle")} tone="soft" padding="sm">
                                {!trendPoint ? (
                                    <Typography variant="body2" color="text.secondary">
                                        {t("dashboard.thisWeek.noTrend")}
                                    </Typography>
                                ) : (
                                    <InlineMetric
                                        label={t("dashboard.thisWeek.daysLogged")}
                                        value={`${formatDashboardNumber(trendPoint.daysCount)} · ${t("dashboard.thisWeek.media")} ${formatDashboardNumber(trendPoint.mediaCount)}`}
                                    />
                                )}
                            </AppCard>
                        </Box>
                    ) : null}
                </AppCard>

                <ProgressExercisePreviewCard
                    data={progress.data ?? null}
                    isLoading={progress.isLoading}
                />

                <AppCard title={t("dashboard.streak.title")}>
                    {!streaks && d.isLoading ? (
                        <Typography variant="body2" color="text.secondary">
                            {t("common.loading")}
                        </Typography>
                    ) : null}

                    {!streaks && !d.isLoading ? (
                        <AppEmptyState title={t("dashboard.streak.empty")} variant="inline" />
                    ) : null}

                    {streaks ? (
                        <AppCard tone="accent" padding="sm">
                            <Typography variant="caption" color="text.secondary">
                                {t("dashboard.streak.asOf")} {streaks.asOf}
                            </Typography>
                            <Typography
                                variant="h3"
                                color="primary"
                                sx={{ mt: 0.5, fontWeight: 850, letterSpacing: "-0.04em" }}
                            >
                                {formatDashboardNumber(streaks.currentStreakDays)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {t("dashboard.streak.days")}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                                {t("dashboard.streak.longest")} {formatDashboardNumber(streaks.longestStreakDays)} · {t("dashboard.streak.lastDay")} {streaks.lastQualifiedDate ?? "—"}
                            </Typography>
                        </AppCard>
                    ) : null}
                </AppCard>

                <AppCard title={t("dashboard.media.title")}>
                    {d.isLoading && media.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                            {t("common.loading")}
                        </Typography>
                    ) : null}

                    {!d.isLoading && media.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                            {t("dashboard.media.empty")}
                        </Typography>
                    ) : null}

                    {media.length > 0 ? (
                        <Box
                            sx={{
                                display: "grid",
                                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                                gap: 1,
                            }}
                        >
                            {media.map((m) => {
                                const isImage = m.resourceType === "image";

                                return (
                                    <ButtonBase
                                        key={`${m.source}:${m.publicId}`}
                                        onClick={() => setSelected(m)}
                                        title={`${m.date} • ${m.sessionType}`}
                                        sx={{
                                            display: "block",
                                            width: "100%",
                                            overflow: "hidden",
                                            border: 1,
                                            borderColor: "divider",
                                            borderRadius: 2,
                                            bgcolor: "background.default",
                                            textAlign: "left",
                                        }}
                                    >
                                        {isImage ? (
                                            <Box
                                                component="img"
                                                src={m.url}
                                                alt={m.publicId}
                                                loading="lazy"
                                                sx={{
                                                    display: "block",
                                                    width: "100%",
                                                    height: 96,
                                                    objectFit: "cover",
                                                }}
                                            />
                                        ) : (
                                            <Box
                                                sx={{
                                                    display: "grid",
                                                    placeItems: "center",
                                                    height: 96,
                                                    px: 1,
                                                    color: "text.secondary",
                                                    fontSize: 12,
                                                }}
                                            >
                                                {t("dashboard.media.video")}
                                            </Box>
                                        )}
                                    </ButtonBase>
                                );
                            })}
                        </Box>
                    ) : null}
                </AppCard>
            </Box>

            {selected ? <MediaViewerModal item={selected} onClose={() => setSelected(null)} /> : null}
        </AppPage>
    );
}

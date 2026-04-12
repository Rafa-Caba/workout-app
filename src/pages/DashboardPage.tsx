// src/pages/DashboardPage.tsx
import React from "react";

import { useAuthStore } from "@/state/auth.store";
import { useDashboard } from "@/hooks/useDashboard";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
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
        <div className="space-y-6">
            <PageHeader
                title={
                    <div className="space-y-1">
                        <div className="text-2xl font-semibold tracking-tight">
                            {t("dashboard.welcome", { name })}
                        </div>
                        <div className="text-sm text-muted-foreground">
                            {t("dashboard.todayLabel")}{" "}
                            <span className="font-mono">{d.today}</span> · {todayLabel} ·{" "}
                            {t("dashboard.weekLabel")}{" "}
                            <span className="font-mono">{d.weekKey}</span>
                        </div>
                    </div>
                }
            />

            {d.error ? (
                <Card className="border-destructive/30">
                    <CardHeader>
                        <CardTitle className="text-base">{t("common.errorTitle")}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                        {getErrorMessage(d.error, t("dashboard.loadError"))}
                    </CardContent>
                </Card>
            ) : null}

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">{t("dashboard.last7.title")}</CardTitle>
                    <div className="text-xs text-muted-foreground">
                        {t("dashboard.last7.range")}{" "}
                        <span className="font-mono">{d.range.from}</span> →{" "}
                        <span className="font-mono">{d.range.to}</span>
                    </div>
                </CardHeader>

                <CardContent className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl border bg-primary/5 border-primary/20 p-4">
                        <div className="text-sm font-semibold">
                            {t("dashboard.training.title")}
                        </div>
                        <div className="mt-2 grid gap-1 text-sm text-muted-foreground">
                            <div>
                                {t("dashboard.training.sessions")}{" "}
                                <span className="text-foreground">
                                    {formatDashboardNumber(rangeTraining?.sessionsCount ?? 0)}
                                </span>
                            </div>
                            <div>
                                {t("dashboard.training.duration")}{" "}
                                <span className="text-foreground">
                                    {secondsToHhMm(rangeTraining?.durationSeconds ?? 0)}
                                </span>
                            </div>
                            <div>
                                {t("dashboard.training.activeKcal")}{" "}
                                <span className="text-foreground">
                                    {formatDashboardNumber(rangeTraining?.activeKcal)}
                                </span>
                            </div>
                            <div>
                                {t("dashboard.training.hr")}{" "}
                                <span className="text-foreground">
                                    {formatDashboardNumber(rangeTraining?.avgHr)}
                                </span>{" "}
                                · {t("dashboard.training.maxHr")}{" "}
                                <span className="text-foreground">
                                    {formatDashboardNumber(rangeTraining?.maxHr)}
                                </span>
                            </div>
                            <div>
                                {t("dashboard.training.media")}{" "}
                                <span className="text-foreground">
                                    {formatDashboardNumber(rangeTraining?.mediaCount ?? 0)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border bg-primary/5 border-primary/20 p-4">
                        <div className="text-sm font-semibold">
                            {t("dashboard.sleep.title")}
                        </div>
                        <div className="mt-2 grid gap-1 text-sm text-muted-foreground">
                            <div>
                                {t("dashboard.sleep.daysWithSleep")}{" "}
                                <span className="text-foreground">
                                    {formatDashboardNumber(rangeSleep?.daysWithSleep ?? 0)}
                                </span>
                            </div>
                            <div>
                                {t("dashboard.sleep.avgTotal")}{" "}
                                <span className="text-foreground">
                                    {rangeSleep?.avgTotalMinutes
                                        ? minutesToHhMm(rangeSleep.avgTotalMinutes)
                                        : "—"}
                                </span>
                            </div>
                            <div>
                                {t("dashboard.sleep.avgDeep")}{" "}
                                <span className="text-foreground">
                                    {formatDashboardNumber(rangeSleep?.avgDeepMinutes)}
                                </span>{" "}
                                min
                            </div>
                            <div>
                                {t("dashboard.sleep.avgRem")}{" "}
                                <span className="text-foreground">
                                    {formatDashboardNumber(rangeSleep?.avgRemMinutes)}
                                </span>{" "}
                                min
                            </div>
                            <div>
                                {t("dashboard.sleep.avgScore")}{" "}
                                <span className="text-foreground">
                                    {formatDashboardNumber(rangeSleep?.avgScore)}
                                </span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">
                            {t("dashboard.todayCard.title")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {!day && d.isLoading ? (
                            <div className="text-sm text-muted-foreground">
                                {t("common.loading")}
                            </div>
                        ) : null}

                        {!day && !d.isLoading ? (
                            <div className="text-sm text-muted-foreground">
                                {t("dashboard.todayCard.empty")}
                            </div>
                        ) : null}

                        {day ? (
                            <div className="space-y-3">
                                <div className="text-xs text-muted-foreground">
                                    {t("dashboard.todayCard.date")}{" "}
                                    <span className="font-mono">{day.date}</span> ·{" "}
                                    {t("dashboard.todayCard.weekKey")}{" "}
                                    <span className="font-mono">
                                        {day.weekKey ?? "—"}
                                    </span>
                                </div>

                                <div className="rounded-xl border bg-primary/5 border-primary/20 p-3">
                                    <div className="text-sm font-semibold">
                                        {t("dashboard.training.title")}
                                    </div>
                                    <div className="mt-2 grid gap-1 text-sm text-muted-foreground">
                                        <div>
                                            {t("dashboard.training.sessions")}{" "}
                                            <span className="text-foreground">
                                                {formatDashboardNumber(day.training.sessionsCount)}
                                            </span>
                                        </div>
                                        <div>
                                            {t("dashboard.training.duration")}{" "}
                                            <span className="text-foreground">
                                                {secondsToHhMm(day.training.durationSeconds)}
                                            </span>
                                        </div>
                                        <div>
                                            {t("dashboard.training.activeKcal")}{" "}
                                            <span className="text-foreground">
                                                {formatDashboardNumber(day.training.activeKcal)}
                                            </span>
                                        </div>
                                        <div>
                                            {t("dashboard.training.hr")}{" "}
                                            <span className="text-foreground">
                                                {formatDashboardNumber(day.training.avgHr)}
                                            </span>{" "}
                                            · {t("dashboard.training.maxHr")}{" "}
                                            <span className="text-foreground">
                                                {formatDashboardNumber(day.training.maxHr)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-xl border bg-accent/10 border-accent/25 p-3">
                                    <div className="text-sm font-semibold">
                                        {t("dashboard.sleep.title")}
                                    </div>

                                    {!day.sleep ? (
                                        <div className="mt-2 text-sm text-muted-foreground">
                                            {t("dashboard.sleep.noData")}
                                        </div>
                                    ) : (
                                        <div className="mt-2 grid gap-1 text-sm text-muted-foreground">
                                            <div>
                                                {t("dashboard.sleep.total")}{" "}
                                                <span className="text-foreground">
                                                    {day.sleep.totalMinutes
                                                        ? minutesToHhMm(day.sleep.totalMinutes)
                                                        : "—"}
                                                </span>
                                            </div>
                                            <div>
                                                {t("dashboard.sleep.deep")}{" "}
                                                <span className="text-foreground">
                                                    {formatDashboardNumber(day.sleep.deepMinutes)}
                                                </span>{" "}
                                                min · {t("dashboard.sleep.rem")}{" "}
                                                <span className="text-foreground">
                                                    {formatDashboardNumber(day.sleep.remMinutes)}
                                                </span>{" "}
                                                min
                                            </div>
                                            <div>
                                                {t("dashboard.sleep.score")}{" "}
                                                <span className="text-foreground">
                                                    {formatDashboardNumber(day.sleep.score)}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : null}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">
                            {t("dashboard.thisWeek.title")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {!week && d.isLoading ? (
                            <div className="text-sm text-muted-foreground">
                                {t("common.loading")}
                            </div>
                        ) : null}

                        {!week && !d.isLoading ? (
                            <div className="text-sm text-muted-foreground">
                                {t("dashboard.thisWeek.empty")}
                            </div>
                        ) : null}

                        {week ? (
                            <div className="space-y-3">
                                <div className="text-xs text-muted-foreground">
                                    <span className="font-mono">{week.weekKey}</span> ·{" "}
                                    {week.range.from} → {week.range.to}
                                </div>

                                <div className="rounded-xl border bg-primary/5 border-primary/20 p-3">
                                    <div className="text-sm font-semibold">
                                        {t("dashboard.thisWeek.summaryTitle")}
                                    </div>
                                    <div className="mt-2 grid gap-1 text-sm text-muted-foreground">
                                        <div>
                                            {t("dashboard.training.sessions")}{" "}
                                            <span className="text-foreground">
                                                {formatDashboardNumber(week.training.sessionsCount)}
                                            </span>
                                        </div>
                                        <div>
                                            {t("dashboard.training.duration")}{" "}
                                            <span className="text-foreground">
                                                {secondsToHhMm(week.training.durationSeconds)}
                                            </span>
                                        </div>
                                        <div>
                                            {t("dashboard.training.activeKcal")}{" "}
                                            <span className="text-foreground">
                                                {formatDashboardNumber(week.training.activeKcal)}
                                            </span>
                                        </div>
                                        <div>
                                            {t("dashboard.training.hr")}{" "}
                                            <span className="text-foreground">
                                                {formatDashboardNumber(week.training.avgHr)}
                                            </span>{" "}
                                            · {t("dashboard.training.maxHr")}{" "}
                                            <span className="text-foreground">
                                                {formatDashboardNumber(week.training.maxHr)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-xl border bg-accent/10 border-accent/25 p-3">
                                    <div className="text-sm font-semibold">
                                        {t("dashboard.thisWeek.trendTitle")}
                                    </div>
                                    {!trendPoint ? (
                                        <div className="mt-2 text-sm text-muted-foreground">
                                            {t("dashboard.thisWeek.noTrend")}
                                        </div>
                                    ) : (
                                        <div className="mt-2 text-sm text-muted-foreground">
                                            {t("dashboard.thisWeek.daysLogged")}{" "}
                                            <span className="text-foreground">
                                                {formatDashboardNumber(trendPoint.daysCount)}
                                            </span>{" "}
                                            · {t("dashboard.thisWeek.media")}{" "}
                                            <span className="text-foreground">
                                                {formatDashboardNumber(trendPoint.mediaCount)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : null}
                    </CardContent>
                </Card>

                <ProgressExercisePreviewCard
                    data={progress.data ?? null}
                    isLoading={progress.isLoading}
                />

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">
                            {t("dashboard.streak.title")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {!streaks && d.isLoading ? (
                            <div className="text-sm text-muted-foreground">
                                {t("common.loading")}
                            </div>
                        ) : null}

                        {!streaks && !d.isLoading ? (
                            <div className="text-sm text-muted-foreground">
                                {t("dashboard.streak.empty")}
                            </div>
                        ) : null}

                        {streaks ? (
                            <div className="space-y-2 rounded-xl border bg-primary/5 border-primary/20 p-4">
                                <div className="text-xs text-muted-foreground">
                                    {t("dashboard.streak.asOf")}{" "}
                                    <span className="font-mono">
                                        {streaks.asOf}
                                    </span>
                                </div>
                                <div className="text-4xl font-extrabold tracking-tight text-primary">
                                    {formatDashboardNumber(streaks.currentStreakDays)}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {t("dashboard.streak.days")}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {t("dashboard.streak.longest")}{" "}
                                    <span className="text-foreground">
                                        {formatDashboardNumber(streaks.longestStreakDays)}
                                    </span>{" "}
                                    · {t("dashboard.streak.lastDay")}{" "}
                                    <span className="text-foreground">
                                        {streaks.lastQualifiedDate ?? "—"}
                                    </span>
                                </div>
                            </div>
                        ) : null}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">
                            {t("dashboard.media.title")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {d.isLoading && media.length === 0 ? (
                            <div className="text-sm text-muted-foreground">
                                {t("common.loading")}
                            </div>
                        ) : null}

                        {!d.isLoading && media.length === 0 ? (
                            <div className="text-sm text-muted-foreground">
                                {t("dashboard.media.empty")}
                            </div>
                        ) : null}

                        {media.length > 0 ? (
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                {media.map((m) => {
                                    const isImage = m.resourceType === "image";

                                    return (
                                        <button
                                            key={`${m.source}:${m.publicId}`}
                                            type="button"
                                            onClick={() => setSelected(m)}
                                            className={cn(
                                                "block overflow-hidden rounded-xl border bg-card text-left",
                                                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                            )}
                                            title={`${m.date} • ${m.sessionType}`}
                                        >
                                            {isImage ? (
                                                <img
                                                    src={m.url}
                                                    alt={m.publicId}
                                                    className="h-24 w-full object-cover sm:h-24"
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className="flex h-24 w-full items-center justify-center text-xs text-muted-foreground">
                                                    {t("dashboard.media.video")}
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        ) : null}
                    </CardContent>
                </Card>
            </div>

            {selected ? <MediaViewerModal item={selected} onClose={() => setSelected(null)} /> : null}
        </div>
    );
}
// src/components/dayExplorer/DayTrainingMetaPanel.tsx

import React from "react";
import type {
    TrainingBlock,
    WorkoutActivityType,
    WorkoutSession,
} from "@/types/workoutDay.types";
import { cn } from "@/lib/utils";
import { themedPanelCard, themedPill } from "@/theme/cardHierarchy";

type TFn = (key: any, vars?: any) => string;

function isFiniteNumber(n: unknown): n is number {
    return typeof n === "number" && Number.isFinite(n);
}

function sumMedia(sessions: WorkoutSession[]): number {
    let total = 0;

    for (const session of sessions) {
        if (Array.isArray(session.media)) total += session.media.length;
    }

    return total;
}

function isOutdoorActivityType(value: WorkoutActivityType): boolean {
    return value === "walking" || value === "running";
}

function splitSessions(sessions: WorkoutSession[]): {
    gymSessions: WorkoutSession[];
    outdoorSessions: WorkoutSession[];
} {
    return {
        gymSessions: sessions.filter((session) => !isOutdoorActivityType(session.activityType)),
        outdoorSessions: sessions.filter((session) => isOutdoorActivityType(session.activityType)),
    };
}

export function DayTrainingMetaPanel({
    t,
    training,
}: {
    t: TFn;
    training: TrainingBlock | null;
}) {
    if (!training) {
        return (
            <div className={cn("w-full min-w-0 rounded-2xl border p-4", themedPanelCard)}>
                <div className="text-sm text-muted-foreground">{t("days.training.empty")}</div>
            </div>
        );
    }

    const sessions: WorkoutSession[] = Array.isArray(training.sessions) ? training.sessions : [];
    const mediaTotal = sumMedia(sessions);
    const { gymSessions, outdoorSessions } = splitSessions(sessions);

    const source = training.source?.trim() ? training.source.trim() : null;
    const dayRpe = isFiniteNumber(training.dayEffortRpe)
        ? `${Math.round(training.dayEffortRpe)}`
        : null;

    return (
        <div className={cn("w-full min-w-0 rounded-2xl border p-4", themedPanelCard)}>
            <div className="min-w-0 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm font-semibold">{t("days.training.title")}</div>

                <div className="min-w-0 flex flex-wrap gap-2">
                    <span className={cn("inline-flex min-w-0 items-center gap-2 rounded-full border px-3 py-1 text-xs", themedPill)}>
                        <span aria-hidden="true" className="shrink-0">🏋️</span>
                        <span className="text-muted-foreground">{t("days.training.sessions")}:</span>
                        <span className="font-mono tabular-nums text-foreground">{gymSessions.length}</span>
                    </span>

                    <span className={cn("inline-flex min-w-0 items-center gap-2 rounded-full border px-3 py-1 text-xs", themedPill)}>
                        <span aria-hidden="true" className="shrink-0">🚶</span>
                        <span className="text-muted-foreground">{t("days.training.outdoorSessions")}:</span>
                        <span className="font-mono tabular-nums text-foreground">{outdoorSessions.length}</span>
                    </span>

                    <span className={cn("inline-flex min-w-0 items-center gap-2 rounded-full border px-3 py-1 text-xs", themedPill)}>
                        <span aria-hidden="true" className="shrink-0">📎</span>
                        <span className="text-muted-foreground">{t("days.training.mediaTotal")}:</span>
                        <span className="font-mono tabular-nums text-foreground">{mediaTotal}</span>
                    </span>

                    {source ? (
                        <span className={cn("inline-flex min-w-0 items-center gap-2 rounded-full border px-3 py-1 text-xs", themedPill)}>
                            <span aria-hidden="true" className="shrink-0">🔌</span>
                            <span className="shrink-0 text-muted-foreground">{t("days.training.source")}:</span>
                            <span
                                className="min-w-0 max-w-48 truncate font-mono text-foreground sm:max-w-[16rem] md:max-w-[20rem]"
                                title={source}
                            >
                                {source}
                            </span>
                        </span>
                    ) : null}

                    {dayRpe ? (
                        <span className={cn("inline-flex min-w-0 items-center gap-2 rounded-full border px-3 py-1 text-xs", themedPill)}>
                            <span aria-hidden="true" className="shrink-0">🎯</span>
                            <span className="text-muted-foreground">{t("days.training.dayRpe")}:</span>
                            <span className="font-mono tabular-nums text-foreground">{dayRpe}</span>
                        </span>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
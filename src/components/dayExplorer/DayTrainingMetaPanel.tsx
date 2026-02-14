import React from "react";
import type { TrainingBlock, WorkoutSession } from "@/types/workoutDay.types";

type TFn = (key: any, vars?: any) => string;

function isFiniteNumber(n: unknown): n is number {
    return typeof n === "number" && Number.isFinite(n);
}

function sumMedia(sessions: WorkoutSession[]): number {
    let total = 0;
    for (const s of sessions) {
        if (Array.isArray(s.media)) total += s.media.length;
    }
    return total;
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
            <div className="rounded-2xl border bg-card p-4">
                <div className="text-sm text-muted-foreground">{t("days.training.empty")}</div>
            </div>
        );
    }

    const sessions: WorkoutSession[] = Array.isArray(training.sessions) ? training.sessions : [];
    const mediaTotal = sumMedia(sessions);

    const source = training.source?.trim() ? training.source.trim() : null;
    const dayRpe = isFiniteNumber(training.dayEffortRpe) ? `${Math.round(training.dayEffortRpe)}` : null;

    return (
        <div className="rounded-2xl border bg-card p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm font-semibold">{t("days.training.title")}</div>

                <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs">
                        <span aria-hidden="true">🏋️</span>
                        <span className="text-muted-foreground">{t("days.training.sessions")}:</span>
                        <span className="font-mono tabular-nums text-foreground">{sessions.length}</span>
                    </span>

                    <span className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs">
                        <span aria-hidden="true">📎</span>
                        <span className="text-muted-foreground">{t("days.training.mediaTotal")}:</span>
                        <span className="font-mono tabular-nums text-foreground">{mediaTotal}</span>
                    </span>

                    {source ? (
                        <span className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs">
                            <span aria-hidden="true">🔌</span>
                            <span className="text-muted-foreground">{t("days.training.source")}:</span>
                            <span className="font-mono text-foreground truncate max-w-[45]" title={source}>
                                {source}
                            </span>
                        </span>
                    ) : null}

                    {dayRpe ? (
                        <span className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs">
                            <span aria-hidden="true">🎯</span>
                            <span className="text-muted-foreground">{t("days.training.dayRpe")}:</span>
                            <span className="font-mono tabular-nums text-foreground">{dayRpe}</span>
                        </span>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

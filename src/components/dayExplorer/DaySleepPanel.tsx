import React from "react";
import type { WorkoutDay, WorkoutSession } from "@/types/workoutDay.types";
import { BadgePill } from "@/components/dayExplorer/BadgePill";

type TFn = (key: any, vars?: any) => string;

type AnyRecord = Record<string, unknown>;

function isRecord(v: unknown): v is AnyRecord {
    return typeof v === "object" && v !== null && !Array.isArray(v);
}

function pickNumber(obj: AnyRecord, keys: string[]): number | null {
    for (const k of keys) {
        const v = obj[k];
        if (typeof v === "number" && Number.isFinite(v)) return v;
    }
    return null;
}

function isFiniteNumber(n: unknown): n is number {
    return typeof n === "number" && Number.isFinite(n);
}

function formatMinutes(min: number | null): string | null {
    if (!isFiniteNumber(min) || min <= 0) return null;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${h}h ${m}m`;
}

function formatPercent(p: number | null): string | null {
    if (!isFiniteNumber(p) || p < 0) return null;
    return `${Math.round(p)}%`;
}

function clamp(n: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, n));
}

function computeAvgRpeFromSessions(sessions: WorkoutSession[]): number | null {
    const vals = sessions
        .map((s) => s.effortRpe)
        .filter((v): v is number => typeof v === "number" && Number.isFinite(v));

    if (!vals.length) return null;
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    return Math.round(avg * 10) / 10; // 1 decimal
}

/**
 * Recovery readiness heuristic (0-100):
 * - Base: Sleep score (0..100)
 * - Penalty: RPE above 6 penalizes more
 * - Bonus: RPE <= 5 slightly boosts (good recovery day)
 */
function computeReadiness(sleepScore: number | null, rpe: number | null): number | null {
    if (!isFiniteNumber(sleepScore)) return null;

    let value = sleepScore;

    if (isFiniteNumber(rpe)) {
        if (rpe >= 6) {
            // heavier day => reduce readiness
            value -= (rpe - 5) * 6; // rpe 8 => -18, rpe 10 => -30
        } else {
            // easy day => small boost
            value += (5 - rpe) * 2; // rpe 3 => +4
        }
    }

    return Math.round(clamp(value, 0, 100));
}

export function DaySleepPanel({ t, day }: { t: TFn; day: WorkoutDay }) {
    const sleep = day.sleep ?? null;

    // Always render; use null-safe values.
    const timeAsleepMin = sleep?.timeAsleepMinutes ?? null;
    const score = sleep?.score ?? null;

    const remMin = sleep?.remMinutes ?? null;
    const deepMin = sleep?.deepMinutes ?? null;
    const coreMin = sleep?.coreMinutes ?? null;
    const awakeMin = sleep?.awakeMinutes ?? null;

    const total = formatMinutes(timeAsleepMin);
    const scoreText = isFiniteNumber(score) ? `${Math.round(score)}` : null;

    // Percent of time asleep
    const remPct =
        isFiniteNumber(remMin) && isFiniteNumber(timeAsleepMin) && timeAsleepMin > 0
            ? (remMin / timeAsleepMin) * 100
            : null;

    const deepPct =
        isFiniteNumber(deepMin) && isFiniteNumber(timeAsleepMin) && timeAsleepMin > 0
            ? (deepMin / timeAsleepMin) * 100
            : null;

    // Efficiency needs time in bed (try reading from raw)
    let inBedMinutes: number | null = null;
    if (sleep?.raw && isRecord(sleep.raw)) {
        inBedMinutes =
            pickNumber(sleep.raw, [
                "timeInBedMinutes",
                "inBedMinutes",
                "totalInBedMinutes",
                "timeInBed",
                "totalInBed",
            ]) ?? null;
    }

    const efficiencyPct =
        isFiniteNumber(timeAsleepMin) && isFiniteNumber(inBedMinutes) && inBedMinutes > 0
            ? (timeAsleepMin / inBedMinutes) * 100
            : null;

    // RPE for readiness
    const sessions: WorkoutSession[] = Array.isArray(day.training?.sessions)
        ? (day.training!.sessions as WorkoutSession[])
        : [];

    const dayRpe =
        isFiniteNumber(day.training?.dayEffortRpe) ? (day.training!.dayEffortRpe as number) : computeAvgRpeFromSessions(sessions);

    const readiness = computeReadiness(score, dayRpe);

    return (
        <div className="w-full min-w-0 rounded-2xl border bg-card p-4 space-y-3">
            <div className="min-w-0 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <div className="text-sm font-semibold">{t("days.sleep.title")}</div>

                {!sleep ? (
                    <div className="text-xs text-muted-foreground">{t("days.sleep.empty")}</div>
                ) : null}
            </div>

            <div className="w-full min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <BadgePill emoji="🛌" label={t("days.sleep.total")} value={total} />
                <BadgePill emoji="🏆" label={t("days.sleep.score")} value={scoreText} />

                <BadgePill emoji="💤" label={t("days.sleep.efficiency")} value={formatPercent(efficiencyPct)} />
                <BadgePill emoji="🔁" label={t("days.sleep.readiness")} value={isFiniteNumber(readiness) ? `${readiness}` : null} />

                <BadgePill emoji="🧠" label={t("days.sleep.remPct")} value={formatPercent(remPct)} />
                <BadgePill emoji="🌙" label={t("days.sleep.deepPct")} value={formatPercent(deepPct)} />

                <BadgePill emoji="💤" label={t("days.sleep.core")} value={formatMinutes(coreMin)} />
                <BadgePill emoji="⏱" label={t("days.sleep.awake")} value={formatMinutes(awakeMin)} />

                <BadgePill emoji="📡" label={t("days.sleep.source")} value={sleep?.source ?? null} />
            </div>
        </div>
    );
}

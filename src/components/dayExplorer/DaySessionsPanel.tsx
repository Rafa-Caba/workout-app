import React from "react";
import { format } from "date-fns";
import type {
    WorkoutDay,
    WorkoutMediaItem,
    WorkoutSession,
    WorkoutExercise,
    WorkoutExerciseSet,
} from "@/types/workoutDay.types";
import type { MediaLikeItem } from "@/components/media/MediaViewerModal";
import { BadgePill } from "@/components/dayExplorer/BadgePill";

type TFn = (key: any, vars?: any) => string;

function isFiniteNumber(n: unknown): n is number {
    return typeof n === "number" && Number.isFinite(n);
}

function formatDuration(seconds: number | null): string | null {
    if (!isFiniteNumber(seconds) || seconds <= 0) return null;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}

function formatTime(iso: string | null): string | null {
    if (!iso) return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return format(d, "HH:mm");
}

function formatPace(secPerKm: number | null): string | null {
    if (!isFiniteNumber(secPerKm) || secPerKm <= 0) return null;
    const total = Math.round(secPerKm);
    const mm = Math.floor(total / 60);
    const ss = total % 60;
    return `${mm}:${String(ss).padStart(2, "0")}`;
}

function shortId(id: string | null | undefined): string | null {
    const v = (id ?? "").trim();
    if (!v) return null;
    if (v.length <= 8) return v;
    return `${v.slice(0, 4)}…${v.slice(-4)}`;
}

function countSets(exercises: WorkoutExercise[] | null): number {
    if (!Array.isArray(exercises) || !exercises.length) return 0;
    let total = 0;
    for (const ex of exercises) {
        const sets = ex.sets ?? null;
        if (Array.isArray(sets)) total += sets.length;
    }
    return total;
}

function countLoggedSets(exercises: WorkoutExercise[] | null): number {
    if (!Array.isArray(exercises) || !exercises.length) return 0;
    let total = 0;
    for (const ex of exercises) {
        const sets = ex.sets ?? null;
        if (!Array.isArray(sets)) continue;
        for (const s of sets) {
            // count as "logged" if it has reps or weight or rpe filled
            const reps = (s as WorkoutExerciseSet).reps;
            const weight = (s as WorkoutExerciseSet).weight;
            const rpe = (s as WorkoutExerciseSet).rpe;
            if (isFiniteNumber(reps) || isFiniteNumber(weight) || isFiniteNumber(rpe)) total += 1;
        }
    }
    return total;
}

function toMediaLikeItem(
    media: WorkoutMediaItem,
    ctx: { date: string; sessionType: string; source: "day" | "routine" }
): MediaLikeItem {
    return {
        url: media.url,
        publicId: media.publicId,
        resourceType: media.resourceType,
        format: media.format ?? null,
        createdAt: media.createdAt ?? null,
        date: ctx.date,
        sessionType: ctx.sessionType,
        source: ctx.source,
        meta: media.meta ?? null,
        originalName: null,
    };
}

/**
 * Defensive: dedupe sessions by id (API should not return duplicates, but we guard the UI).
 * Keeps the first occurrence and preserves order.
 */
function dedupeSessionsById(sessions: WorkoutSession[]): WorkoutSession[] {
    const seen = new Set<string>();
    const out: WorkoutSession[] = [];

    for (const s of sessions) {
        const id = typeof s?.id === "string" ? s.id.trim() : "";
        if (!id) {
            // If id is missing, keep it (rare) but it must have a stable key later.
            out.push(s);
            continue;
        }
        if (seen.has(id)) continue;
        seen.add(id);
        out.push(s);
    }

    return out;
}

function buildSessionKey(s: WorkoutSession, index: number): string {
    const id = typeof s?.id === "string" ? s.id.trim() : "";
    if (id) return id;

    // fallback for rare cases when id is missing
    const createdAt =
        typeof (s as any)?.createdAt === "string" ? String((s as any).createdAt) : "";
    const type = typeof s?.type === "string" ? s.type : "session";
    return `${type}:${createdAt || "no_createdAt"}:${index}`;
}

export function DaySessionsPanel({
    t,
    day,
    onOpenMedia,
}: {
    t: TFn;
    day: WorkoutDay;
    onOpenMedia: (item: MediaLikeItem) => void;
}) {
    const sessionsRaw: WorkoutSession[] = Array.isArray(day.training?.sessions)
        ? (day.training!.sessions as WorkoutSession[])
        : [];

    const sessions = React.useMemo(() => dedupeSessionsById(sessionsRaw), [sessionsRaw]);

    const trainingSource = day.training?.source ?? null;
    const dayRpe = day.training?.dayEffortRpe ?? null;

    if (!sessions.length) {
        return (
            <div className="w-full min-w-0 rounded-2xl border bg-card p-4">
                <div className="text-sm text-muted-foreground">{t("days.sessions.empty")}</div>
            </div>
        );
    }

    return (
        <div className="w-full min-w-0 space-y-3">
            <div className="min-w-0 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="text-sm font-semibold">{t("days.sessions.title")}</div>

                {(trainingSource || isFiniteNumber(dayRpe)) ? (
                    <div className="min-w-0 flex flex-wrap gap-2">
                        {trainingSource ? (
                            <span className="text-xs text-muted-foreground wrap-break-words">
                                {t("days.training.source")}:{" "}
                                <span className="font-mono text-foreground break-all">{trainingSource}</span>
                            </span>
                        ) : null}

                        {isFiniteNumber(dayRpe) ? (
                            <span className="text-xs text-muted-foreground">
                                {t("days.training.dayRpe")}:{" "}
                                <span className="font-mono text-foreground">{Math.round(dayRpe)}</span>
                            </span>
                        ) : null}
                    </div>
                ) : null}
            </div>

            <div className="space-y-3">
                {sessions.map((s, idx) => {
                    const sessionTitle = s.type?.trim() || t("days.sessions.unknownType");

                    const dur = formatDuration(s.durationSeconds ?? null);
                    const mediaCount = Array.isArray(s.media) ? s.media.length : 0;

                    const kcalActive = isFiniteNumber(s.activeKcal) ? `${Math.round(s.activeKcal)}` : null;
                    const kcalTotal = isFiniteNumber(s.totalKcal) ? `${Math.round(s.totalKcal)}` : null;

                    const hrAvg = isFiniteNumber(s.avgHr) ? `${Math.round(s.avgHr)}` : null;
                    const hrMax = isFiniteNumber(s.maxHr) ? `${Math.round(s.maxHr)}` : null;

                    const steps = isFiniteNumber(s.steps) ? `${Math.round(s.steps).toLocaleString()}` : null;
                    const dist = isFiniteNumber(s.distanceKm) ? `${Number(s.distanceKm).toFixed(2)}` : null;

                    const elev = isFiniteNumber(s.elevationGainM) ? `${Math.round(s.elevationGainM)}` : null;
                    const pace = formatPace(s.paceSecPerKm ?? null);
                    const cadence = isFiniteNumber(s.cadenceRpm) ? `${Math.round(s.cadenceRpm)}` : null;

                    const rpe = isFiniteNumber(s.effortRpe) ? `${Math.round(s.effortRpe)}` : null;

                    const startAt = formatTime(s.startAt ?? null);
                    const endAt = formatTime(s.endAt ?? null);

                    const sid = shortId(s.id);

                    const exercises = Array.isArray(s.exercises) ? s.exercises : null;
                    const exercisesCount = exercises ? exercises.length : 0;
                    const setsCount = countSets(exercises);
                    const loggedSets = countLoggedSets(exercises);

                    return (
                        <div key={buildSessionKey(s, idx)} className="w-full min-w-0 rounded-2xl border bg-card overflow-hidden">
                            <div className="p-4 border-b">
                                {/* stack on mobile to avoid squeezing badges */}
                                <div className="min-w-0 flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                                    <div className="min-w-0 w-full">
                                        <div className="min-w-0 flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                                            <div className="min-w-0 text-base font-semibold wrap-break-words sm:truncate">
                                                {t("days.sessions.dayPrefix")} {sessionTitle}
                                            </div>

                                            {sid ? (
                                                <div className="text-xs text-muted-foreground wrap-break-words">
                                                    {t("days.sessions.sessionId")}:{" "}
                                                    <span className="font-mono text-foreground break-all">{sid}</span>
                                                </div>
                                            ) : null}
                                        </div>

                                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full min-w-0">
                                            <BadgePill emoji="⏱️" label={t("days.sessions.duration")} value={dur} />
                                            <BadgePill emoji="📎" label={t("days.sessions.media")} value={`${mediaCount}`} />

                                            <BadgePill
                                                emoji="🔥"
                                                label={t("days.sessions.activeKcal")}
                                                value={kcalActive ? `${kcalActive} ${t("days.sessions.kcal")}` : null}
                                            />
                                            <BadgePill
                                                emoji="🧮"
                                                label={t("days.sessions.totalKcal")}
                                                value={kcalTotal ? `${kcalTotal} ${t("days.sessions.kcal")}` : null}
                                            />

                                            <BadgePill emoji="❤️" label={t("days.sessions.avgHr")} value={hrAvg} />
                                            <BadgePill emoji="⬆️" label={t("days.sessions.maxHr")} value={hrMax} />

                                            <BadgePill emoji="🚶" label={t("days.sessions.stepsLabel")} value={steps} />
                                            <BadgePill
                                                emoji="📏"
                                                label={t("days.sessions.distanceLabel")}
                                                value={dist ? `${dist} ${t("days.sessions.distanceKm")}` : null}
                                            />

                                            <BadgePill
                                                emoji="⛰️"
                                                label={t("days.sessions.elevationLabel")}
                                                value={elev ? `${elev} ${t("days.sessions.elevationM")}` : null}
                                            />
                                            <BadgePill
                                                emoji="⏱️"
                                                label={t("days.sessions.paceLabel")}
                                                value={pace ? `${pace} ${t("days.sessions.paceUnit")}` : null}
                                            />

                                            <BadgePill
                                                emoji="🔁"
                                                label={t("days.sessions.cadenceLabel")}
                                                value={cadence ? `${cadence} ${t("days.sessions.cadenceRpm")}` : null}
                                            />
                                            <BadgePill emoji="🎯" label={t("days.sessions.rpe")} value={rpe} />

                                            <BadgePill emoji="🟢" label={t("days.sessions.startAt")} value={startAt} />
                                            <BadgePill emoji="🔴" label={t("days.sessions.endAt")} value={endAt} />

                                            <BadgePill
                                                emoji="🏋️"
                                                label={t("days.sessions.exercises")}
                                                value={exercisesCount > 0 ? `${exercisesCount}` : null}
                                            />
                                            <BadgePill
                                                emoji="📚"
                                                label={t("days.sessions.sets")}
                                                value={setsCount > 0 ? `${loggedSets}/${setsCount}` : null}
                                            />
                                        </div>
                                    </div>

                                    {s.notes ? (
                                        <div className="w-full md:w-auto md:max-w-[45%] text-xs text-muted-foreground wrap-break-words line-clamp-3 md:text-right">
                                            {s.notes}
                                        </div>
                                    ) : null}
                                </div>
                            </div>

                            <div className="p-4 space-y-4 min-w-0">
                                {/* Exercises mini list */}
                                {exercises && exercises.length ? (
                                    <div className="space-y-2 min-w-0">
                                        <div className="text-xs font-semibold text-muted-foreground">
                                            {t("days.sessions.exercisesList")} ({exercises.length})
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 min-w-0">
                                            {exercises.slice(0, 8).map((ex) => {
                                                const setCount = Array.isArray(ex.sets) ? ex.sets.length : 0;
                                                return (
                                                    <div key={ex.id} className="min-w-0 rounded-xl border bg-background px-3 py-2">
                                                        <div className="min-w-0 text-sm font-medium wrap-break-words sm:truncate">{ex.name}</div>
                                                        <div className="min-w-0 text-xs text-muted-foreground wrap-break-words">
                                                            {t("days.sessions.sets")}:{" "}
                                                            <span className="font-mono text-foreground">{setCount || "—"}</span>
                                                            {ex.notes ? (
                                                                <span className="ml-2 text-muted-foreground line-clamp-1">
                                                                    • {ex.notes}
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {exercises.length > 8 ? (
                                            <div className="text-xs text-muted-foreground">
                                                {t("days.sessions.exercisesMore", { n: exercises.length - 8 })}
                                            </div>
                                        ) : null}
                                    </div>
                                ) : null}

                                {/* Media thumbnails */}
                                {Array.isArray(s.media) && s.media.length ? (
                                    <div className="space-y-2 min-w-0">
                                        <div className="text-xs font-semibold text-muted-foreground">{t("days.sessions.mediaGrid")}</div>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 min-w-0">
                                            {s.media.map((m) => {
                                                const item = toMediaLikeItem(m, {
                                                    date: day.date,
                                                    sessionType: sessionTitle,
                                                    source: "day",
                                                });

                                                const isImage = item.resourceType === "image";
                                                const isVideo = item.resourceType === "video";

                                                return (
                                                    <button
                                                        key={m.publicId}
                                                        type="button"
                                                        className="w-full min-w-0 rounded-lg border bg-background overflow-hidden hover:shadow-sm transition-shadow"
                                                        onClick={() => onOpenMedia(item)}
                                                        title={m.publicId}
                                                    >
                                                        <div className="aspect-square w-full flex items-center justify-center bg-black/5 overflow-hidden">
                                                            {isImage ? (
                                                                <img src={item.url} alt={m.publicId} className="h-full w-full object-cover" />
                                                            ) : isVideo ? (
                                                                <video src={item.url} className="h-full w-full object-cover" muted playsInline />
                                                            ) : (
                                                                <span className="px-2 text-xs text-muted-foreground">{t("media.open")}</span>
                                                            )}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-xs text-muted-foreground">{t("days.sessions.noMedia")}</div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

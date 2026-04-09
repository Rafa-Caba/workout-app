// src/components/dayExplorer/DaySessionsPanel.tsx

import React from "react";
import { format } from "date-fns";

import type {
    WorkoutActivityType,
    WorkoutDay,
    WorkoutExercise,
    WorkoutExerciseSet,
    WorkoutMediaItem,
    WorkoutSession,
    WorkoutSessionMeta,
} from "@/types/workoutDay.types";
import type { MediaLikeItem } from "@/components/media/MediaViewerModal";
import { BadgePill } from "@/components/dayExplorer/BadgePill";

type JsonRecord = Record<string, unknown>;
type TFn = (key: any, vars?: any) => string;

type ExercisePlanMeta = {
    sets: string | null;
    reps: string | null;
    load: string | null;
    rpe: string | null;
    attachmentPublicIds: string[] | null;
};

function isRecord(value: unknown): value is JsonRecord {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
    return typeof value === "number" && Number.isFinite(value);
}

function cleanString(value: unknown): string | null {
    if (typeof value !== "string") return null;

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}

function stringArrayOrNull(value: unknown): string[] | null {
    if (!Array.isArray(value)) return null;

    const items = value
        .map((item) => cleanString(item))
        .filter((item): item is string => Boolean(item));

    return items.length ? items : null;
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

    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return null;

    return format(date, "HH:mm");
}

function formatIsoDateTime(iso: string | null): string | null {
    if (!iso) return null;

    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return null;

    return new Intl.DateTimeFormat("es-MX", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);
}

function formatPace(secPerKm: number | null): string | null {
    if (!isFiniteNumber(secPerKm) || secPerKm <= 0) return null;

    const total = Math.round(secPerKm);
    const mm = Math.floor(total / 60);
    const ss = total % 60;

    return `${mm}:${String(ss).padStart(2, "0")}`;
}

function countSets(exercises: WorkoutExercise[] | null): number {
    if (!Array.isArray(exercises) || exercises.length === 0) return 0;

    let total = 0;

    for (const exercise of exercises) {
        const sets = exercise.sets;
        if (Array.isArray(sets)) {
            total += sets.length;
        }
    }

    return total;
}

function countLoggedSets(exercises: WorkoutExercise[] | null): number {
    if (!Array.isArray(exercises) || exercises.length === 0) return 0;

    let total = 0;

    for (const exercise of exercises) {
        const sets = exercise.sets;
        if (!Array.isArray(sets)) continue;

        for (const set of sets) {
            if (isLoggedSet(set)) {
                total += 1;
            }
        }
    }

    return total;
}

function isLoggedSet(set: WorkoutExerciseSet): boolean {
    return isFiniteNumber(set.reps) || isFiniteNumber(set.weight) || isFiniteNumber(set.rpe);
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

function dedupeSessionsById(sessions: WorkoutSession[]): WorkoutSession[] {
    const seen = new Set<string>();
    const out: WorkoutSession[] = [];

    for (const session of sessions) {
        const id = cleanString(session.id);

        if (!id) {
            out.push(session);
            continue;
        }

        if (seen.has(id)) {
            continue;
        }

        seen.add(id);
        out.push(session);
    }

    return out;
}

function buildSessionKey(session: WorkoutSession, index: number): string {
    const id = cleanString(session.id);
    if (id) return id;

    const type = cleanString(session.type) ?? "session";
    const startAt = cleanString(session.startAt) ?? "no_start";

    return `${type}:${startAt}:${index}`;
}

function getExercisePlanMeta(exercise: WorkoutExercise): ExercisePlanMeta | null {
    if (!isRecord(exercise.meta)) return null;

    const plan = exercise.meta.plan;
    if (!isRecord(plan)) return null;

    return {
        sets: cleanString(plan.sets),
        reps: cleanString(plan.reps),
        load: cleanString(plan.load),
        rpe: cleanString(plan.rpe),
        attachmentPublicIds: stringArrayOrNull(plan.attachmentPublicIds),
    };
}

function getExerciseDisplayName(exercise: WorkoutExercise): string {
    return cleanString(exercise.movementName) ?? cleanString(exercise.name) ?? "Exercise";
}

function getExerciseNotes(exercise: WorkoutExercise): string | null {
    return cleanString(exercise.notes);
}

function getExerciseRepsValue(exercise: WorkoutExercise): string | null {
    const plan = getExercisePlanMeta(exercise);
    return plan?.reps ?? null;
}

function getExerciseLoadValue(exercise: WorkoutExercise): string | null {
    const plan = getExercisePlanMeta(exercise);
    return plan?.load ?? null;
}

function getExerciseRpeValue(exercise: WorkoutExercise): string | null {
    const plan = getExercisePlanMeta(exercise);
    return plan?.rpe ?? null;
}

function getExerciseAttachmentsCount(exercise: WorkoutExercise): number {
    const plan = getExercisePlanMeta(exercise);
    return plan?.attachmentPublicIds?.length ?? 0;
}

function getExerciseActualSets(exercise: WorkoutExercise): WorkoutExerciseSet[] {
    return Array.isArray(exercise.sets) ? exercise.sets : [];
}

function getExerciseSetsDisplayValue(exercise: WorkoutExercise): string | null {
    const actualSets = getExerciseActualSets(exercise);
    const plan = getExercisePlanMeta(exercise);

    if (actualSets.length > 0) {
        return plan?.sets ? `${actualSets.length}/${plan.sets}` : String(actualSets.length);
    }

    return plan?.sets ?? null;
}

function formatActualSetChipText(set: WorkoutExerciseSet): string | null {
    const parts: string[] = [];

    if (isFiniteNumber(set.reps) && isFiniteNumber(set.weight)) {
        parts.push(`${Math.trunc(set.reps)} x ${set.weight}${set.unit}`);
    } else if (isFiniteNumber(set.reps)) {
        parts.push(`${Math.trunc(set.reps)} reps`);
    } else if (isFiniteNumber(set.weight)) {
        parts.push(`${set.weight}${set.unit}`);
    }

    if (isFiniteNumber(set.rpe)) {
        parts.push(`RPE ${set.rpe}`);
    }

    return parts.length > 0 ? parts.join(" • ") : null;
}

function getExerciseActualSetChipTexts(exercise: WorkoutExercise): string[] {
    const actualSets = getExerciseActualSets(exercise);

    return actualSets
        .map((set) => formatActualSetChipText(set))
        .filter((item): item is string => Boolean(item));
}

function isOutdoorActivityType(value: WorkoutActivityType): boolean {
    return value === "walking" || value === "running";
}

function getSessionMeta(session: WorkoutSession): WorkoutSessionMeta | null {
    return session.meta ?? null;
}

function getSessionSourceLabel(session: WorkoutSession): string | null {
    const meta = getSessionMeta(session);
    return cleanString(meta?.source);
}

function getSessionSourceDeviceLabel(session: WorkoutSession): string | null {
    const meta = getSessionMeta(session);
    return cleanString(meta?.sourceDevice);
}

function getSessionKindLabel(session: WorkoutSession): string | null {
    const meta = getSessionMeta(session);
    return cleanString(meta?.sessionKind);
}

function getSessionImportedAtLabel(session: WorkoutSession): string | null {
    const meta = getSessionMeta(session);
    return formatIsoDateTime(meta?.importedAt ?? null);
}

function getSessionLastSyncedAtLabel(session: WorkoutSession): string | null {
    const meta = getSessionMeta(session);
    return formatIsoDateTime(meta?.lastSyncedAt ?? null);
}

function getSessionExternalIdLabel(session: WorkoutSession): string | null {
    const meta = getSessionMeta(session);
    return cleanString(meta?.externalId);
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

function Metric({
    label,
    value,
}: {
    label: string;
    value: string | null;
}) {
    return (
        <div className="flex items-center justify-between gap-3 rounded-lg border bg-background px-3 py-2">
            <span className="text-xs text-muted-foreground">{label}</span>
            <span className="text-sm font-medium text-foreground">{value ?? "—"}</span>
        </div>
    );
}

function SessionCard({
    t,
    day,
    session,
    index,
    onOpenMedia,
}: {
    t: TFn;
    day: WorkoutDay;
    session: WorkoutSession;
    index: number;
    onOpenMedia: (item: MediaLikeItem) => void;
}) {
    const sessionTitle = cleanString(session.type) ?? t("days.sessions.unknownType");
    const activityType = session.activityType;
    const isOutdoor = isOutdoorActivityType(activityType);

    const duration = formatDuration(session.durationSeconds ?? null);
    const mediaCount = Array.isArray(session.media) ? session.media.length : 0;

    const activeKcal = isFiniteNumber(session.activeKcal)
        ? `${Math.round(session.activeKcal)} ${t("days.sessions.kcal")}`
        : null;

    const totalKcal = isFiniteNumber(session.totalKcal)
        ? `${Math.round(session.totalKcal)} ${t("days.sessions.kcal")}`
        : null;

    const avgHr = isFiniteNumber(session.avgHr) ? `${Math.round(session.avgHr)}` : null;
    const maxHr = isFiniteNumber(session.maxHr) ? `${Math.round(session.maxHr)}` : null;

    const steps = isFiniteNumber(session.steps)
        ? `${Math.round(session.steps).toLocaleString()}`
        : null;

    const distance = isFiniteNumber(session.distanceKm)
        ? `${session.distanceKm.toFixed(2)} ${t("days.sessions.distanceKm")}`
        : null;

    const elevation = isFiniteNumber(session.elevationGainM)
        ? `${Math.round(session.elevationGainM)} ${t("days.sessions.elevationM")}`
        : null;

    const pace = formatPace(session.paceSecPerKm ?? null);
    const cadence = isFiniteNumber(session.cadenceRpm)
        ? `${Math.round(session.cadenceRpm)} ${t("days.sessions.cadenceRpm")}`
        : null;

    const rpe = isFiniteNumber(session.effortRpe) ? `${Math.round(session.effortRpe)}` : null;

    const startAt = formatTime(session.startAt ?? null);
    const endAt = formatTime(session.endAt ?? null);

    const exercises = Array.isArray(session.exercises) ? session.exercises : null;
    const exercisesCount = exercises?.length ?? 0;
    const setsCount = countSets(exercises);
    const loggedSets = countLoggedSets(exercises);

    const routePoints = session.routeSummary?.pointCount ?? null;
    const avgSpeedKmh = session.outdoorMetrics?.avgSpeedKmh ?? null;
    const maxSpeedKmh = session.outdoorMetrics?.maxSpeedKmh ?? null;
    const strideLengthM = session.outdoorMetrics?.strideLengthM ?? null;

    const source = getSessionSourceLabel(session);
    const sourceDevice = getSessionSourceDeviceLabel(session);
    const sessionKind = getSessionKindLabel(session);
    const importedAt = getSessionImportedAtLabel(session);
    const lastSyncedAt = getSessionLastSyncedAtLabel(session);
    const externalId = getSessionExternalIdLabel(session);

    return (
        <div
            key={buildSessionKey(session, index)}
            className="w-full min-w-0 overflow-hidden rounded-2xl border bg-card"
        >
            <div className="border-b p-4">
                <div className="min-w-0 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0 w-full">
                        <div className="min-w-0 flex flex-col gap-2">
                            <div className="min-w-0 flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                                <div className="min-w-0 text-base font-semibold wrap-break-words md:truncate">
                                    {t("days.sessions.dayPrefix")} {sessionTitle}
                                </div>

                                {session.notes ? (
                                    <div className="w-full text-sm text-muted-foreground wrap-break-words md:w-auto md:max-w-full md:text-right">
                                        {session.notes}
                                    </div>
                                ) : null}
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <span className="inline-flex items-center rounded-full border bg-background px-3 py-1 text-xs text-foreground">
                                    {isOutdoor ? "🚶 Outdoor" : "🏋️ Gym / Training"}
                                </span>

                                {activityType ? (
                                    <span className="inline-flex items-center rounded-full border bg-background px-3 py-1 text-xs text-foreground">
                                        {activityType === "walking" ? "Walking" : "Running"}
                                    </span>
                                ) : null}

                                {sessionKind ? (
                                    <span className="inline-flex items-center rounded-full border bg-background px-3 py-1 text-xs text-foreground">
                                        {sessionKind}
                                    </span>
                                ) : null}

                                {source ? (
                                    <span className="inline-flex items-center rounded-full border bg-background px-3 py-1 text-xs text-foreground">
                                        {source}
                                    </span>
                                ) : null}
                            </div>

                            <div className="mt-1 grid grid-cols-1 gap-2 sm:grid-cols-2">
                                <BadgePill emoji="⏱️" label={t("days.sessions.duration")} value={duration} />
                                <BadgePill emoji="📎" label={t("days.sessions.media")} value={`${mediaCount}`} />

                                <BadgePill emoji="🔥" label={t("days.sessions.activeKcal")} value={activeKcal} />
                                <BadgePill emoji="🧮" label={t("days.sessions.totalKcal")} value={totalKcal} />

                                <BadgePill emoji="❤️" label={t("days.sessions.avgHr")} value={avgHr} />
                                <BadgePill emoji="⬆️" label={t("days.sessions.maxHr")} value={maxHr} />

                                <BadgePill emoji="🚶" label={t("days.sessions.stepsLabel")} value={steps} />
                                <BadgePill emoji="📏" label={t("days.sessions.distanceLabel")} value={distance} />

                                <BadgePill emoji="⛰️" label={t("days.sessions.elevationLabel")} value={elevation} />
                                <BadgePill
                                    emoji="⏱️"
                                    label={t("days.sessions.paceLabel")}
                                    value={pace ? `${pace} ${t("days.sessions.paceUnit")}` : null}
                                />

                                <BadgePill emoji="🔁" label={t("days.sessions.cadenceLabel")} value={cadence} />
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

                                <BadgePill
                                    emoji="⌚"
                                    label={t("days.sessions.sourceDevice")}
                                    value={sourceDevice}
                                />
                                <BadgePill
                                    emoji="⬇️"
                                    label={t("days.sessions.importedAt")}
                                    value={importedAt}
                                />

                                <BadgePill
                                    emoji="🔄"
                                    label={t("days.sessions.lastSyncedAt")}
                                    value={lastSyncedAt}
                                />
                                <BadgePill
                                    emoji="🆔"
                                    label={t("days.sessions.externalId")}
                                    value={externalId}
                                />
                            </div>

                            {isOutdoor ? (
                                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                                    <Metric
                                        label={t("days.sessions.route")}
                                        value={session.hasRoute ? t("days.sessions.routeYes") : t("days.sessions.routeNo")}
                                    />
                                    <Metric
                                        label={t("days.sessions.routePoints")}
                                        value={isFiniteNumber(routePoints) ? `${routePoints}` : null}
                                    />
                                    <Metric
                                        label={t("days.sessions.avgSpeed")}
                                        value={
                                            isFiniteNumber(avgSpeedKmh)
                                                ? `${avgSpeedKmh.toFixed(2)} ${t("days.sessions.speedUnit")}`
                                                : null
                                        }
                                    />
                                    <Metric
                                        label={t("days.sessions.maxSpeed")}
                                        value={
                                            isFiniteNumber(maxSpeedKmh)
                                                ? `${maxSpeedKmh.toFixed(2)} ${t("days.sessions.speedUnit")}`
                                                : null
                                        }
                                    />
                                    <Metric
                                        label={t("days.sessions.strideLength")}
                                        value={
                                            isFiniteNumber(strideLengthM)
                                                ? `${strideLengthM.toFixed(2)} ${t("days.sessions.strideLengthUnit")}`
                                                : null
                                        }
                                    />
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-4 p-4">
                {exercises && exercises.length > 0 ? (
                    <div className="space-y-3">
                        <div className="text-xs font-semibold text-muted-foreground">
                            {t("days.sessions.exercisesList")} ({exercises.length})
                        </div>

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            {exercises.map((exercise) => {
                                const actualSetChipTexts = getExerciseActualSetChipTexts(exercise);
                                const hasActualSets = actualSetChipTexts.length > 0;
                                const setValue = getExerciseSetsDisplayValue(exercise);
                                const repsValue = getExerciseRepsValue(exercise);
                                const loadValue = getExerciseLoadValue(exercise);
                                const rpeValue = getExerciseRpeValue(exercise);
                                const attachmentsCount = getExerciseAttachmentsCount(exercise);

                                return (
                                    <div
                                        key={exercise.id}
                                        className="min-w-0 rounded-xl border bg-background p-3"
                                    >
                                        <div className="space-y-3">
                                            <div className="space-y-1">
                                                <div className="text-sm font-semibold wrap-break-words">
                                                    {getExerciseDisplayName(exercise)}
                                                </div>

                                                {getExerciseNotes(exercise) ? (
                                                    <div className="text-xs text-muted-foreground wrap-break-words">
                                                        {getExerciseNotes(exercise)}
                                                    </div>
                                                ) : null}
                                            </div>

                                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                                <Metric
                                                    label={t("days.sessions.sets")}
                                                    value={setValue}
                                                />
                                                <Metric
                                                    label={t("days.sessions.reps")}
                                                    value={hasActualSets ? "Real" : repsValue}
                                                />
                                                <Metric
                                                    label={t("days.sessions.load")}
                                                    value={loadValue}
                                                />
                                                <Metric
                                                    label={t("days.sessions.rpe")}
                                                    value={rpeValue}
                                                />
                                            </div>

                                            {hasActualSets ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {actualSetChipTexts.map((text, chipIndex) => (
                                                        <span
                                                            key={`${exercise.id}-actual-set-${chipIndex}`}
                                                            className="inline-flex max-w-full items-center rounded-full border bg-card px-3 py-1 text-xs text-foreground"
                                                        >
                                                            <span className="truncate">{text}</span>
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : null}

                                            {attachmentsCount > 0 ? (
                                                <div className="text-xs text-muted-foreground">
                                                    {t("days.sessions.media")}: {attachmentsCount}
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : null}

                {Array.isArray(session.media) && session.media.length > 0 ? (
                    <div className="space-y-2">
                        <div className="text-xs font-semibold text-muted-foreground">
                            {t("days.sessions.mediaGrid")}
                        </div>

                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-6">
                            {session.media.map((media) => {
                                const item = toMediaLikeItem(media, {
                                    date: day.date,
                                    sessionType: sessionTitle,
                                    source: "day",
                                });

                                const isImage = item.resourceType === "image";
                                const isVideo = item.resourceType === "video";

                                return (
                                    <button
                                        key={media.publicId}
                                        type="button"
                                        className="w-full overflow-hidden rounded-lg border bg-background transition-shadow hover:shadow-sm"
                                        onClick={() => onOpenMedia(item)}
                                        title={media.publicId}
                                    >
                                        <div className="aspect-square w-full overflow-hidden bg-black/5">
                                            {isImage ? (
                                                <img
                                                    src={item.url}
                                                    alt={media.publicId}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : isVideo ? (
                                                <video
                                                    src={item.url}
                                                    className="h-full w-full object-cover"
                                                    muted
                                                    playsInline
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center px-2 text-xs text-muted-foreground">
                                                    {t("media.open")}
                                                </div>
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
    const sessionsRaw = Array.isArray(day.training?.sessions) ? day.training.sessions : [];
    const sessions = React.useMemo(() => dedupeSessionsById(sessionsRaw), [sessionsRaw]);

    const trainingSource = day.training?.source ?? null;
    const dayRpe = day.training?.dayEffortRpe ?? null;
    const { gymSessions, outdoorSessions } = React.useMemo(() => splitSessions(sessions), [sessions]);

    if (sessions.length === 0) {
        return (
            <div className="w-full min-w-0 rounded-2xl border bg-card p-4">
                <div className="text-sm text-muted-foreground">{t("days.sessions.empty")}</div>
            </div>
        );
    }

    return (
        <div className="w-full min-w-0 space-y-4">
            <div className="min-w-0 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="text-sm font-semibold">{t("days.sessions.title")}</div>

                {trainingSource || isFiniteNumber(dayRpe) ? (
                    <div className="min-w-0 flex flex-wrap gap-2">
                        {trainingSource ? (
                            <span className="text-xs text-muted-foreground break-all">
                                {t("days.training.source")}:{" "}
                                <span className="font-mono text-foreground">{trainingSource}</span>
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
                <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold">{t("days.sessions.gymTrainingTitle")}</div>
                    <span className="rounded-full border bg-background px-2 py-0.5 text-xs text-muted-foreground">
                        {gymSessions.length}
                    </span>
                </div>

                {gymSessions.length === 0 ? (
                    <div className="rounded-2xl border bg-card p-4 text-sm text-muted-foreground">
                        {t("days.sessions.gymTrainingEmpty")}
                    </div>
                ) : (
                    gymSessions.map((session, index) => (
                        <SessionCard
                            key={buildSessionKey(session, index)}
                            t={t}
                            day={day}
                            session={session}
                            index={index}
                            onOpenMedia={onOpenMedia}
                        />
                    ))
                )}
            </div>

            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold">{t("days.sessions.outdoorTitle")}</div>
                    <span className="rounded-full border bg-background px-2 py-0.5 text-xs text-muted-foreground">
                        {outdoorSessions.length}
                    </span>
                </div>

                {outdoorSessions.length === 0 ? (
                    <div className="rounded-2xl border bg-card p-4 text-sm text-muted-foreground">
                        {t("days.sessions.outdoorEmpty")}
                    </div>
                ) : (
                    outdoorSessions.map((session, index) => (
                        <SessionCard
                            key={buildSessionKey(session, index)}
                            t={t}
                            day={day}
                            session={session}
                            index={index}
                            onOpenMedia={onOpenMedia}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
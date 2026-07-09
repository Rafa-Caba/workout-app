// src/components/dayExplorer/DaySessionsPanel.tsx
// MUI session explorer for WorkoutDay gym and cardio sessions.

import React from "react";
import { format } from "date-fns";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Chip from "@mui/material/Chip";
import Collapse from "@mui/material/Collapse";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";

import type { I18nKey } from "@/i18n/translations";
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
import { CardioRouteMap } from "@/components/cardio/CardioRouteMap";
import { AppCard, AppEmptyState, AppSectionHeader } from "@/components/mui";

type JsonRecord = Record<string, unknown>;
type TFn = (key: I18nKey, vars?: Record<string, string | number>) => string;

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
    const s = Math.floor(seconds % 60);

    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return s > 0 ? `${m}m ${s}s` : `${m}m`;
    return `${s}s`;
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

function isCardioActivityType(value: WorkoutActivityType): boolean {
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
    cardioSessions: WorkoutSession[];
} {
    return {
        gymSessions: sessions.filter((session) => !isCardioActivityType(session.activityType)),
        cardioSessions: sessions.filter((session) => isCardioActivityType(session.activityType)),
    };
}

function Metric({ label, value }: { label: string; value: string | null }) {
    return <BadgePill dense label={label} value={value} />;
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
    const [isSessionOpen, setIsSessionOpen] = React.useState(true);
    const [isExercisesOpen, setIsExercisesOpen] = React.useState(false);

    const sessionTitle = cleanString(session.type) ?? t("days.sessions.unknownType");
    const activityType = session.activityType;
    const isCardio = isCardioActivityType(activityType);

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

    const routePoints = Array.isArray(session.routePoints)
        ? session.routePoints.length
        : session.routeSummary?.pointCount ?? null;
    const avgSpeedKmh = session.cardioMetrics?.avgSpeedKmh ?? null;
    const maxSpeedKmh = session.cardioMetrics?.maxSpeedKmh ?? null;
    const strideLengthM = session.cardioMetrics?.strideLengthM ?? null;

    const source = getSessionSourceLabel(session);
    const sourceDevice = getSessionSourceDeviceLabel(session);
    const sessionKind = getSessionKindLabel(session);
    const importedAt = getSessionImportedAtLabel(session);
    const lastSyncedAt = getSessionLastSyncedAtLabel(session);
    const externalId = getSessionExternalIdLabel(session);

    return (
        <AppCard padding="none" sx={{ overflow: "hidden" }}>
            <ButtonBase
                onClick={() => setIsSessionOpen((prev) => !prev)}
                aria-expanded={isSessionOpen}
                aria-label={isSessionOpen ? "Colapsar sesión" : "Expandir sesión"}
                sx={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    borderBottom: isSessionOpen ? 1 : 0,
                    borderColor: "divider",
                    p: { xs: 1.25, md: 1.75 },
                }}
            >
                <Box sx={{ display: "flex", gap: 1.25, alignItems: "flex-start", minWidth: 0 }}>
                    <Box
                        sx={{
                            mt: 0.25,
                            width: 28,
                            height: 28,
                            borderRadius: 999,
                            border: 1,
                            borderColor: "divider",
                            display: "grid",
                            placeItems: "center",
                            flexShrink: 0,
                            fontWeight: 800,
                        }}
                    >
                        {isSessionOpen ? "−" : "+"}
                    </Box>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, overflowWrap: "anywhere" }}>
                            {t("days.sessions.dayPrefix")} {sessionTitle}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {isSessionOpen ? "Click para colapsar esta sesión" : "Click para expandir esta sesión"}
                        </Typography>
                        {session.notes ? (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, overflowWrap: "anywhere" }}>
                                {session.notes}
                            </Typography>
                        ) : null}
                    </Box>
                </Box>
            </ButtonBase>

            <Collapse in={isSessionOpen} unmountOnExit>
                <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 1.25, md: 1.75 }, p: { xs: 1.25, md: 1.75 } }}>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                        <Chip size="small" label={isCardio ? "🚶 Cardio" : "🏋️ Gym / Training"} />
                        {activityType ? <Chip size="small" label={activityType === "walking" ? "Walking" : "Running"} /> : null}
                        {sessionKind ? <Chip size="small" label={sessionKind} /> : null}
                        {source ? <Chip size="small" label={source} /> : null}
                    </Box>

                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: { xs: "1fr", lg: isCardio ? "minmax(0, 0.95fr) minmax(360px, 1.05fr)" : "1fr" },
                            gap: { xs: 1.25, md: 1.75 },
                            minWidth: 0,
                        }}
                    >
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25, minWidth: 0 }}>
                            <Box sx={{ gap: 0.5 }}>
                                <Box
                                    sx={{
                                        display: "grid",
                                        gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: isCardio ? "repeat(2, minmax(0, 1fr))" : "repeat(4, minmax(0, 1fr))" },
                                        gap: { xs: 0.75, md: 1 },
                                    }}
                                >
                                    <BadgePill dense emoji="⏱️" label={t("days.sessions.duration")} value={duration} />
                                    <BadgePill dense emoji="📎" label={t("days.sessions.media")} value={`${mediaCount}`} />
                                    <BadgePill dense emoji="🔥" label={t("days.sessions.activeKcal")} value={activeKcal} />
                                    <BadgePill dense emoji="🧮" label={t("days.sessions.totalKcal")} value={totalKcal} />
                                    <BadgePill dense emoji="❤️" label={t("days.sessions.avgHr")} value={avgHr} />
                                    <BadgePill dense emoji="⬆️" label={t("days.sessions.maxHr")} value={maxHr} />
                                    <BadgePill dense emoji="🚶" label={t("days.sessions.stepsLabel")} value={steps} />
                                    <BadgePill dense emoji="📏" label={t("days.sessions.distanceLabel")} value={distance} />
                                    <BadgePill dense emoji="⛰️" label={t("days.sessions.elevationLabel")} value={elevation} />
                                    <BadgePill dense emoji="⏱️" label={t("days.sessions.paceLabel")} value={pace ? `${pace} ${t("days.sessions.paceUnit")}` : null} />
                                    <BadgePill dense emoji="🔁" label={t("days.sessions.cadenceLabel")} value={cadence} />
                                    <BadgePill dense emoji="🎯" label={t("days.sessions.rpe")} value={rpe} />
                                    <BadgePill dense emoji="🟢" label={t("days.sessions.startAt")} value={startAt} />
                                    <BadgePill dense emoji="🔴" label={t("days.sessions.endAt")} value={endAt} />
                                    <BadgePill dense emoji="🏋️" label={t("days.sessions.exercises")} value={exercisesCount > 0 ? `${exercisesCount}` : null} />
                                    <BadgePill dense emoji="📚" label={t("days.sessions.sets")} value={setsCount > 0 ? `${loggedSets}/${setsCount}` : null} />
                                    <BadgePill dense emoji="⬇️" label={t("days.sessions.importedAt")} value={importedAt} />
                                    <BadgePill dense emoji="🔄" label={t("days.sessions.lastSyncedAt")} value={lastSyncedAt} />
                                </Box>
                                <Box sx={{ display: "flex", gap: 0.7, mt: 0.7, flexDirection: "column" }}>
                                    <BadgePill dense emoji="⌚" label={t("days.sessions.sourceDevice")} value={sourceDevice} />
                                    <BadgePill dense emoji="🆔" label={t("days.sessions.externalId")} value={externalId} />
                                </Box>
                            </Box>

                            {isCardio ? (
                                <Box
                                    sx={{
                                        display: "grid",
                                        gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(2, minmax(0, 1fr))" },
                                        gap: { xs: 0.75, md: 1 },
                                    }}
                                >
                                    <Metric label={t("days.sessions.route")} value={session.hasRoute ? t("days.sessions.routeYes") : t("days.sessions.routeNo")} />
                                    <Metric label={t("days.sessions.routePoints")} value={isFiniteNumber(routePoints) ? `${routePoints}` : null} />
                                    <Metric label={t("days.sessions.avgSpeed")} value={isFiniteNumber(avgSpeedKmh) ? `${avgSpeedKmh.toFixed(2)} ${t("days.sessions.speedUnit")}` : null} />
                                    <Metric label={t("days.sessions.maxSpeed")} value={isFiniteNumber(maxSpeedKmh) ? `${maxSpeedKmh.toFixed(2)} ${t("days.sessions.speedUnit")}` : null} />
                                    <Metric label={t("days.sessions.strideLength")} value={isFiniteNumber(strideLengthM) ? `${strideLengthM.toFixed(2)} ${t("days.sessions.strideLengthUnit")}` : null} />
                                </Box>
                            ) : null}
                        </Box>

                        {isCardio ? (
                            <Box sx={{ minWidth: 0 }}>
                                <CardioRouteMap
                                    session={session}
                                    height={{ xs: 300, sm: 340, md: 380, lg: 430 }}
                                />
                            </Box>
                        ) : null}
                    </Box>

                    {exercises && exercises.length > 0 ? (
                        <AppCard padding="sm" title={`${t("days.sessions.exercisesList")} (${exercises.length})`} action={
                            <Button variant="outlined" size="small" onClick={() => setIsExercisesOpen((prev) => !prev)}>
                                {isExercisesOpen ? "Ocultar" : "Mostrar"}
                            </Button>
                        }>
                            <Collapse in={isExercisesOpen} unmountOnExit>
                                <Box
                                    sx={{
                                        display: "grid",
                                        gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
                                        gap: 1,
                                    }}
                                >
                                    {exercises.map((exercise) => {
                                        const actualSetChipTexts = getExerciseActualSetChipTexts(exercise);
                                        const hasActualSets = actualSetChipTexts.length > 0;
                                        const setValue = getExerciseSetsDisplayValue(exercise);
                                        const repsValue = getExerciseRepsValue(exercise);
                                        const loadValue = getExerciseLoadValue(exercise);
                                        const rpeValue = getExerciseRpeValue(exercise);
                                        const attachmentsCount = getExerciseAttachmentsCount(exercise);
                                        const notes = getExerciseNotes(exercise);

                                        return (
                                            <AppCard key={exercise.id} padding="sm" tone="soft">
                                                <Typography variant="subtitle2" sx={{ fontWeight: 800, overflowWrap: "anywhere" }}>
                                                    {getExerciseDisplayName(exercise)}
                                                </Typography>
                                                {notes ? (
                                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, overflowWrap: "anywhere" }}>
                                                        {notes}
                                                    </Typography>
                                                ) : null}
                                                <Box
                                                    sx={{
                                                        display: "grid",
                                                        gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(2, minmax(0, 1fr))" },
                                                        gap: { xs: 0.75, md: 1 },
                                                        mt: 1,
                                                    }}
                                                >
                                                    <Metric label={t("days.sessions.sets")} value={setValue} />
                                                    <Metric label={t("days.sessions.reps")} value={hasActualSets ? "Real" : repsValue} />
                                                    <Metric label={t("days.sessions.load")} value={loadValue} />
                                                    <Metric label={t("days.sessions.rpe")} value={rpeValue} />
                                                </Box>

                                                {hasActualSets ? (
                                                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mt: 1 }}>
                                                        {actualSetChipTexts.map((text, chipIndex) => (
                                                            <Chip key={`${exercise.id}-actual-set-${chipIndex}`} size="small" label={text} />
                                                        ))}
                                                    </Box>
                                                ) : null}

                                                {attachmentsCount > 0 ? (
                                                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                                                        {t("days.sessions.media")}: {attachmentsCount}
                                                    </Typography>
                                                ) : null}
                                            </AppCard>
                                        );
                                    })}
                                </Box>
                            </Collapse>
                        </AppCard>
                    ) : null}

                    {Array.isArray(session.media) && session.media.length > 0 ? (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
                                {t("days.sessions.mediaGrid")}
                            </Typography>
                            <Box
                                sx={{
                                    display: "grid",
                                    gridTemplateColumns: {
                                        xs: "repeat(2, minmax(0, 1fr))",
                                        sm: "repeat(4, minmax(0, 1fr))",
                                        md: "repeat(6, minmax(0, 1fr))",
                                    },
                                    gap: 1,
                                }}
                            >
                                {session.media.map((media) => {
                                    const item = toMediaLikeItem(media, {
                                        date: day.date,
                                        sessionType: sessionTitle,
                                        source: "day",
                                    });

                                    const isImage = item.resourceType === "image";
                                    const isVideo = item.resourceType === "video";

                                    return (
                                        <ButtonBase
                                            key={media.publicId}
                                            onClick={() => onOpenMedia(item)}
                                            title={media.publicId}
                                            sx={{
                                                width: "100%",
                                                overflow: "hidden",
                                                borderRadius: 2,
                                                border: 1,
                                                borderColor: "divider",
                                                bgcolor: "background.default",
                                            }}
                                        >
                                            <Box sx={{ aspectRatio: "1 / 1", width: "100%", overflow: "hidden", bgcolor: "action.hover" }}>
                                                {isImage ? (
                                                    <Box component="img" src={item.url} alt={media.publicId} sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                ) : isVideo ? (
                                                    <Box component="video" src={item.url} muted playsInline sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                ) : (
                                                    <Box sx={{ display: "grid", placeItems: "center", height: "100%", px: 1, color: "text.secondary", fontSize: 12 }}>
                                                        {t("media.open")}
                                                    </Box>
                                                )}
                                            </Box>
                                        </ButtonBase>
                                    );
                                })}
                            </Box>
                        </Box>
                    ) : (
                        <Typography variant="caption" color="text.secondary">
                            {t("days.sessions.noMedia")}
                        </Typography>
                    )}
                </Box>
            </Collapse>
        </AppCard>
    );
}

function SessionGroup({
    title,
    count,
    emptyText,
    sessions,
    day,
    t,
    onOpenMedia,
}: {
    title: string;
    count: number;
    emptyText: string;
    sessions: WorkoutSession[];
    day: WorkoutDay;
    t: TFn;
    onOpenMedia: (item: MediaLikeItem) => void;
}) {
    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25, minWidth: 0 }}>
            <AppSectionHeader
                dense
                title={title}
                meta={<Chip size="small" label={count} />}
            />

            {sessions.length === 0 ? (
                <AppEmptyState title={emptyText} variant="inline" />
            ) : (
                sessions.map((session, index) => (
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
        </Box>
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
    const { gymSessions, cardioSessions } = React.useMemo(() => splitSessions(sessions), [sessions]);

    if (sessions.length === 0) {
        return <AppEmptyState title={t("days.sessions.empty")} />;
    }

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 1.5, md: 2 }, minWidth: 0 }}>
            <AppSectionHeader
                title={t("days.sessions.title")}
                dense
                actions={
                    trainingSource || isFiniteNumber(dayRpe) ? (
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                            {trainingSource ? <Chip size="small" label={`${t("days.training.source")}: ${trainingSource}`} /> : null}
                            {isFiniteNumber(dayRpe) ? <Chip size="small" label={`${t("days.training.dayRpe")}: ${Math.round(dayRpe)}`} /> : null}
                        </Box>
                    ) : null
                }
            />

            <SessionGroup
                title={t("days.sessions.gymTrainingTitle")}
                count={gymSessions.length}
                emptyText={t("days.sessions.gymTrainingEmpty")}
                sessions={gymSessions}
                day={day}
                t={t}
                onOpenMedia={onOpenMedia}
            />

            <SessionGroup
                title={t("days.sessions.cardioTitle")}
                count={cardioSessions.length}
                emptyText={t("days.sessions.cardioEmpty")}
                sessions={cardioSessions}
                day={day}
                t={t}
                onOpenMedia={onOpenMedia}
            />
        </Box>
    );
}

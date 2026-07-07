// src/components/dayExplorer/DayTrainingMetaPanel.tsx
// MUI training metadata summary for the Day Explorer detail view.

import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";

import type { I18nKey } from "@/i18n/translations";
import type {
    TrainingBlock,
    WorkoutActivityType,
    WorkoutSession,
} from "@/types/workoutDay.types";
import { AppCard } from "@/components/mui";

type TFn = (key: I18nKey, vars?: Record<string, string | number>) => string;

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

function isCardioActivityType(value: WorkoutActivityType): boolean {
    return value === "walking" || value === "running";
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

function MetaChip({ label, value, icon }: { label: string; value: string | number; icon: string }) {
    return (
        <Chip
            size="small"
            label={
                <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.75 }}>
                    <span aria-hidden="true">{icon}</span>
                    <span>{label}:</span>
                    <Typography component="span" variant="caption" sx={{ fontWeight: 800 }}>
                        {value}
                    </Typography>
                </Box>
            }
            sx={{ maxWidth: "100%" }}
        />
    );
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
            <AppCard>
                <Typography variant="body2" color="text.secondary">
                    {t("days.training.empty")}
                </Typography>
            </AppCard>
        );
    }

    const sessions: WorkoutSession[] = Array.isArray(training.sessions) ? training.sessions : [];
    const mediaTotal = sumMedia(sessions);
    const { gymSessions, cardioSessions } = splitSessions(sessions);

    const source = training.source?.trim() ? training.source.trim() : null;
    const dayRpe = isFiniteNumber(training.dayEffortRpe)
        ? `${Math.round(training.dayEffortRpe)}`
        : null;

    return (
        <AppCard
            title={t("days.training.title")}
            action={
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                    <MetaChip icon="🏋️" label={t("days.training.sessions")} value={gymSessions.length} />
                    <MetaChip icon="🚶" label={t("days.training.cardioSessions")} value={cardioSessions.length} />
                    <MetaChip icon="📎" label={t("days.training.mediaTotal")} value={mediaTotal} />
                    {dayRpe ? <MetaChip icon="🎯" label={t("days.training.dayRpe")} value={dayRpe} /> : null}
                </Box>
            }
        >
            {source ? (
                <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>
                    {t("days.training.source")}: <Typography component="span" variant="body2" color="text.primary" sx={{ fontWeight: 750 }}>{source}</Typography>
                </Typography>
            ) : null}
        </AppCard>
    );
}

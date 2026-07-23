// src/components/gymCheck/GymCheckPlanInfo.tsx
// MUI summary card for the active Gym Check day plan.

import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import { AppCard } from "@/components/mui";
import type { DayKey, DayPlan } from "@/utils/routines/plan";

type Props = {
    lang: "es" | "en";
    activeDay: DayKey;
    dayLabels: Record<DayKey, { es: string; en: string }>;
    activePlan: DayPlan;
};

function formatNullable(value: unknown): string {
    if (value === null || value === undefined || value === "") return "—";
    return String(value);
}

function InfoRow(props: { label: string; value: string }) {
    return (
        <Box
            sx={{
                display: "grid",
                gridTemplateColumns: "25% minmax(0, 1fr)",
                columnGap: 1.5,
                alignItems: "start",
                py: 0.7,
                borderBottom: 1,
                borderColor: "divider",
            }}
        >
            <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                    fontWeight: 750,
                    minWidth: 0,
                    whiteSpace: "nowrap",
                }}
            >
                {props.label}
            </Typography>

            <Typography
                variant="body2"
                sx={{
                    fontWeight: 800,
                    minWidth: 0,
                    textAlign: "right",
                    overflowWrap: "anywhere",
                }}
            >
                {props.value}
            </Typography>
        </Box>
    );
}

export function GymCheckPlanInfo({
    lang,
    activeDay,
    dayLabels,
    activePlan,
}: Props) {
    const exerciseCount = activePlan.exercises?.length ?? 0;
    const title = lang === "es" ? "Plan del día" : "Day plan";
    const dayLabel =
        lang === "es"
            ? dayLabels[activeDay].es
            : dayLabels[activeDay].en;

    return (
        <AppCard
            title={title}
            subtitle={
                lang === "es"
                    ? "Resumen del plan asignado."
                    : "Assigned plan summary."
            }
            action={
                <Chip
                    size="small"
                    color="primary"
                    label={dayLabel}
                />
            }
            padding="md"
        >
            <Box sx={{ display: "grid", gap: 0.2 }}>
                <InfoRow
                    label={lang === "es" ? "Tipo" : "Type"}
                    value={formatNullable(activePlan.sessionType)}
                />

                <InfoRow
                    label="Focus"
                    value={formatNullable(activePlan.focus)}
                />

                <InfoRow
                    label={lang === "es" ? "Ejercicios" : "Exercises"}
                    value={String(exerciseCount)}
                />

                <InfoRow
                    label={lang === "es" ? "Notas" : "Notes"}
                    value={formatNullable(activePlan.notes)}
                />
            </Box>
        </AppCard>
    );
}

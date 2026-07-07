// src/components/cardio/CardioSessionCard.tsx
// MUI read-only card for a single Cardio session with responsive metrics,
// large route map, notes, and actions.

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";

import { CardioRouteMap } from "@/components/cardio/CardioRouteMap";
import { AppActionRow, AppCard, AppMetricCard } from "@/components/mui";
import { getCanonicalCardioEnvironment } from "@/services/workout/cardio.service";
import type { WorkoutSession } from "@/types/workoutDay.types";

type Props = {
    session: WorkoutSession;
    onEdit: (session: WorkoutSession) => void;
    onDelete: (session: WorkoutSession) => void;
};

function isFiniteNumber(value: unknown): value is number {
    return typeof value === "number" && Number.isFinite(value);
}

function formatDateTime(iso: string | null): string {
    if (!iso) return "—";

    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "—";

    return new Intl.DateTimeFormat("es-MX", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);
}

function formatDuration(seconds: number | null): string {
    if (!isFiniteNumber(seconds) || seconds <= 0) return "—";

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }

    if (minutes > 0) {
        return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`;
    }

    return `${secs}s`;
}

function formatDistanceKm(distanceKm: number | null): string {
    if (!isFiniteNumber(distanceKm) || distanceKm <= 0) return "—";
    return `${distanceKm.toFixed(2)} km`;
}

function formatPace(secPerKm: number | null): string {
    if (!isFiniteNumber(secPerKm) || secPerKm <= 0) return "—";

    const totalSeconds = Math.round(secPerKm);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${String(seconds).padStart(2, "0")} min/km`;
}

function formatNullableNumber(value: number | null, suffix?: string): string {
    if (!isFiniteNumber(value)) return "—";
    return suffix ? `${value} ${suffix}` : `${value}`;
}

function getSessionTitle(session: WorkoutSession): string {
    const environment = getCanonicalCardioEnvironment(session);
    const environmentLabel = environment === "indoor" ? "Indoor" : "Outdoor";

    if (session.activityType === "walking") return `${environmentLabel} Walking`;
    if (session.activityType === "running") return `${environmentLabel} Running`;

    return session.type?.trim() || "Cardio";
}

function getHealthWriteLabel(value: unknown): string | null {
    if (value === "pending") return "Health pending";
    if (value === "synced") return "Health synced";
    if (value === "failed") return "Health failed";
    return null;
}

function getEnvironmentLabel(environment: ReturnType<typeof getCanonicalCardioEnvironment>): string | null {
    if (environment === "outdoor") return "Outdoor";
    if (environment === "indoor") return "Indoor";
    return null;
}

function getActivityLabel(activityType: WorkoutSession["activityType"]): string | null {
    if (activityType === "walking") return "Walking";
    if (activityType === "running") return "Running";
    return null;
}

export function CardioSessionCard({ session, onEdit, onDelete }: Props) {
    const source = typeof session.meta?.source === "string" ? session.meta.source : null;
    const sourceDevice =
        typeof session.meta?.sourceDevice === "string" ? session.meta.sourceDevice : null;
    const sessionKind =
        typeof session.meta?.sessionKind === "string" ? session.meta.sessionKind : null;
    const healthWriteStatus = getHealthWriteLabel(session.meta?.healthWriteStatus);
    const metrics = session.cardioMetrics ?? null;
    const environment = getCanonicalCardioEnvironment(session);
    const environmentLabel = getEnvironmentLabel(environment);
    const activityLabel = getActivityLabel(session.activityType);
    const hasRouteMap = environment === "outdoor" && session.hasRoute === true;

    return (
        <AppCard
            padding="lg"
            sx={{
                overflow: "visible",
            }}
        >
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, minWidth: 0 }}>
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: { xs: "column", md: "row" },
                        justifyContent: "space-between",
                        gap: 2,
                        minWidth: 0,
                    }}
                >
                    <Box sx={{ minWidth: 0 }}>
                        <Typography variant="h6" component="h3" sx={{ fontWeight: 950 }}>
                            {getSessionTitle(session)}
                        </Typography>

                        <Box
                            sx={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 0.75,
                                mt: 1.25,
                                minWidth: 0,
                            }}
                        >
                            {environmentLabel ? <Chip size="small" label={environmentLabel} variant="outlined" /> : null}
                            {activityLabel ? <Chip size="small" label={activityLabel} variant="outlined" /> : null}
                            {sessionKind ? <Chip size="small" label={sessionKind} variant="outlined" /> : null}
                            {source ? <Chip size="small" label={source} variant="outlined" /> : null}
                            {healthWriteStatus ? <Chip size="small" label={healthWriteStatus} variant="outlined" /> : null}
                        </Box>
                    </Box>

                    <AppActionRow align="right" dense sx={{ flexShrink: 0 }}>
                        <Button type="button" variant="outlined" onClick={() => onEdit(session)}>
                            Editar
                        </Button>
                        <Button type="button" variant="contained" color="error" onClick={() => onDelete(session)}>
                            Eliminar
                        </Button>
                    </AppActionRow>
                </Box>

                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: {
                            xs: "1fr",
                            lg: hasRouteMap ? "minmax(0, 0.92fr) minmax(420px, 1.08fr)" : "1fr",
                        },
                        gap: { xs: 2, lg: 2.5 },
                        alignItems: "stretch",
                        minWidth: 0,
                    }}
                >
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, minWidth: 0 }}>
                        <Box
                            sx={{
                                display: "grid",
                                gridTemplateColumns: {
                                    xs: "repeat(2, minmax(0, 1fr))",
                                    sm: "repeat(3, minmax(0, 1fr))",
                                    xl: hasRouteMap
                                        ? "repeat(3, minmax(0, 1fr))"
                                        : "repeat(4, minmax(0, 1fr))",
                                },
                                gap: 1.25,
                            }}
                        >
                            <AppMetricCard compact label="Inicio" value={formatDateTime(session.startAt)} />
                            <AppMetricCard compact label="Fin" value={formatDateTime(session.endAt)} />
                            <AppMetricCard compact label="Duración" value={formatDuration(session.durationSeconds)} />
                            <AppMetricCard compact label="Distancia" value={formatDistanceKm(session.distanceKm)} />
                            <AppMetricCard compact label="Pasos" value={formatNullableNumber(session.steps)} />
                            <AppMetricCard compact label="Kcal activas" value={formatNullableNumber(session.activeKcal)} />
                            <AppMetricCard compact label="FC prom" value={formatNullableNumber(session.avgHr)} />
                            <AppMetricCard compact label="FC máx" value={formatNullableNumber(session.maxHr)} />
                            <AppMetricCard compact label="Ritmo" value={formatPace(session.paceSecPerKm)} />
                            <AppMetricCard compact label="Cadencia" value={formatNullableNumber(session.cadenceRpm, "rpm")} />
                            <AppMetricCard compact label="Elevación" value={formatNullableNumber(session.elevationGainM, "m")} />
                            <AppMetricCard compact label="Dispositivo" value={sourceDevice ?? "—"} />
                            <AppMetricCard compact label="Vel. prom" value={formatNullableNumber(metrics?.avgSpeedKmh ?? null, "km/h")} />
                            <AppMetricCard compact label="Vel. máx" value={formatNullableNumber(metrics?.maxSpeedKmh ?? null, "km/h")} />
                            <AppMetricCard compact label="Ruta" value={session.hasRoute ? "Sí" : "No"} />
                            <AppMetricCard
                                compact
                                label="Puntos de ruta"
                                value={formatNullableNumber(session.routeSummary?.pointCount ?? null)}
                            />
                        </Box>
                    </Box>

                    {hasRouteMap ? (
                        <Box sx={{ minWidth: 0 }}>
                            <CardioRouteMap
                                session={session}
                                height={{
                                    xs: 320,
                                    sm: 360,
                                    md: 420,
                                    lg: 520,
                                }}
                            />
                        </Box>
                    ) : null}
                </Box>

                <Divider />

                <AppCard padding="sm" tone="soft">
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
                        Notas
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.75, whiteSpace: "pre-wrap" }}>
                        {session.notes?.trim() ? session.notes : "—"}
                    </Typography>
                </AppCard>
            </Box>
        </AppCard>
    );
}

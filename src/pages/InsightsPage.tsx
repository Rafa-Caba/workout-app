// src/pages/InsightsPage.tsx
// MUI simplified Insights page.
// Shows streaks, PRs and recovery in one place so the user does not need a dropdown/sub-routes.

import React from "react";
import { format, subDays } from "date-fns";
import { toast } from "sonner";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import MenuItem from "@mui/material/MenuItem";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { JsonDetails } from "@/components/JsonDetails";
import { AppCard, AppEmptyState, AppMetricCard, AppPage } from "@/components/mui";
import { useI18n } from "@/i18n/I18nProvider";
import { usePRs } from "@/hooks/usePRs";
import { useRecovery } from "@/hooks/useRecovery";
import { useStreaks } from "@/hooks/useStreaks";
import type { InsightMetric, PrRecord, RecoveryPoint, StreaksMode } from "@/services/workout/insights.service";

function formatFiniteNumber(value: number | null | undefined, decimals = 0): string {
    if (typeof value !== "number" || !Number.isFinite(value)) return "—";

    const fixed = value.toFixed(decimals);
    return fixed.replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
}

function formatMinutes(value: number | null | undefined): string {
    if (typeof value !== "number" || !Number.isFinite(value)) return "—";

    const total = Math.max(0, Math.round(value));
    const hours = Math.floor(total / 60);
    const minutes = total % 60;

    if (hours <= 0) return `${minutes}m`;
    return `${hours}h ${minutes}m`;
}

function formatSeconds(value: number | null | undefined): string {
    if (typeof value !== "number" || !Number.isFinite(value)) return "—";

    const total = Math.max(0, Math.round(value));
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;

    if (minutes <= 0) return `${seconds}s`;
    return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
}

function formatMetricValue(metric: InsightMetric, value: number): string {
    if (!Number.isFinite(value)) return "—";

    if (metric === "durationSeconds") return formatSeconds(value);
    if (metric === "paceSecPerKm") return `${formatSeconds(value)} /km`;
    if (metric === "distanceKm") return `${formatFiniteNumber(value, 2)} km`;
    if (metric === "steps") return Math.round(value).toLocaleString();
    if (metric === "activeKcal") return `${Math.round(value)} kcal`;
    if (metric === "avgHr" || metric === "maxHr") return `${Math.round(value)} bpm`;

    return formatFiniteNumber(value, 2);
}

function formatMetricLabel(metric: InsightMetric, mode: PrRecord["mode"]): string {
    const labelByMetric: Record<InsightMetric, string> = {
        activeKcal: "Kcal activas",
        durationSeconds: "Duración",
        avgHr: "FC promedio",
        maxHr: "FC máxima",
        distanceKm: "Distancia",
        steps: "Pasos",
        paceSecPerKm: "Ritmo",
    };

    const modeLabel = mode === "min" ? "mejor menor" : "mejor mayor";
    return `${labelByMetric[metric]} · ${modeLabel}`;
}

function averageNumbers(values: Array<number | null | undefined>): number | null {
    const valid = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
    if (valid.length === 0) return null;
    return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

function getLatestRecoveryLevel(points: RecoveryPoint[]): RecoveryPoint["level"] | "unknown" {
    const latest = [...points].reverse().find((point) => point.level !== "unknown");
    return latest?.level ?? "unknown";
}

function getRecoveryChipColor(level: RecoveryPoint["level"] | "unknown"): "default" | "success" | "warning" | "error" {
    if (level === "green") return "success";
    if (level === "yellow") return "warning";
    if (level === "red") return "error";
    return "default";
}

export function InsightsPage() {
    const { t } = useI18n();
    const today = React.useMemo(() => new Date(), []);

    const [mode, setMode] = React.useState<StreaksMode>("both");
    const [gapDays, setGapDays] = React.useState<string>("0");
    const [asOf, setAsOf] = React.useState<string>(() => format(today, "yyyy-MM-dd"));
    const [from, setFrom] = React.useState<string>(() => format(subDays(today, 30), "yyyy-MM-dd"));
    const [to, setTo] = React.useState<string>(() => format(today, "yyyy-MM-dd"));

    const parsedGapDays = React.useMemo(() => {
        const trimmed = gapDays.trim();
        if (trimmed.length === 0) return undefined;

        const parsed = Number(trimmed);
        return Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : undefined;
    }, [gapDays]);

    const streaksQuery = useStreaks({ mode, gapDays: parsedGapDays, asOf }, Boolean(asOf));
    const prsQuery = usePRs({ from, to }, Boolean(from && to));
    const recoveryQuery = useRecovery({ from, to }, Boolean(from && to));

    React.useEffect(() => {
        if (streaksQuery.isError) toast.error(streaksQuery.error.message);
    }, [streaksQuery.isError, streaksQuery.error]);

    React.useEffect(() => {
        if (prsQuery.isError) toast.error(prsQuery.error.message);
    }, [prsQuery.isError, prsQuery.error]);

    React.useEffect(() => {
        if (recoveryQuery.isError) toast.error(recoveryQuery.error.message);
    }, [recoveryQuery.isError, recoveryQuery.error]);

    const topPrs = React.useMemo(() => {
        return (prsQuery.data?.prs ?? []).slice(0, 8);
    }, [prsQuery.data]);

    const recoveryPoints = recoveryQuery.data?.points ?? [];
    const recoveryScoreAvg = averageNumbers(recoveryPoints.map((point) => point.recoveryScore));
    const sleepScoreAvg = averageNumbers(recoveryPoints.map((point) => point.sleepScore));
    const totalSleepAvg = averageNumbers(recoveryPoints.map((point) => point.totalSleepMinutes));
    const trainingLoadAvg = averageNumbers(recoveryPoints.map((point) => point.trainingLoad));
    const latestRecoveryLevel = getLatestRecoveryLevel(recoveryPoints);

    return (
        <AppPage
            maxWidth="lg"
            title={t("pages.insights.title")}
            subtitle={t("pages.insights.subtitle")}
            actions={
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    <Button variant="outlined" onClick={() => streaksQuery.refetch()} disabled={streaksQuery.isFetching}>
                        Recargar rachas
                    </Button>
                    <Button variant="outlined" onClick={() => { void prsQuery.refetch(); void recoveryQuery.refetch(); }} disabled={prsQuery.isFetching || recoveryQuery.isFetching}>
                        Recargar rango
                    </Button>
                </Box>
            }
        >
            <AppCard
                title="Filtros"
                subtitle="Rachas se calculan hasta un día específico; PRs y recuperación usan un rango de fechas."
            >
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                        gap: { xs: 1.25, md: 1.5 },
                    }}
                >
                    <Box
                        sx={{
                            border: 1,
                            borderColor: "divider",
                            borderRadius: 2,
                            p: { xs: 1.25, md: 1.5 },
                            minWidth: 0,
                        }}
                    >
                        <Typography variant="subtitle2" sx={{ fontWeight: 850, mb: 0.5 }}>
                            Rachas
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.25 }}>
                            Calcula continuidad de entrenamiento, sueño o ambos.
                        </Typography>

                        <Box
                            sx={{
                                display: "grid",
                                gridTemplateColumns: {
                                    xs: "repeat(2, minmax(0, 1fr))",
                                    sm: "repeat(3, minmax(0, 1fr))",
                                },
                                gap: 1,
                                alignItems: "start",
                            }}
                        >
                            <TextField
                                select
                                size="small"
                                label="Modo"
                                value={mode}
                                onChange={(event) => setMode(event.target.value as StreaksMode)}
                            >
                                <MenuItem value="training">Entrenamiento</MenuItem>
                                <MenuItem value="sleep">Sueño</MenuItem>
                                <MenuItem value="both">Ambos</MenuItem>
                            </TextField>
                            <TextField
                                size="small"
                                label="Días de margen"
                                value={gapDays}
                                onChange={(event) => setGapDays(event.target.value)}
                                inputMode="numeric"
                            />
                            <TextField
                                size="small"
                                type="date"
                                label="Calcular hasta"
                                value={asOf}
                                onChange={(event) => setAsOf(event.target.value)}
                                slotProps={{ inputLabel: { shrink: true } }}
                                sx={{ gridColumn: { xs: "1 / -1", sm: "auto" } }}
                            />
                        </Box>
                    </Box>

                    <Box
                        sx={{
                            border: 1,
                            borderColor: "divider",
                            borderRadius: 2,
                            p: { xs: 1.25, md: 1.5 },
                            minWidth: 0,
                        }}
                    >
                        <Typography variant="subtitle2" sx={{ fontWeight: 850, mb: 0.5 }}>
                            PRs y recuperación
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.25 }}>
                            Analiza récords personales y recuperación dentro del rango.
                        </Typography>

                        <Box
                            sx={{
                                display: "grid",
                                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                                gap: 1,
                                alignItems: "start",
                            }}
                        >
                            <TextField
                                size="small"
                                type="date"
                                label="Desde"
                                value={from}
                                onChange={(event) => setFrom(event.target.value)}
                                slotProps={{ inputLabel: { shrink: true } }}
                            />
                            <TextField
                                size="small"
                                type="date"
                                label="Hasta"
                                value={to}
                                onChange={(event) => setTo(event.target.value)}
                                slotProps={{ inputLabel: { shrink: true } }}
                            />
                        </Box>
                    </Box>
                </Box>
            </AppCard>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "0.85fr 1.15fr" }, gap: { xs: 1.5, md: 2.25 } }}>
                <AppCard
                    title="Rachas"
                    subtitle={streaksQuery.data ? `As of: ${streaksQuery.data.asOf} · modo: ${streaksQuery.data.mode}` : "Entrenamiento/sueño según el filtro."}
                    action={streaksQuery.isFetching ? <Chip label="Cargando" size="small" /> : null}
                >
                    {streaksQuery.isSuccess && streaksQuery.data ? (
                        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 1 }}>
                            <AppMetricCard label="Racha actual" value={streaksQuery.data.currentStreakDays} compact />
                            <AppMetricCard label="Mejor racha" value={streaksQuery.data.longestStreakDays} compact />
                            <AppMetricCard label="Margen" value={`${streaksQuery.data.gapDays} días`} compact />
                            <AppMetricCard label="Último día" value={streaksQuery.data.lastQualifiedDate ?? "—"} compact />
                        </Box>
                    ) : null}

                    {streaksQuery.isError ? <JsonDetails title="Error rachas" data={streaksQuery.error} defaultOpen /> : null}
                </AppCard>

                <AppCard
                    title="Recuperación"
                    subtitle={recoveryQuery.data ? `${recoveryQuery.data.range.from} → ${recoveryQuery.data.range.to}` : "Resumen rápido del rango."}
                    action={<Chip label={latestRecoveryLevel} size="small" color={getRecoveryChipColor(latestRecoveryLevel)} />}
                >
                    {recoveryQuery.isSuccess && recoveryPoints.length > 0 ? (
                        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(2, minmax(0, 1fr))" }, gap: 1 }}>
                            <AppMetricCard label="Recovery avg" value={formatFiniteNumber(recoveryScoreAvg, 1)} compact />
                            <AppMetricCard label="Sleep score avg" value={formatFiniteNumber(sleepScoreAvg, 1)} compact />
                            <AppMetricCard label="Sueño avg" value={formatMinutes(totalSleepAvg)} compact />
                            <AppMetricCard label="Carga avg" value={formatFiniteNumber(trainingLoadAvg, 1)} compact />
                        </Box>
                    ) : null}

                    {recoveryQuery.isSuccess && recoveryPoints.length === 0 ? (
                        <AppEmptyState title="Sin datos de recuperación" description="No hay puntos de recuperación para este rango." />
                    ) : null}
                    {recoveryQuery.isError ? <JsonDetails title="Error recuperación" data={recoveryQuery.error} defaultOpen /> : null}
                </AppCard>
            </Box>

            <AppCard
                title="PRs"
                subtitle={prsQuery.data ? `${prsQuery.data.range.from} → ${prsQuery.data.range.to}` : "Mejores marcas del rango seleccionado."}
                action={prsQuery.isFetching ? <Chip label="Cargando" size="small" /> : <Chip label={`${topPrs.length} PRs`} size="small" />}
            >
                {prsQuery.isSuccess && topPrs.length > 0 ? (
                    <TableContainer sx={{ overflowX: "auto" }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Sesión</TableCell>
                                    <TableCell>Métrica</TableCell>
                                    <TableCell align="right">Valor</TableCell>
                                    <TableCell align="right">Fecha</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {topPrs.map((record, index) => (
                                    <TableRow key={`${record.sessionId}-${record.metric}-${record.mode}-${index}`}>
                                        <TableCell sx={{ fontWeight: 800 }}>{record.sessionType || "—"}</TableCell>
                                        <TableCell>{formatMetricLabel(record.metric, record.mode)}</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 850 }}>{formatMetricValue(record.metric, record.value)}</TableCell>
                                        <TableCell align="right">{record.date}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                ) : null}

                {prsQuery.isSuccess && topPrs.length === 0 ? (
                    <AppEmptyState title="Sin PRs todavía" description="Cuando existan sesiones comparables, aparecerán aquí." />
                ) : null}
                {prsQuery.isError ? <JsonDetails title="Error PRs" data={prsQuery.error} defaultOpen /> : null}
            </AppCard>
        </AppPage>
    );
}

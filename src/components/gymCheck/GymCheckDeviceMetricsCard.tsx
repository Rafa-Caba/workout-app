// src/components/gymCheck/GymCheckDeviceMetricsCard.tsx
// MUI collapsible card for optional Gym Check device metrics.

import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Collapse from "@mui/material/Collapse";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useI18n } from "@/i18n/I18nProvider";
import { DeviceSelect } from "../DeviceSelect";
import { AppCard, AppFormGrid } from "@/components/mui";

type MetricsUiState = {
    startAtTime: string;
    endAtTime: string;
    activeKcal: string;
    totalKcal: string;
    avgHr: string;
    maxHr: string;
    distanceKm: string;
    steps: string;
    elevationGainM: string;
    paceSecPerKm: string;
    cadenceRpm: string;
    effortRpe: string;
    trainingSource: string;
    dayEffortRpe: string;
};

type FieldProps = {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    type?: string;
    disabled?: boolean;
    onBlur?: () => void;
    inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
};

function Field({
    label,
    value,
    onChange,
    placeholder,
    type = "text",
    disabled,
    onBlur,
    inputMode,
}: FieldProps) {
    return (
        <TextField
            fullWidth
            size="small"
            label={label}
            type={type}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            onBlur={onBlur}
            inputMode={inputMode}
            slotProps={type === "time" ? { inputLabel: { shrink: true } } : undefined}
        />
    );
}

export function GymCheckDeviceMetricsCard({
    lang,
    busy,
    metricsOpen,
    onToggleOpen,
    metricsHasAny,
    metricsUi,
    onMetricsUiChange,
    onCommit,
}: {
    lang: "es" | "en";
    busy: boolean;
    metricsOpen: boolean;
    onToggleOpen: (open: boolean) => void;
    metricsHasAny: boolean;
    metricsUi: MetricsUiState;
    onMetricsUiChange: (patch: Partial<MetricsUiState>) => void;
    onCommit: () => void;
}) {
    const { t } = useI18n();

    return (
        <AppCard
            title={lang === "es" ? "Métricas del dispositivo" : "Device metrics"}
            subtitle={lang === "es" ? "Se guardan al crear o actualizar la sesión real." : "Saved when creating or updating the real session."}
            action={
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    {metricsHasAny ? <Chip size="small" color="primary" label={lang === "es" ? "Con datos" : "Has data"} /> : null}
                    <Button variant="outlined" size="small" onClick={() => onToggleOpen(!metricsOpen)} disabled={busy}>
                        {metricsOpen ? (lang === "es" ? "Ocultar" : "Hide") : (lang === "es" ? "Editar" : "Edit")}
                    </Button>
                </Box>
            }
        >
            <Collapse in={metricsOpen} unmountOnExit>
                <Box sx={{ display: "grid", gap: 1.5, pt: 0.5 }}>
                    <AppFormGrid columns={{ xs: 1, sm: 2, lg: 3, xl: 5 }} gap={1.5}>
                        <Field label={lang === "es" ? "Hora inicio" : "Start time"} type="time" value={metricsUi.startAtTime} onChange={(v) => onMetricsUiChange({ startAtTime: v })} onBlur={onCommit} disabled={busy} />
                        <Field label={lang === "es" ? "Hora fin" : "End time"} type="time" value={metricsUi.endAtTime} onChange={(v) => onMetricsUiChange({ endAtTime: v })} onBlur={onCommit} disabled={busy} />
                        <Field label={lang === "es" ? "Kcal activas" : "Active kcal"} value={metricsUi.activeKcal} onChange={(v) => onMetricsUiChange({ activeKcal: v })} onBlur={onCommit} placeholder="e.g. 432" inputMode="decimal" disabled={busy} />
                        <Field label={lang === "es" ? "Kcal totales" : "Total kcal"} value={metricsUi.totalKcal} onChange={(v) => onMetricsUiChange({ totalKcal: v })} onBlur={onCommit} placeholder="e.g. 545" inputMode="decimal" disabled={busy} />
                        <Field label={lang === "es" ? "HR promedio" : "Avg HR"} value={metricsUi.avgHr} onChange={(v) => onMetricsUiChange({ avgHr: v })} onBlur={onCommit} placeholder="e.g. 121" inputMode="numeric" disabled={busy} />
                        <Field label={lang === "es" ? "HR máximo" : "Max HR"} value={metricsUi.maxHr} onChange={(v) => onMetricsUiChange({ maxHr: v })} onBlur={onCommit} placeholder="e.g. 160" inputMode="numeric" disabled={busy} />
                        <Field label={lang === "es" ? "Distancia (km)" : "Distance (km)"} value={metricsUi.distanceKm} onChange={(v) => onMetricsUiChange({ distanceKm: v })} onBlur={onCommit} placeholder="e.g. 1.17" inputMode="decimal" disabled={busy} />
                        <Field label={lang === "es" ? "Pasos" : "Steps"} value={metricsUi.steps} onChange={(v) => onMetricsUiChange({ steps: v })} onBlur={onCommit} placeholder="e.g. 4200" inputMode="numeric" disabled={busy} />
                        <Field label={lang === "es" ? "Elevación (m)" : "Elevation gain (m)"} value={metricsUi.elevationGainM} onChange={(v) => onMetricsUiChange({ elevationGainM: v })} onBlur={onCommit} placeholder="e.g. 20" inputMode="decimal" disabled={busy} />
                        <Field label={lang === "es" ? "Ritmo (sec/km)" : "Pace (sec/km)"} value={metricsUi.paceSecPerKm} onChange={(v) => onMetricsUiChange({ paceSecPerKm: v })} onBlur={onCommit} placeholder="e.g. 512" inputMode="numeric" disabled={busy} />
                        <Field label={lang === "es" ? "Cadencia (rpm)" : "Cadence (rpm)"} value={metricsUi.cadenceRpm} onChange={(v) => onMetricsUiChange({ cadenceRpm: v })} onBlur={onCommit} placeholder="e.g. 78" inputMode="numeric" disabled={busy} />
                        <Field label={lang === "es" ? "Esfuerzo (RPE)" : "Effort (RPE)"} value={metricsUi.effortRpe} onChange={(v) => onMetricsUiChange({ effortRpe: v })} onBlur={onCommit} placeholder="1-10" inputMode="decimal" disabled={busy} />
                        <Box sx={{ minWidth: 0 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5, fontWeight: 700 }}>
                                {lang === "es" ? "Dispositivo" : "Device"}
                            </Typography>
                            <DeviceSelect
                                t={t}
                                value={metricsUi.trainingSource?.trim() ? metricsUi.trainingSource : null}
                                onChange={(v) => onMetricsUiChange({ trainingSource: v ?? "" })}
                                allowOther
                                disabled={busy}
                                labelKey={lang === "es" ? "Dispositivo" : "Device"}
                                placeholderKey="device.placeholder"
                                onBlur={onCommit}
                                otherLabelKey="device.other"
                                otherPlaceholderKey="device.otherPlaceholder"
                                otherHintKey="device.otherHint"
                                className="w-full min-w-0"
                                selectClassName="w-full min-w-0 rounded-md border bg-background px-3 py-2 text-base sm:text-sm outline-none focus:ring-2"
                                inputClassName="w-full min-w-0 rounded-md border bg-background px-3 py-2 text-base sm:text-sm outline-none focus:ring-2"
                            />
                        </Box>
                        <Field label={lang === "es" ? "RPE del día" : "Day RPE"} value={metricsUi.dayEffortRpe} onChange={(v) => onMetricsUiChange({ dayEffortRpe: v })} onBlur={onCommit} placeholder="1-10" inputMode="decimal" disabled={busy} />
                    </AppFormGrid>
                </Box>
            </Collapse>

            {!metricsOpen ? (
                <Typography variant="body2" color="text.secondary">
                    {metricsHasAny
                        ? lang === "es" ? "Hay métricas capturadas. Abre esta sección para editarlas." : "Metrics are captured. Open this section to edit them."
                        : lang === "es" ? "Sin métricas opcionales capturadas todavía." : "No optional metrics captured yet."}
                </Typography>
            ) : null}
        </AppCard>
    );
}

// src/components/cardio/CardioSessionForm.tsx
// MUI manual form for Cardio sessions in Web.
// Supports indoor/outdoor walking/running while keeping existing form values
// and submit logic unchanged.

import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { DeviceSelect } from "@/components/DeviceSelect";
import { AppActionRow, AppCard } from "@/components/mui";
import type { I18nKey } from "@/i18n/translations";
import type { CardioFormMode, CardioFormValues } from "@/types/cardio.types";

type TFn = (key: I18nKey, vars?: Record<string, string | number>) => string;

type Props = {
    t: TFn;
    mode: CardioFormMode;
    values: CardioFormValues;
    selectedDate: string;
    isSubmitting: boolean;
    onChange: <K extends keyof CardioFormValues>(
        key: K,
        value: CardioFormValues[K]
    ) => void;
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
    onCancel: () => void;
};

function fieldGridSx() {
    return {
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
        gap: { xs: 1.5, md: 2.25 },
    };
}

function NumberField(props: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    min?: number;
    step?: number;
}) {
    return (
        <TextField
            fullWidth
            size="small"
            type="number"
            label={props.label}
            value={props.value}
            slotProps={{
                htmlInput: {
                    min: props.min ?? 0,
                    step: props.step ?? 1,
                },
            }}
            onChange={(event) => props.onChange(event.target.value)}
        />
    );
}

function FormBlock(props: { title: string; subtitle?: string; children: ReactNode }) {
    return (
        <AppCard padding="sm" tone="soft" title={props.title} subtitle={props.subtitle}>
            {props.children}
        </AppCard>
    );
}

export function CardioSessionForm({
    t,
    mode,
    values,
    selectedDate,
    isSubmitting,
    onChange,
    onSubmit,
    onCancel,
}: Props) {
    const isIndoor = values.cardioEnvironment === "indoor";

    return (
        <Box component="form" onSubmit={onSubmit} sx={{ display: "flex", flexDirection: "column", gap: { xs: 1.75, md: 2.5 } }}>
            <Box sx={{ minWidth: 0 }}>
                <Typography variant="h6" component="h3" sx={{ fontWeight: 850 }}>
                    {mode === "create" ? "Nueva sesión Cardio" : "Editar sesión Cardio"}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Fecha seleccionada:{" "}
                    <Box component="span" sx={{ color: "text.primary", fontWeight: 800 }}>
                        {selectedDate}
                    </Box>
                </Typography>
            </Box>

            <FormBlock title="Tipo de sesión" subtitle="Define actividad, ambiente y dispositivo origen.">
                <Box sx={fieldGridSx()}>
                    <TextField
                        select
                        fullWidth
                        size="small"
                        label="Ambiente"
                        value={values.cardioEnvironment}
                        onChange={(event) => {
                            const nextEnvironment = event.target.value === "indoor" ? "indoor" : "outdoor";
                            onChange("cardioEnvironment", nextEnvironment);

                            if (nextEnvironment === "indoor") {
                                onChange("hasRoute", false);
                                onChange("routePointCount", "");
                                onChange("elevationGainM", "");
                            }
                        }}
                    >
                        <MenuItem value="outdoor">Outdoor</MenuItem>
                        <MenuItem value="indoor">Indoor / Treadmill</MenuItem>
                    </TextField>

                    <TextField
                        select
                        fullWidth
                        size="small"
                        label="Actividad"
                        value={values.activityType}
                        onChange={(event) =>
                            onChange("activityType", event.target.value === "running" ? "running" : "walking")
                        }
                    >
                        <MenuItem value="walking">Walking</MenuItem>
                        <MenuItem value="running">Running</MenuItem>
                    </TextField>

                    <Box sx={{ minWidth: 0 }}>
                        <DeviceSelect
                            t={t}
                            value={values.sourceDevice || null}
                            onChange={(next) => onChange("sourceDevice", next ?? "")}
                        />
                    </Box>
                </Box>
            </FormBlock>

            <FormBlock title="Tiempo y distancia" subtitle="Captura duración, horarios y distancia base.">
                <Box sx={fieldGridSx()}>
                    <TextField
                        fullWidth
                        size="small"
                        type="time"
                        label="Hora inicio"
                        value={values.startTime}
                        onChange={(event) => onChange("startTime", event.target.value)}
                        slotProps={{ inputLabel: { shrink: true } }}
                    />
                    <TextField
                        fullWidth
                        size="small"
                        type="time"
                        label="Hora fin"
                        value={values.endTime}
                        onChange={(event) => onChange("endTime", event.target.value)}
                        slotProps={{ inputLabel: { shrink: true } }}
                    />
                    <NumberField
                        label="Duración (seg)"
                        value={values.durationSeconds}
                        onChange={(next) => onChange("durationSeconds", next)}
                    />
                    <NumberField
                        label={isIndoor ? "Distancia treadmill (km)" : "Distancia (km)"}
                        value={values.distanceKm}
                        step={0.01}
                        onChange={(next) => onChange("distanceKm", next)}
                    />
                </Box>
            </FormBlock>

            <FormBlock title="Métricas" subtitle="Datos opcionales de dispositivo o captura manual.">
                <Box sx={fieldGridSx()}>
                    <NumberField label="Pasos" value={values.steps} onChange={(next) => onChange("steps", next)} />
                    {!isIndoor ? (
                        <NumberField
                            label="Elevación (m)"
                            value={values.elevationGainM}
                            step={0.01}
                            onChange={(next) => onChange("elevationGainM", next)}
                        />
                    ) : null}
                    <NumberField label="Kcal activas" value={values.activeKcal} onChange={(next) => onChange("activeKcal", next)} />
                    <NumberField label="Kcal totales" value={values.totalKcal} onChange={(next) => onChange("totalKcal", next)} />
                    <NumberField label="FC prom" value={values.avgHr} onChange={(next) => onChange("avgHr", next)} />
                    <NumberField label="FC máx" value={values.maxHr} onChange={(next) => onChange("maxHr", next)} />
                    <NumberField label="Ritmo (seg/km)" value={values.paceSecPerKm} onChange={(next) => onChange("paceSecPerKm", next)} />
                    <NumberField label="Cadencia (rpm)" value={values.cadenceRpm} onChange={(next) => onChange("cadenceRpm", next)} />
                    <NumberField label="Vel. prom (km/h)" value={values.avgSpeedKmh} step={0.01} onChange={(next) => onChange("avgSpeedKmh", next)} />
                    <NumberField label="Vel. máx (km/h)" value={values.maxSpeedKmh} step={0.01} onChange={(next) => onChange("maxSpeedKmh", next)} />
                    <NumberField label="Zancada (m)" value={values.strideLengthM} step={0.01} onChange={(next) => onChange("strideLengthM", next)} />
                </Box>
            </FormBlock>

            {!isIndoor ? (
                <FormBlock title="Ruta" subtitle="Aplica para sesiones outdoor con GPS.">
                    <Box sx={fieldGridSx()}>
                        <NumberField
                            label="Puntos de ruta"
                            value={values.routePointCount}
                            onChange={(next) => onChange("routePointCount", next)}
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={values.hasRoute}
                                    onChange={(event) => onChange("hasRoute", event.target.checked)}
                                />
                            }
                            label="Tiene ruta"
                        />
                    </Box>
                </FormBlock>
            ) : null}

            <TextField
                fullWidth
                multiline
                minRows={4}
                label="Notas"
                value={values.notes}
                onChange={(event) => onChange("notes", event.target.value)}
                placeholder="Notas opcionales de la sesión…"
            />

            <AppActionRow align="right" reverseOnMobile>
                <Button type="button" variant="outlined" onClick={onCancel} disabled={isSubmitting}>
                    Cancelar
                </Button>
                <Button type="submit" variant="contained" disabled={isSubmitting}>
                    {isSubmitting
                        ? mode === "create"
                            ? "Guardando..."
                            : "Actualizando..."
                        : mode === "create"
                            ? "Guardar sesión"
                            : "Actualizar sesión"}
                </Button>
            </AppActionRow>
        </Box>
    );
}

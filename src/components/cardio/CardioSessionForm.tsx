// src/components/cardio/CardioSessionForm.tsx
// MUI manual form for Cardio sessions in Web.
// Uses user-friendly duration and pace inputs while preserving the API contract
// that stores duration and pace as seconds.

import type { FormEvent, ReactNode } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

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
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    onCancel: () => void;
};

type NumberFieldProps = {
    label: string;
    value: string;
    onChange: (value: string) => void;
    min?: number;
    step?: number;
    tooltip?: string;
};

type ClockTextFieldProps = {
    label: string;
    value: string;
    placeholder: string;
    tooltip?: string;
    onChange: (value: string) => void;
};

type DesktopGridColumns = 2 | 3 | 4;

/**
 * Responsive grid shared by the Cardio form sections.
 * Mobile keeps two compact fields per row, while desktop receives the
 * section-specific column count requested by the form layout.
 */
function fieldGridSx(desktopColumns: DesktopGridColumns) {
    return {
        display: "grid",
        gridTemplateColumns: {
            xs: "repeat(2, minmax(0, 1fr))",
            md: `repeat(${desktopColumns}, minmax(0, 1fr))`,
        },
        columnGap: { xs: 1, md: 1.75 },
        rowGap: { xs: 1.25, md: 1.75 },
        alignItems: "start",
        "& > *": {
            minWidth: 0,
        },
    };
}

/**
 * Compact help affordance used instead of persistent helper text.
 * It keeps every grid row aligned while remaining accessible by mouse,
 * keyboard, and touch.
 */
function FieldInfoTooltip(props: { label: string; tooltip: string }) {
    return (
        <InputAdornment position="end">
            <Tooltip title={props.tooltip} arrow enterTouchDelay={0}>
                <IconButton
                    type="button"
                    size="small"
                    edge="end"
                    aria-label={`Información sobre ${props.label}`}
                    sx={{ color: "text.secondary" }}
                >
                    <InfoOutlinedIcon sx={{ fontSize: 17 }} />
                </IconButton>
            </Tooltip>
        </InputAdornment>
    );
}

function NumberField({
    label,
    value,
    onChange,
    min,
    step,
    tooltip,
}: NumberFieldProps) {
    return (
        <TextField
            fullWidth
            size="small"
            type="number"
            label={label}
            value={value}
            slotProps={{
                htmlInput: {
                    min: min ?? 0,
                    step: step ?? 1,
                },
                input: tooltip
                    ? {
                          endAdornment: (
                              <FieldInfoTooltip
                                  label={label}
                                  tooltip={tooltip}
                              />
                          ),
                      }
                    : undefined,
            }}
            onChange={(event) => onChange(event.target.value)}
        />
    );
}

/**
 * Text input for clock-style values copied directly from Apple Watch/Fitness.
 * The service layer validates and converts these values into canonical seconds.
 */
function ClockTextField({
    label,
    value,
    placeholder,
    tooltip,
    onChange,
}: ClockTextFieldProps) {
    return (
        <TextField
            fullWidth
            size="small"
            type="text"
            label={label}
            value={value}
            placeholder={placeholder}
            slotProps={{
                htmlInput: {
                    inputMode: "numeric",
                },
                input: tooltip
                    ? {
                          endAdornment: (
                              <FieldInfoTooltip
                                  label={label}
                                  tooltip={tooltip}
                              />
                          ),
                      }
                    : undefined,
            }}
            onChange={(event) => onChange(event.target.value)}
        />
    );
}

function FormBlock(props: {
    title: string;
    subtitle?: string;
    children: ReactNode;
}) {
    return (
        <AppCard
            padding="sm"
            tone="soft"
            title={props.title}
            subtitle={props.subtitle}
        >
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
        <Box
            component="form"
            onSubmit={onSubmit}
            sx={{
                display: "flex",
                flexDirection: "column",
                gap: { xs: 1.5, md: 2 },
            }}
        >
            <Typography variant="body2" color="text.secondary">
                Fecha seleccionada:{" "}
                <Box
                    component="span"
                    sx={{
                        color: "text.primary",
                        fontWeight: 800,
                    }}
                >
                    {selectedDate}
                </Box>
            </Typography>

            <FormBlock
                title="Tipo de sesión"
                subtitle="Define actividad, ambiente y dispositivo origen."
            >
                <Box sx={fieldGridSx(3)}>
                    <TextField
                        select
                        fullWidth
                        size="small"
                        label="Ambiente"
                        value={values.cardioEnvironment}
                        onChange={(event) => {
                            const nextEnvironment =
                                event.target.value === "indoor"
                                    ? "indoor"
                                    : "outdoor";

                            onChange(
                                "cardioEnvironment",
                                nextEnvironment
                            );

                            if (nextEnvironment === "indoor") {
                                onChange("hasRoute", false);
                                onChange("routePointCount", "");
                                onChange("elevationGainM", "");
                            }
                        }}
                    >
                        <MenuItem value="outdoor">
                            Outdoor
                        </MenuItem>

                        <MenuItem value="indoor">
                            Indoor / Treadmill
                        </MenuItem>
                    </TextField>

                    <TextField
                        select
                        fullWidth
                        size="small"
                        label="Actividad"
                        value={values.activityType}
                        onChange={(event) =>
                            onChange(
                                "activityType",
                                event.target.value === "running"
                                    ? "running"
                                    : "walking"
                            )
                        }
                    >
                        <MenuItem value="walking">
                            Walking
                        </MenuItem>

                        <MenuItem value="running">
                            Running
                        </MenuItem>
                    </TextField>

                    <Box sx={{ minWidth: 0 }}>
                        <DeviceSelect
                            t={t}
                            value={values.sourceDevice || null}
                            onChange={(next) =>
                                onChange(
                                    "sourceDevice",
                                    next ?? ""
                                )
                            }
                            className="!space-y-0 [&>label]:sr-only [&>select]:!mt-0 [&>select]:h-10"
                        />
                    </Box>
                </Box>
            </FormBlock>

            <FormBlock
                title="Tiempo y distancia"
                subtitle="Copia la duración tal como aparece en el reloj o escríbela en minutos."
            >
                <Box sx={fieldGridSx(4)}>
                    <TextField
                        fullWidth
                        size="small"
                        type="time"
                        label="Hora inicio"
                        value={values.startTime}
                        onChange={(event) =>
                            onChange(
                                "startTime",
                                event.target.value
                            )
                        }
                        slotProps={{
                            inputLabel: {
                                shrink: true,
                            },
                        }}
                    />

                    <TextField
                        fullWidth
                        size="small"
                        type="time"
                        label="Hora fin"
                        value={values.endTime}
                        onChange={(event) =>
                            onChange(
                                "endTime",
                                event.target.value
                            )
                        }
                        slotProps={{
                            inputLabel: {
                                shrink: true,
                            },
                        }}
                    />

                    <ClockTextField
                        label="Duración"
                        value={values.durationText}
                        placeholder="7:49"
                        tooltip="Escribe solo números. Ejemplos: 49 = 49 s, 749 = 7:49 y 10749 = 1:07:49. Internamente se guarda en segundos."
                        onChange={(next) =>
                            onChange("durationText", next)
                        }
                    />

                    <NumberField
                        label={
                            isIndoor
                                ? "Distancia treadmill (km)"
                                : "Distancia (km)"
                        }
                        value={values.distanceKm}
                        step={0.01}
                        onChange={(next) =>
                            onChange("distanceKm", next)
                        }
                    />
                </Box>
            </FormBlock>

            <FormBlock
                title="Métricas"
                subtitle="Datos opcionales del dispositivo o de captura manual."
            >
                <Box sx={fieldGridSx(4)}>
                    <NumberField
                        label="Pasos"
                        value={values.steps}
                        onChange={(next) =>
                            onChange("steps", next)
                        }
                    />

                    {!isIndoor ? (
                        <NumberField
                            label="Elevación (m)"
                            value={values.elevationGainM}
                            step={0.01}
                            onChange={(next) =>
                                onChange(
                                    "elevationGainM",
                                    next
                                )
                            }
                        />
                    ) : null}

                    <NumberField
                        label="Kcal activas"
                        value={values.activeKcal}
                        onChange={(next) =>
                            onChange("activeKcal", next)
                        }
                    />

                    <NumberField
                        label="Kcal totales"
                        value={values.totalKcal}
                        onChange={(next) =>
                            onChange("totalKcal", next)
                        }
                    />

                    <NumberField
                        label="FC prom"
                        value={values.avgHr}
                        onChange={(next) =>
                            onChange("avgHr", next)
                        }
                    />

                    <NumberField
                        label="FC máx"
                        value={values.maxHr}
                        onChange={(next) =>
                            onChange("maxHr", next)
                        }
                    />

                    <ClockTextField
                        label="Ritmo (min/km)"
                        value={values.paceText}
                        placeholder="14:27"
                        tooltip="Escríbelo como aparece en Apple Watch; por ejemplo, 1427 se muestra como 14'27″. Si queda vacío, se estima con duración y distancia."
                        onChange={(next) =>
                            onChange("paceText", next)
                        }
                    />

                    <NumberField
                        label="Cadencia (rpm)"
                        value={values.cadenceRpm}
                        onChange={(next) =>
                            onChange("cadenceRpm", next)
                        }
                    />

                    <NumberField
                        label="Vel. prom (km/h)"
                        value={values.avgSpeedKmh}
                        step={0.01}
                        tooltip="Opcional. Si queda vacía, se calcula con el ritmo o con distancia y duración."
                        onChange={(next) =>
                            onChange("avgSpeedKmh", next)
                        }
                    />

                    <NumberField
                        label="Vel. máx (km/h)"
                        value={values.maxSpeedKmh}
                        step={0.01}
                        onChange={(next) =>
                            onChange("maxSpeedKmh", next)
                        }
                    />

                    <NumberField
                        label="Zancada (m)"
                        value={values.strideLengthM}
                        step={0.01}
                        onChange={(next) =>
                            onChange("strideLengthM", next)
                        }
                    />
                </Box>
            </FormBlock>

            {!isIndoor ? (
                <FormBlock
                    title="Ruta"
                    subtitle="Aplica para sesiones outdoor con GPS."
                >
                    <Box sx={fieldGridSx(2)}>
                        <NumberField
                            label="Puntos de ruta"
                            value={values.routePointCount}
                            onChange={(next) =>
                                onChange(
                                    "routePointCount",
                                    next
                                )
                            }
                        />

                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={values.hasRoute}
                                    onChange={(event) =>
                                        onChange(
                                            "hasRoute",
                                            event.target.checked
                                        )
                                    }
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
                onChange={(event) =>
                    onChange("notes", event.target.value)
                }
                placeholder="Notas opcionales de la sesión…"
            />

            <AppActionRow
                align="right"
                reverseOnMobile
            >
                <Button
                    type="button"
                    variant="outlined"
                    onClick={onCancel}
                    disabled={isSubmitting}
                >
                    Cancelar
                </Button>

                <Button
                    type="submit"
                    variant="contained"
                    disabled={isSubmitting}
                >
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

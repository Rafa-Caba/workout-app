// src/components/cardio/CardioSessionForm.tsx

/**
 * CardioSessionForm
 *
 * Manual form for Cardio sessions in Web.
 * Rendered inside a modal. Supports indoor/outdoor walking/running.
 */

import React from "react";

import { DeviceSelect } from "@/components/DeviceSelect";
import { Button } from "@/components/ui/button";
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
        <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1">
                <h2 className="text-base font-semibold text-foreground">
                    {mode === "create" ? "Nueva sesión Cardio" : "Editar sesión Cardio"}
                </h2>

                <p className="text-sm text-muted-foreground">
                    Fecha seleccionada:{" "}
                    <span className="font-medium text-foreground">{selectedDate}</span>
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Ambiente">
                    <select
                        className="h-10 w-full rounded-xl border bg-background px-3 text-sm"
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
                        <option value="outdoor">Outdoor</option>
                        <option value="indoor">Indoor / Treadmill</option>
                    </select>
                </Field>

                <Field label="Actividad">
                    <select
                        className="h-10 w-full rounded-xl border bg-background px-3 text-sm"
                        value={values.activityType}
                        onChange={(event) =>
                            onChange("activityType", event.target.value === "running" ? "running" : "walking")
                        }
                    >
                        <option value="walking">Walking</option>
                        <option value="running">Running</option>
                    </select>
                </Field>

                <div className="space-y-1.5">
                    <DeviceSelect
                        t={t}
                        value={values.sourceDevice || null}
                        onChange={(next) => onChange("sourceDevice", next ?? "")}
                    />
                </div>

                <Field label="Hora inicio">
                    <input
                        type="time"
                        className="h-10 w-full rounded-xl border bg-background px-3 text-sm"
                        value={values.startTime}
                        onChange={(event) => onChange("startTime", event.target.value)}
                    />
                </Field>

                <Field label="Hora fin">
                    <input
                        type="time"
                        className="h-10 w-full rounded-xl border bg-background px-3 text-sm"
                        value={values.endTime}
                        onChange={(event) => onChange("endTime", event.target.value)}
                    />
                </Field>

                <Field label="Duración (seg)">
                    <input
                        type="number"
                        min="0"
                        className="h-10 w-full rounded-xl border bg-background px-3 text-sm"
                        value={values.durationSeconds}
                        onChange={(event) => onChange("durationSeconds", event.target.value)}
                    />
                </Field>

                <Field label={isIndoor ? "Distancia treadmill (km)" : "Distancia (km)"}>
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="h-10 w-full rounded-xl border bg-background px-3 text-sm"
                        value={values.distanceKm}
                        onChange={(event) => onChange("distanceKm", event.target.value)}
                    />
                </Field>

                <Field label="Pasos">
                    <input
                        type="number"
                        min="0"
                        step="1"
                        className="h-10 w-full rounded-xl border bg-background px-3 text-sm"
                        value={values.steps}
                        onChange={(event) => onChange("steps", event.target.value)}
                    />
                </Field>

                {!isIndoor ? (
                    <Field label="Elevación (m)">
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="h-10 w-full rounded-xl border bg-background px-3 text-sm"
                            value={values.elevationGainM}
                            onChange={(event) => onChange("elevationGainM", event.target.value)}
                        />
                    </Field>
                ) : null}

                <Field label="Kcal activas">
                    <input
                        type="number"
                        min="0"
                        step="1"
                        className="h-10 w-full rounded-xl border bg-background px-3 text-sm"
                        value={values.activeKcal}
                        onChange={(event) => onChange("activeKcal", event.target.value)}
                    />
                </Field>

                <Field label="Kcal totales">
                    <input
                        type="number"
                        min="0"
                        step="1"
                        className="h-10 w-full rounded-xl border bg-background px-3 text-sm"
                        value={values.totalKcal}
                        onChange={(event) => onChange("totalKcal", event.target.value)}
                    />
                </Field>

                <Field label="FC prom">
                    <input
                        type="number"
                        min="0"
                        step="1"
                        className="h-10 w-full rounded-xl border bg-background px-3 text-sm"
                        value={values.avgHr}
                        onChange={(event) => onChange("avgHr", event.target.value)}
                    />
                </Field>

                <Field label="FC máx">
                    <input
                        type="number"
                        min="0"
                        step="1"
                        className="h-10 w-full rounded-xl border bg-background px-3 text-sm"
                        value={values.maxHr}
                        onChange={(event) => onChange("maxHr", event.target.value)}
                    />
                </Field>

                <Field label="Ritmo (seg/km)">
                    <input
                        type="number"
                        min="0"
                        step="1"
                        className="h-10 w-full rounded-xl border bg-background px-3 text-sm"
                        value={values.paceSecPerKm}
                        onChange={(event) => onChange("paceSecPerKm", event.target.value)}
                    />
                </Field>

                <Field label="Cadencia (rpm)">
                    <input
                        type="number"
                        min="0"
                        step="1"
                        className="h-10 w-full rounded-xl border bg-background px-3 text-sm"
                        value={values.cadenceRpm}
                        onChange={(event) => onChange("cadenceRpm", event.target.value)}
                    />
                </Field>

                <Field label="Vel. prom (km/h)">
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="h-10 w-full rounded-xl border bg-background px-3 text-sm"
                        value={values.avgSpeedKmh}
                        onChange={(event) => onChange("avgSpeedKmh", event.target.value)}
                    />
                </Field>

                <Field label="Vel. máx (km/h)">
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="h-10 w-full rounded-xl border bg-background px-3 text-sm"
                        value={values.maxSpeedKmh}
                        onChange={(event) => onChange("maxSpeedKmh", event.target.value)}
                    />
                </Field>

                <Field label="Zancada (m)">
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="h-10 w-full rounded-xl border bg-background px-3 text-sm"
                        value={values.strideLengthM}
                        onChange={(event) => onChange("strideLengthM", event.target.value)}
                    />
                </Field>

                {!isIndoor ? (
                    <>
                        <Field label="Puntos de ruta">
                            <input
                                type="number"
                                min="0"
                                step="1"
                                className="h-10 w-full rounded-xl border bg-background px-3 text-sm"
                                value={values.routePointCount}
                                onChange={(event) => onChange("routePointCount", event.target.value)}
                            />
                        </Field>

                        <div className="flex items-end">
                            <label className="inline-flex items-center gap-2 text-sm text-foreground">
                                <input
                                    type="checkbox"
                                    checked={values.hasRoute}
                                    onChange={(event) => onChange("hasRoute", event.target.checked)}
                                />
                                Tiene ruta
                            </label>
                        </div>
                    </>
                ) : null}
            </div>

            <Field label="Notas">
                <textarea
                    className="min-h-[7rem] w-full rounded-xl border bg-background px-3 py-2 text-sm"
                    value={values.notes}
                    onChange={(event) => onChange("notes", event.target.value)}
                    placeholder="Notas opcionales de la sesión…"
                />
            </Field>

            <div className="flex flex-col gap-2 sm:flex-row">
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting
                        ? mode === "create"
                            ? "Guardando..."
                            : "Actualizando..."
                        : mode === "create"
                            ? "Guardar sesión"
                            : "Actualizar sesión"}
                </Button>

                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isSubmitting}
                >
                    Cancelar
                </Button>
            </div>
        </form>
    );
}

function Field({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <label className="space-y-1.5">
            <div className="text-sm font-medium text-foreground">{label}</div>
            {children}
        </label>
    );
}

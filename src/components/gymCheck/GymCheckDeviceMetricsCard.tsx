import * as React from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { DeviceSelect } from "../DeviceSelect";

type MetricsUiState = {
    startAtTime: string; // "HH:mm"
    endAtTime: string; // "HH:mm"
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

function Field({
    label,
    value,
    onChange,
    placeholder,
    type = "text",
    disabled,
    onBlur,
    inputMode,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    type?: string;
    disabled?: boolean;
    onBlur?: () => void;
    inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
    return (
        <label className="w-full min-w-0 space-y-1">
            <div className="text-xs font-medium opacity-80">{label}</div>
            <input
                className="w-full min-w-0 rounded-md border bg-background px-3 py-2 text-base sm:text-sm outline-none focus:ring-2"
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                onBlur={onBlur}
                inputMode={inputMode}
            />
        </label>
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
        <details
            className="w-full min-w-0 rounded-lg border bg-card p-4"
            open={metricsOpen}
            onToggle={(e) => onToggleOpen((e.currentTarget as HTMLDetailsElement).open)}
        >
            <summary className="cursor-pointer select-none list-none">
                <div className="min-w-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="min-w-0">
                        <div className="text-sm font-semibold wrap-break-words">
                            {lang === "es" ? "Métricas del dispositivo" : "Device metrics"}
                        </div>
                        <div className="text-xs opacity-70 wrap-break-words">
                            {lang === "es"
                                ? "Gym Check - Guardados al crear la sesión real."
                                : "Gym Check - Saved when creating the real session."}
                        </div>
                    </div>
                </div>
            </summary>

            <div className="mt-3 w-full min-w-0 grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                <Field
                    label={lang === "es" ? "Hora inicio" : "Start time"}
                    type="time"
                    value={metricsUi.startAtTime}
                    onChange={(v) => onMetricsUiChange({ startAtTime: v })}
                    onBlur={onCommit}
                    disabled={busy}
                />
                <Field
                    label={lang === "es" ? "Hora fin" : "End time"}
                    type="time"
                    value={metricsUi.endAtTime}
                    onChange={(v) => onMetricsUiChange({ endAtTime: v })}
                    onBlur={onCommit}
                    disabled={busy}
                />

                <Field
                    label={lang === "es" ? "Kcal activas" : "Active kcal"}
                    value={metricsUi.activeKcal}
                    onChange={(v) => onMetricsUiChange({ activeKcal: v })}
                    onBlur={onCommit}
                    placeholder="e.g. 432"
                    inputMode="decimal"
                    disabled={busy}
                />
                <Field
                    label={lang === "es" ? "Kcal totales" : "Total kcal"}
                    value={metricsUi.totalKcal}
                    onChange={(v) => onMetricsUiChange({ totalKcal: v })}
                    onBlur={onCommit}
                    placeholder="e.g. 545"
                    inputMode="decimal"
                    disabled={busy}
                />

                <Field
                    label={lang === "es" ? "HR promedio" : "Avg HR"}
                    value={metricsUi.avgHr}
                    onChange={(v) => onMetricsUiChange({ avgHr: v })}
                    onBlur={onCommit}
                    placeholder="e.g. 121"
                    inputMode="numeric"
                    disabled={busy}
                />
                <Field
                    label={lang === "es" ? "HR máximo" : "Max HR"}
                    value={metricsUi.maxHr}
                    onChange={(v) => onMetricsUiChange({ maxHr: v })}
                    onBlur={onCommit}
                    placeholder="e.g. 160"
                    inputMode="numeric"
                    disabled={busy}
                />

                <Field
                    label={lang === "es" ? "Distancia (km)" : "Distance (km)"}
                    value={metricsUi.distanceKm}
                    onChange={(v) => onMetricsUiChange({ distanceKm: v })}
                    onBlur={onCommit}
                    placeholder="e.g. 1.17"
                    inputMode="decimal"
                    disabled={busy}
                />
                <Field
                    label={lang === "es" ? "Pasos" : "Steps"}
                    value={metricsUi.steps}
                    onChange={(v) => onMetricsUiChange({ steps: v })}
                    onBlur={onCommit}
                    placeholder="e.g. 4200"
                    inputMode="numeric"
                    disabled={busy}
                />

                <Field
                    label={lang === "es" ? "Elevación (m)" : "Elevation gain (m)"}
                    value={metricsUi.elevationGainM}
                    onChange={(v) => onMetricsUiChange({ elevationGainM: v })}
                    onBlur={onCommit}
                    placeholder="e.g. 20"
                    inputMode="decimal"
                    disabled={busy}
                />
                <Field
                    label={lang === "es" ? "Ritmo (sec/km)" : "Pace (sec/km)"}
                    value={metricsUi.paceSecPerKm}
                    onChange={(v) => onMetricsUiChange({ paceSecPerKm: v })}
                    onBlur={onCommit}
                    placeholder="e.g. 512"
                    inputMode="numeric"
                    disabled={busy}
                />

                <Field
                    label={lang === "es" ? "Cadencia (rpm)" : "Cadence (rpm)"}
                    value={metricsUi.cadenceRpm}
                    onChange={(v) => onMetricsUiChange({ cadenceRpm: v })}
                    onBlur={onCommit}
                    placeholder="e.g. 78"
                    inputMode="numeric"
                    disabled={busy}
                />
                <Field
                    label={lang === "es" ? "Esfuerzo (RPE)" : "Effort (RPE)"}
                    value={metricsUi.effortRpe}
                    onChange={(v) => onMetricsUiChange({ effortRpe: v })}
                    onBlur={onCommit}
                    placeholder="1-10"
                    inputMode="decimal"
                    disabled={busy}
                />

                <DeviceSelect
                    t={t}
                    value={metricsUi.trainingSource?.trim() ? metricsUi.trainingSource : null}
                    onChange={(v) => {
                        onMetricsUiChange({ trainingSource: v ?? "" });
                    }}
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
                <Field
                    label={lang === "es" ? "RPE del día" : "Day RPE"}
                    value={metricsUi.dayEffortRpe}
                    onChange={(v) => onMetricsUiChange({ dayEffortRpe: v })}
                    onBlur={onCommit}
                    placeholder="1-10"
                    inputMode="decimal"
                    disabled={busy}
                />
            </div>
        </details>
    );
}

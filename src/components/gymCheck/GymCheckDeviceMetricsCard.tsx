import * as React from "react";

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
        <label className="space-y-1">
            <div className="text-xs font-medium opacity-80">{label}</div>
            <input
                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2"
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
    return (
        <details
            className="rounded-lg border bg-card p-4"
            open={metricsOpen}
            onToggle={(e) => onToggleOpen((e.currentTarget as HTMLDetailsElement).open)}
        >
            <summary className="cursor-pointer select-none list-none">
                <div className="flex items-center justify-between gap-2">
                    <div>
                        <div className="text-sm font-semibold">
                            {lang === "es" ? "Métricas del dispositivo" : "Device metrics"}
                        </div>
                        <div className="text-xs opacity-70">
                            {lang === "es"
                                ? "Gym Check - Guardados al crear la sesión real."
                                : "Gym Check - Saved when creating the real session."}
                        </div>
                    </div>

                    {/* <div className="text-xs opacity-70">
                        {metricsHasAny
                            ? lang === "es"
                                ? "Con datos"
                                : "Has data"
                            : lang === "es"
                                ? "Colapsado"
                                : "Collapsed"}
                    </div> */}
                </div>
            </summary>

            <div className="mt-3 grid gap-3 grid-cols-2 md:grid-cols-5">
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

                <Field
                    label={lang === "es" ? "Fuente" : "Source"}
                    value={metricsUi.trainingSource}
                    onChange={(v) => onMetricsUiChange({ trainingSource: v })}
                    onBlur={onCommit}
                    placeholder="Apple Watch"
                    disabled={busy}
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

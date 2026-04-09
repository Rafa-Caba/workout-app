// src/components/progress/ProgressPeriodToolbar.tsx
import React from "react";
import type {
    WorkoutProgressCompareTo,
    WorkoutProgressMode,
} from "@/types/workoutProgress.types";
import { Button } from "@/components/ui/button";

type Props = {
    mode: WorkoutProgressMode;
    compareTo: WorkoutProgressCompareTo;
    customFrom: string;
    customTo: string;
    customRangeLabel?: string | null;
    onChangeMode: (value: WorkoutProgressMode) => void;
    onChangeCompareTo: (value: WorkoutProgressCompareTo) => void;
    onChangeCustomFrom: (value: string) => void;
    onChangeCustomTo: (value: string) => void;
    onApplyCustomRange: () => void;
};

const MODE_OPTIONS: Array<{ value: WorkoutProgressMode; label: string }> = [
    { value: "last7", label: "7 días" },
    { value: "last30", label: "30 días" },
    { value: "currentMonth", label: "Mes actual" },
    { value: "customRange", label: "Personalizado" },
];

const COMPARE_OPTIONS: Array<{ value: WorkoutProgressCompareTo; label: string }> = [
    { value: "previous_period", label: "Periodo previo" },
    { value: "previous_month", label: "Mes previo" },
    { value: "none", label: "Sin comparar" },
];

export function ProgressPeriodToolbar({
    mode,
    compareTo,
    customFrom,
    customTo,
    customRangeLabel = null,
    onChangeMode,
    onChangeCompareTo,
    onChangeCustomFrom,
    onChangeCustomTo,
    onApplyCustomRange,
}: Props) {
    const canApplyCustomRange =
        mode === "customRange" &&
        Boolean(customFrom) &&
        Boolean(customTo) &&
        customFrom <= customTo;

    return (
        <div className="rounded-xl border bg-card p-4 space-y-4">
            <div className="space-y-2">
                <div className="text-sm font-semibold">Periodo</div>

                <div className="flex flex-wrap gap-2">
                    {MODE_OPTIONS.map((option) => (
                        <Button
                            key={option.value}
                            type="button"
                            variant={option.value === mode ? "default" : "outline"}
                            onClick={() => onChangeMode(option.value)}
                        >
                            {option.label}
                        </Button>
                    ))}
                </div>

                {mode === "customRange" ? (
                    <>
                        <div className="flex flex-row gap-3 items-start md:items-end pt-2">
                            <div className="space-y-1">
                                <div className="text-xs font-semibold text-muted-foreground">
                                    Fecha inicio
                                </div>
                                <input
                                    type="date"
                                    value={customFrom}
                                    onChange={(event) => onChangeCustomFrom(event.target.value)}
                                    className={[
                                        "flex h-10 w-auto md:w-52 rounded-md border border-input bg-background px-3 py-2",
                                        "text-sm ring-offset-background",
                                        "file:border-0 file:bg-transparent file:text-sm file:font-medium",
                                        "placeholder:text-muted-foreground",
                                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                                        "disabled:cursor-not-allowed disabled:opacity-50",
                                    ].join(" ")}
                                />
                            </div>

                            <div className="space-y-1">
                                <div className="text-xs font-semibold text-muted-foreground">
                                    Fecha fin
                                </div>
                                <input
                                    type="date"
                                    value={customTo}
                                    onChange={(event) => onChangeCustomTo(event.target.value)}
                                    className={[
                                        "flex h-10 w-auto md:w-52 rounded-md border border-input bg-background px-3 py-2",
                                        "text-sm ring-offset-background",
                                        "file:border-0 file:bg-transparent file:text-sm file:font-medium",
                                        "placeholder:text-muted-foreground",
                                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                                        "disabled:cursor-not-allowed disabled:opacity-50",
                                    ].join(" ")}
                                />
                            </div>
                        </div>
                        <Button
                            type="button"
                            onClick={onApplyCustomRange}
                            disabled={!canApplyCustomRange}
                        >
                            Aplicar rango
                        </Button>
                    </>
                ) : null}

                {mode === "customRange" && customRangeLabel ? (
                    <div className="text-xs text-muted-foreground font-medium">
                        {customRangeLabel}
                    </div>
                ) : null}

                {mode === "customRange" && customFrom && customTo && customFrom > customTo ? (
                    <div className="text-xs font-semibold text-amber-600">
                        La fecha inicial no puede ser mayor que la final.
                    </div>
                ) : null}
            </div>

            <div className="space-y-2">
                <div className="text-sm font-semibold">Comparar con</div>
                <div className="flex flex-wrap gap-2">
                    {COMPARE_OPTIONS.map((option) => (
                        <Button
                            key={option.value}
                            type="button"
                            variant={option.value === compareTo ? "default" : "outline"}
                            onClick={() => onChangeCompareTo(option.value)}
                        >
                            {option.label}
                        </Button>
                    ))}
                </div>
            </div>
        </div>
    );
}
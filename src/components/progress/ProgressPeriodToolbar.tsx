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
    onChangeMode: (value: WorkoutProgressMode) => void;
    onChangeCompareTo: (value: WorkoutProgressCompareTo) => void;
};

const MODE_OPTIONS: Array<{ value: WorkoutProgressMode; label: string }> = [
    { value: "last7", label: "7 días" },
    { value: "last30", label: "30 días" },
    { value: "currentMonth", label: "Mes actual" },
];

const COMPARE_OPTIONS: Array<{ value: WorkoutProgressCompareTo; label: string }> = [
    { value: "previous_period", label: "Periodo previo" },
    { value: "previous_month", label: "Mes previo" },
    { value: "none", label: "Sin comparar" },
];

export function ProgressPeriodToolbar({
    mode,
    compareTo,
    onChangeMode,
    onChangeCompareTo,
}: Props) {
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
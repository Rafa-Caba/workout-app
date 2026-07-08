// src/components/progress/ProgressPeriodToolbar.tsx
// MUI toolbar for progress mode, custom ranges and comparison options.

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { AppCard } from "@/components/mui";
import type { WorkoutProgressCompareTo, WorkoutProgressMode } from "@/types/workoutProgress.types";

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
    const canApplyCustomRange = mode === "customRange" && Boolean(customFrom) && Boolean(customTo) && customFrom <= customTo;

    return (
        <AppCard>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>Periodo</Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                        {MODE_OPTIONS.map((option) => (
                            <Button
                                key={option.value}
                                type="button"
                                size="small"
                                variant={option.value === mode ? "contained" : "outlined"}
                                onClick={() => onChangeMode(option.value)}
                            >
                                {option.label}
                            </Button>
                        ))}
                    </Box>

                    {mode === "customRange" ? (
                        <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 1, alignItems: { xs: "stretch", sm: "flex-end" }, mt: 1.5 }}>
                            <TextField
                                label="Fecha inicio"
                                type="date"
                                value={customFrom}
                                onChange={(event) => onChangeCustomFrom(event.target.value)}
                                size="small"
                            />
                            <TextField
                                label="Fecha fin"
                                type="date"
                                value={customTo}
                                onChange={(event) => onChangeCustomTo(event.target.value)}
                                size="small"
                            />
                            <Button type="button" variant="contained" onClick={onApplyCustomRange} disabled={!canApplyCustomRange}>
                                Aplicar rango
                            </Button>
                        </Box>
                    ) : null}

                    {mode === "customRange" && customRangeLabel ? (
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                            {customRangeLabel}
                        </Typography>
                    ) : null}

                    {mode === "customRange" && customFrom && customTo && customFrom > customTo ? (
                        <Typography variant="caption" color="warning.main" sx={{ display: "block", mt: 1, fontWeight: 800 }}>
                            La fecha inicial no puede ser mayor que la final.
                        </Typography>
                    ) : null}
                </Box>

                <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>Comparar con</Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                        {COMPARE_OPTIONS.map((option) => (
                            <Button
                                key={option.value}
                                type="button"
                                size="small"
                                variant={option.value === compareTo ? "contained" : "outlined"}
                                onClick={() => onChangeCompareTo(option.value)}
                            >
                                {option.label}
                            </Button>
                        ))}
                    </Box>
                </Box>
            </Box>
        </AppCard>
    );
}

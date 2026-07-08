// src/components/gymCheck/GymCheckDayQuickLog.tsx
// MUI quick-log card for Gym Check duration and notes.

import TextField from "@mui/material/TextField";
import { AppCard, AppFormGrid } from "@/components/mui";

type Props = {
    lang: "es" | "en";
    busy: boolean;
    durationMin: string;
    notes: string;
    onChangeDuration: (v: string) => void;
    onChangeNotes: (v: string) => void;
};

export function GymCheckDayQuickLog(props: Props) {
    const { lang, busy, durationMin, notes, onChangeDuration, onChangeNotes } = props;

    return (
        <AppCard
            title={lang === "es" ? "Registro rápido" : "Quick log"}
            subtitle={lang === "es" ? "Duración y notas rápidas del día." : "Duration and quick notes for the day."}
            padding="md"
        >
            <AppFormGrid columns={{ xs: 1, md: 2 }} gap={1.5}>
                <TextField
                    fullWidth
                    size="small"
                    label={lang === "es" ? "Duración (min)" : "Duration (min)"}
                    value={durationMin}
                    onChange={(event) => onChangeDuration(event.target.value)}
                    placeholder={lang === "es" ? "Ej. 75" : "e.g. 75"}
                    inputMode="decimal"
                    disabled={busy}
                />

                <TextField
                    fullWidth
                    size="small"
                    label={lang === "es" ? "Notas" : "Notes"}
                    value={notes}
                    onChange={(event) => onChangeNotes(event.target.value)}
                    placeholder={lang === "es" ? "Notas rápidas..." : "Quick notes..."}
                    disabled={busy}
                />
            </AppFormGrid>
        </AppCard>
    );
}

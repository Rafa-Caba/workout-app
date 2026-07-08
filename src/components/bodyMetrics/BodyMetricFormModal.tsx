// src/components/bodyMetrics/BodyMetricFormModal.tsx
// MUI dialog for creating or editing body metric entries.

import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";

import { AppFormGrid } from "@/components/mui";
import type { UpsertUserMetricRequest, UserMetricEntry } from "@/types/bodyMetrics.types";

type FormState = {
    date: string;
    weightKg: string;
    bodyFatPct: string;
    waistCm: string;
    notes: string;
};

function getTodayIsoDate(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function parseNullableNumber(value: string): number | null {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
}

function toInitialForm(entry: UserMetricEntry | null): FormState {
    return {
        date: entry?.date ?? getTodayIsoDate(),
        weightKg: typeof entry?.weightKg === "number" ? String(entry.weightKg) : "",
        bodyFatPct: typeof entry?.bodyFatPct === "number" ? String(entry.bodyFatPct) : "",
        waistCm: typeof entry?.waistCm === "number" ? String(entry.waistCm) : "",
        notes: entry?.notes ?? "",
    };
}

function isMeaningfulPayload(payload: UpsertUserMetricRequest): boolean {
    return (
        payload.weightKg !== null ||
        payload.bodyFatPct !== null ||
        payload.waistCm !== null ||
        (typeof payload.notes === "string" && payload.notes.trim().length > 0)
    );
}

export function BodyMetricFormModal({
    open,
    initialEntry,
    saving,
    onClose,
    onSave,
}: {
    open: boolean;
    initialEntry: UserMetricEntry | null;
    saving: boolean;
    onClose: () => void;
    onSave: (args: { date: string; payload: UpsertUserMetricRequest }) => Promise<void>;
}) {
    const [form, setForm] = React.useState<FormState>(() => toInitialForm(initialEntry));

    React.useEffect(() => {
        if (!open) return;
        setForm(toInitialForm(initialEntry));
    }, [initialEntry, open]);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const payload: UpsertUserMetricRequest = {
            weightKg: parseNullableNumber(form.weightKg),
            bodyFatPct: parseNullableNumber(form.bodyFatPct),
            waistCm: parseNullableNumber(form.waistCm),
            notes: form.notes.trim().length ? form.notes.trim() : null,
            source: initialEntry?.source ?? "manual",
        };

        if (!isMeaningfulPayload(payload)) {
            return;
        }

        await onSave({ date: form.date, payload });
    }

    return (
        <Dialog
            open={open}
            onClose={saving ? undefined : onClose}
            fullWidth
            maxWidth="sm"
            slotProps={{
                paper: {
                    sx: {
                        borderRadius: 3,
                        overflow: "hidden",
                    },
                },
            }}
        >
            <Box component="form" onSubmit={(event) => void handleSubmit(event)}>
                <DialogTitle
                    component="div"
                    sx={{ p: 0, borderBottom: 1, borderColor: "divider" }}
                >
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 2,
                            px: { xs: 2, md: 2.5 },
                            py: 1.5,
                        }}
                    >
                        <Box sx={{ minWidth: 0 }}>
                            <Typography variant="h6" component="h2" sx={{ fontWeight: 800 }}>
                                {initialEntry ? "Editar registro corporal" : "Nuevo registro corporal"}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Guarda peso, cintura, grasa corporal y notas del día.
                            </Typography>
                        </Box>

                        <IconButton aria-label="Cerrar" onClick={onClose} disabled={saving}>
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>

                <DialogContent
                    sx={{
                        p: { xs: 2, md: 2.5 },
                        scrollbarWidth: "none",
                        "&::-webkit-scrollbar": { display: "none" },
                    }}
                >
                    <AppFormGrid columns={{ xs: 1, sm: 2 }}>
                        <TextField
                            label="Fecha"
                            type="date"
                            value={form.date}
                            onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
                            required
                            size="small"
                            fullWidth
                        />
                        <TextField
                            label="Peso (kg)"
                            type="number"
                            value={form.weightKg}
                            onChange={(event) => setForm((prev) => ({ ...prev, weightKg: event.target.value }))}
                            placeholder="Ej. 78.4"
                            size="small"
                            fullWidth
                            slotProps={{ htmlInput: { step: "0.1" } }}
                        />
                        <TextField
                            label="Grasa corporal (%)"
                            type="number"
                            value={form.bodyFatPct}
                            onChange={(event) => setForm((prev) => ({ ...prev, bodyFatPct: event.target.value }))}
                            placeholder="Ej. 18.2"
                            size="small"
                            fullWidth
                            slotProps={{ htmlInput: { step: "0.1" } }}
                        />
                        <TextField
                            label="Cintura (cm)"
                            type="number"
                            value={form.waistCm}
                            onChange={(event) => setForm((prev) => ({ ...prev, waistCm: event.target.value }))}
                            placeholder="Ej. 84.5"
                            size="small"
                            fullWidth
                            slotProps={{ htmlInput: { step: "0.1" } }}
                        />
                    </AppFormGrid>

                    <TextField
                        label="Notas"
                        value={form.notes}
                        onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                        placeholder="Cómo te sentiste, contexto, observaciones..."
                        fullWidth
                        multiline
                        minRows={4}
                        size="small"
                        sx={{ mt: 2 }}
                    />
                </DialogContent>

                <DialogActions sx={{ px: { xs: 2, md: 2.5 }, py: 1.5 }}>
                    <Button type="button" variant="outlined" onClick={onClose} disabled={saving}>
                        Cancelar
                    </Button>
                    <Button type="submit" variant="contained" disabled={saving}>
                        {saving ? "Guardando..." : "Guardar"}
                    </Button>
                </DialogActions>
            </Box>
        </Dialog>
    );
}

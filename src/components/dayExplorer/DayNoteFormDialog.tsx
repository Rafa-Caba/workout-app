// src/components/dayExplorer/DayNoteFormDialog.tsx
// Responsive dialog for adding or editing a plain-text structured WorkoutDay note.

import * as React from "react";
import CloseIcon from "@mui/icons-material/Close";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import type {
    WorkoutDayNote,
    WorkoutDayNoteDraft,
    WorkoutDayNoteType,
} from "@/types/workoutDay.types";
import { DAY_NOTE_TYPE_OPTIONS } from "@/utils/dayNotes";

type FormState = {
    date: string;
    type: WorkoutDayNoteType;
    title: string;
    description: string;
};

type Props = {
    open: boolean;
    lang: "es" | "en";
    initialDate: string;
    initialNote?: WorkoutDayNote | null;
    saving: boolean;
    onClose: () => void;
    onSave: (args: { date: string; draft: WorkoutDayNoteDraft }) => Promise<void>;
};

function createInitialForm(date: string, note: WorkoutDayNote | null | undefined): FormState {
    if (note) {
        return {
            date,
            type: note.type,
            title: note.title,
            description: note.description ?? "",
        };
    }

    return {
        date,
        type: "reminder",
        title: "",
        description: "",
    };
}

export function DayNoteFormDialog(props: Props) {
    const {
        open,
        lang,
        initialDate,
        initialNote,
        saving,
        onClose,
        onSave,
    } = props;

    const isEditing = Boolean(initialNote);
    const [form, setForm] = React.useState<FormState>(() => createInitialForm(initialDate, initialNote));

    React.useEffect(() => {
        if (!open) return;
        setForm(createInitialForm(initialDate, initialNote));
    }, [initialDate, initialNote, open]);

    const canSave = form.date.length > 0 && form.title.trim().length > 0 && !saving;

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
        event.preventDefault();
        if (!canSave) return;

        await onSave({
            date: form.date,
            draft: {
                type: form.type,
                title: form.title.trim(),
                description: form.description.trim() || null,
            },
        });
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
                <DialogTitle component="div" sx={{ p: 0, borderBottom: 1, borderColor: "divider" }}>
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
                            <Typography variant="h6" component="h2" sx={{ fontWeight: 850 }}>
                                {isEditing
                                    ? lang === "es"
                                        ? "Editar nota"
                                        : "Edit note"
                                    : lang === "es"
                                      ? "Agregar nota"
                                      : "Add note"}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {isEditing
                                    ? lang === "es"
                                        ? "Actualiza los datos de la nota seleccionada."
                                        : "Update the selected note details."
                                    : lang === "es"
                                      ? "La nota se guardará en el día seleccionado."
                                      : "The note will be saved to the selected day."}
                            </Typography>
                        </Box>

                        <IconButton
                            type="button"
                            aria-label={lang === "es" ? "Cerrar" : "Close"}
                            onClick={onClose}
                            disabled={saving}
                        >
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>

                <DialogContent sx={{ p: { xs: 2, md: 2.5 }, display: "grid", gap: 1.5 }}>
                    <TextField
                        label={lang === "es" ? "Fecha" : "Date"}
                        type="date"
                        value={form.date}
                        onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
                        required
                        disabled={isEditing}
                        fullWidth
                        size="small"
                        sx={{ mt: 1 }}
                    />

                    <TextField
                        select
                        label={lang === "es" ? "Tipo de nota" : "Note type"}
                        value={form.type}
                        onChange={(event) => {
                            const nextType = event.target.value as WorkoutDayNoteType;
                            setForm((current) => ({ ...current, type: nextType }));
                        }}
                        fullWidth
                        size="small"
                    >
                        {DAY_NOTE_TYPE_OPTIONS.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                                {option.emoji} {option.label[lang]}
                            </MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        label={lang === "es" ? "Título" : "Title"}
                        value={form.title}
                        onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                        placeholder={lang === "es" ? "Ej. Cumpleaños de Carito" : "E.g. Carito's birthday"}
                        required
                        fullWidth
                        size="small"
                        slotProps={{ htmlInput: { maxLength: 160 } }}
                    />

                    <TextField
                        label={lang === "es" ? "Descripción" : "Description"}
                        value={form.description}
                        onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                        placeholder={
                            lang === "es"
                                ? "Detalles u observaciones de la nota..."
                                : "Note details or observations..."
                        }
                        multiline
                        minRows={4}
                        fullWidth
                        size="small"
                        helperText={
                            lang === "es"
                                ? "Texto simple; se conservan los saltos de línea."
                                : "Plain text; line breaks are preserved."
                        }
                        slotProps={{ htmlInput: { maxLength: 5000 } }}
                    />
                </DialogContent>

                <DialogActions sx={{ px: { xs: 2, md: 2.5 }, py: 1.5 }}>
                    <Button type="button" variant="outlined" onClick={onClose} disabled={saving}>
                        {lang === "es" ? "Cancelar" : "Cancel"}
                    </Button>
                    <Button type="submit" variant="contained" disabled={!canSave}>
                        {saving
                            ? lang === "es"
                                ? "Guardando..."
                                : "Saving..."
                            : isEditing
                              ? lang === "es"
                                  ? "Guardar cambios"
                                  : "Save changes"
                              : lang === "es"
                                ? "Guardar nota"
                                : "Save note"}
                    </Button>
                </DialogActions>
            </Box>
        </Dialog>
    );
}

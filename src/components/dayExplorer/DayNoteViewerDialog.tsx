// src/components/dayExplorer/DayNoteViewerDialog.tsx
// Read-only modal for a structured WorkoutDay note selected from the calendar.

import CloseIcon from "@mui/icons-material/Close";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";

import type { WorkoutDayNote } from "@/types/workoutDay.types";
import { getDayNoteTypeOption } from "@/utils/dayNotes";

type Props = {
    open: boolean;
    lang: "es" | "en";
    date: string | null;
    note: WorkoutDayNote | null;
    onClose: () => void;
};

function formatDate(dateIso: string | null, lang: "es" | "en"): string {
    if (!dateIso) return "—";

    const date = new Date(`${dateIso}T00:00:00`);
    if (Number.isNaN(date.getTime())) return dateIso;

    return new Intl.DateTimeFormat(lang === "es" ? "es-MX" : "en-US", {
        dateStyle: "full",
    }).format(date);
}

export function DayNoteViewerDialog(props: Props) {
    const { open, lang, date, note, onClose } = props;
    const option = note ? getDayNoteTypeOption(note.type) : null;

    return (
        <Dialog
            open={open}
            onClose={onClose}
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
            <DialogTitle component="div" sx={{ p: 0, borderBottom: 1, borderColor: "divider" }}>
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: 2,
                        px: { xs: 2, md: 2.5 },
                        py: 1.5,
                    }}
                >
                    <Box sx={{ minWidth: 0 }}>
                        <Typography variant="h6" component="h2" sx={{ fontWeight: 850, overflowWrap: "anywhere" }}>
                            {option?.emoji} {note?.title ?? (lang === "es" ? "Nota" : "Note")}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                            {formatDate(date, lang)}
                        </Typography>
                    </Box>

                    <IconButton aria-label={lang === "es" ? "Cerrar" : "Close"} onClick={onClose}>
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent sx={{ p: { xs: 2, md: 2.5 } }}>
                {option ? (
                    <Chip
                        size="small"
                        label={`${option.emoji} ${option.label[lang]}`}
                        sx={{ mb: 2 }}
                    />
                ) : null}

                <Typography
                    variant="body1"
                    color={note?.description ? "text.primary" : "text.secondary"}
                    sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
                >
                    {note?.description ?? (lang === "es" ? "Sin descripción." : "No description.")}
                </Typography>
            </DialogContent>

            <DialogActions sx={{ px: { xs: 2, md: 2.5 }, py: 1.5 }}>
                <Button variant="contained" onClick={onClose}>
                    {lang === "es" ? "Cerrar" : "Close"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

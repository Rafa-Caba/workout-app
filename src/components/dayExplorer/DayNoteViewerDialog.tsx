// src/components/dayExplorer/DayNoteViewerDialog.tsx
// Modal for viewing, editing, and deleting a structured WorkoutDay note.

import * as React from "react";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineSharp";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";

import type { WorkoutDayNote } from "@/types/workoutDay.types";
import { getDayNoteTypeOption } from "@/utils/dayNotes";

type Props = {
    open: boolean;
    lang: "es" | "en";
    date: string | null;
    note: WorkoutDayNote | null;
    deleting: boolean;
    onClose: () => void;
    onEdit: () => void;
    onDelete: () => Promise<void>;
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
    const {
        open,
        lang,
        date,
        note,
        deleting,
        onClose,
        onEdit,
        onDelete,
    } = props;

    const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState<boolean>(false);
    const option = note ? getDayNoteTypeOption(note.type) : null;

    React.useEffect(() => {
        if (!open) setDeleteConfirmOpen(false);
    }, [open]);

    async function handleDelete(): Promise<void> {
        await onDelete();
        setDeleteConfirmOpen(false);
    }

    return (
        <>
            <Dialog
                open={open}
                onClose={deleting ? undefined : onClose}
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

                        <IconButton
                            aria-label={lang === "es" ? "Cerrar" : "Close"}
                            onClick={onClose}
                            disabled={deleting}
                        >
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>

                <DialogContent sx={{ p: { xs: 2, md: 2.5 } }}>
                    {option ? (
                        <Chip
                            size="small"
                            label={`${option.emoji} ${option.label[lang]}`}
                            sx={{ mt: 1, mb: 2 }}
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

                <DialogActions
                    sx={{
                        px: { xs: 2, md: 2.5 },
                        py: 1.5,
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 1,
                    }}
                >
                    <Button
                        variant="outlined"
                        startIcon={<EditOutlinedIcon />}
                        onClick={onEdit}
                        disabled={!note || deleting}
                    >
                        {lang === "es" ? "Editar" : "Edit"}
                    </Button>
                    <Button
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteOutlineIcon />}
                        onClick={() => setDeleteConfirmOpen(true)}
                        disabled={!note || deleting}
                    >
                        {lang === "es" ? "Eliminar" : "Delete"}
                    </Button>
                    <Box sx={{ flexGrow: 1 }} />
                    <Button variant="contained" onClick={onClose} disabled={deleting}>
                        {lang === "es" ? "Cerrar" : "Close"}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={deleteConfirmOpen}
                onClose={deleting ? undefined : () => setDeleteConfirmOpen(false)}
                fullWidth
                maxWidth="xs"
            >
                <DialogTitle>
                    {lang === "es" ? "Eliminar nota" : "Delete note"}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {lang === "es"
                            ? "Esta acción eliminará únicamente la nota seleccionada. Los datos de sueño y entrenamiento del día no se modificarán."
                            : "This action removes only the selected note. The day's sleep and training data will not be changed."}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button
                        variant="outlined"
                        onClick={() => setDeleteConfirmOpen(false)}
                        disabled={deleting}
                    >
                        {lang === "es" ? "Cancelar" : "Cancel"}
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={() => void handleDelete()}
                        disabled={deleting}
                    >
                        {deleting
                            ? lang === "es"
                                ? "Eliminando..."
                                : "Deleting..."
                            : lang === "es"
                              ? "Eliminar nota"
                              : "Delete note"}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

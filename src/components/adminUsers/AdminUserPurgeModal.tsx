// src/components/adminUsers/AdminUserPurgeModal.tsx
// MUI destructive confirmation dialog for permanently purging a user.

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import type { AdminUser } from "@/types/adminUser.types";
import { formatDeletedCount, type PurgeResult } from "./adminUsers.shared";

type Props = {
    lang: string;
    open: boolean;
    target: AdminUser | null;
    confirmText: string;
    purging: boolean;
    result: PurgeResult | null;
    onClose: () => void;
    onConfirmTextChange: (value: string) => void;
    onConfirm: () => void;
};

export function AdminUserPurgeModal({
    lang,
    open,
    target,
    confirmText,
    purging,
    result,
    onClose,
    onConfirmTextChange,
    onConfirm,
}: Props) {
    const requiredText = target?.email ?? "";
    const canConfirm = Boolean(target) && confirmText.trim() === requiredText && !purging;

    return (
        <Dialog
            open={open}
            onClose={purging ? undefined : onClose}
            fullWidth
            maxWidth="sm"
            slotProps={{ paper: { sx: { borderRadius: 3, overflow: "hidden" } } }}
        >
            <DialogTitle sx={{ fontWeight: 850, borderBottom: 1, borderColor: "divider" }}>
                {lang === "es" ? "Purgar usuario" : "Purge user"}
            </DialogTitle>
            <DialogContent sx={{ p: { xs: 1.5, md: 2.5 }, display: "grid", gap: 1.5 }}>
                {!target ? null : (
                    <>
                        <Alert severity="error">
                            {lang === "es"
                                ? "Esta acción elimina al usuario y datos asociados. No es un soft delete."
                                : "This deletes the user and associated data. This is not a soft delete."}
                        </Alert>

                        <Box>
                            <Typography variant="body2" sx={{ fontWeight: 800 }}>{target.name}</Typography>
                            <Typography variant="caption" color="text.secondary">{target.email}</Typography>
                        </Box>

                        <TextField
                            size="small"
                            label={lang === "es" ? "Escribe el email para confirmar" : "Type email to confirm"}
                            value={confirmText}
                            onChange={(event) => onConfirmTextChange(event.target.value)}
                            placeholder={requiredText}
                            disabled={purging || Boolean(result)}
                        />
                    </>
                )}

                {result ? (
                    <Box sx={{ display: "grid", gap: 1 }}>
                        <Alert severity="success">{result.message || (lang === "es" ? "Usuario purgado." : "User purged.")}</Alert>
                        {result.cleanup?.items?.length ? (
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Model</TableCell>
                                        <TableCell align="right">Deleted</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {result.cleanup.items.map((item) => (
                                        <TableRow key={item.model}>
                                            <TableCell>{item.model}</TableCell>
                                            <TableCell align="right">{formatDeletedCount(item.deletedCount)}</TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 850 }}>Total</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 850 }}>
                                            {formatDeletedCount(result.cleanup.totalDeleted)}
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        ) : null}
                    </Box>
                ) : null}
            </DialogContent>
            <DialogActions sx={{ px: { xs: 1.5, md: 2.5 }, py: 1.5, borderTop: 1, borderColor: "divider" }}>
                <Button variant="outlined" onClick={onClose} disabled={purging}>{lang === "es" ? "Cerrar" : "Close"}</Button>
                {!result ? (
                    <Button variant="contained" color="error" onClick={onConfirm} disabled={!canConfirm}>
                        {purging ? (lang === "es" ? "Purgando…" : "Purging…") : lang === "es" ? "Purgar" : "Purge"}
                    </Button>
                ) : null}
            </DialogActions>
        </Dialog>
    );
}

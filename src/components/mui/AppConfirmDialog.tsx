// src/components/mui/AppConfirmDialog.tsx
// Shared confirmation dialog for destructive and important user actions.

import type { ReactNode } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import type { SxProps, Theme } from "@mui/material/styles";

type AppConfirmTone = "primary" | "danger";

type AppConfirmDialogProps = {
    open: boolean;
    title: ReactNode;
    description?: ReactNode;
    confirmLabel: string;
    cancelLabel?: string;
    tone?: AppConfirmTone;
    loading?: boolean;
    onConfirm: () => void | Promise<void>;
    onCancel: () => void;
    contentSx?: SxProps<Theme>;
};

export function AppConfirmDialog({
    open,
    title,
    description,
    confirmLabel,
    cancelLabel = "Cancelar",
    tone = "primary",
    loading = false,
    onConfirm,
    onCancel,
    contentSx,
}: AppConfirmDialogProps) {
    const confirmColor = tone === "danger" ? "error" : "primary";

    return (
        <Dialog open={open} onClose={loading ? undefined : onCancel} fullWidth maxWidth="xs">
            <DialogTitle sx={{ fontWeight: 950 }}>{title}</DialogTitle>
            {description ? (
                <DialogContent sx={contentSx}>
                    <DialogContentText>{description}</DialogContentText>
                </DialogContent>
            ) : null}
            <DialogActions sx={{ px: 3, pb: 3, gap: 1, flexWrap: "wrap" }}>
                <Button variant="outlined" onClick={onCancel} disabled={loading}>
                    {cancelLabel}
                </Button>
                <Button variant="contained" color={confirmColor} onClick={onConfirm} disabled={loading}>
                    {loading ? "Procesando..." : confirmLabel}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export type { AppConfirmDialogProps, AppConfirmTone };

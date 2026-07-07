// src/components/cardio/CardioSessionModal.tsx
// MUI controlled dialog for the Cardio manual session form.

import type { ReactNode } from "react";
import CloseIcon from "@mui/icons-material/Close";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";

type Props = {
    open: boolean;
    title: string;
    onClose: () => void;
    children: ReactNode;
};

export function CardioSessionModal({ open, title, onClose, children }: Props) {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="lg"
            slotProps={{
                paper: {
                    sx: {
                        borderRadius: 2,
                        overflow: "hidden",
                    },
                },
            }}
        >
            <DialogTitle
                component="div"
                sx={{
                    p: 0,
                    borderBottom: 1,
                    borderColor: "divider",
                }}
            >
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 2,
                        px: { xs: 1.5, md: 2.5 },
                        py: { xs: 1.25, md: 1.5 },
                    }}
                >
                    <Typography variant="h6" component="h2" sx={{ fontWeight: 850 }}>
                        {title}
                    </Typography>

                    <IconButton aria-label="Cerrar" onClick={onClose}>
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent
                sx={{
                    p: { xs: 1.5, md: 2.5 },
                    overflowY: "auto",
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                    "&::-webkit-scrollbar": {
                        display: "none",
                    },
                }}
            >
                {children}
            </DialogContent>
        </Dialog>
    );
}

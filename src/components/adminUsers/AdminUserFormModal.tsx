// src/components/adminUsers/AdminUserFormModal.tsx
// MUI controlled dialog for creating and editing admin users.

import type { ReactNode } from "react";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { AppFormGrid } from "@/components/mui";
import type { AdminUser } from "@/types/adminUser.types";
import type { CoachMode, UserFormValues } from "./adminUsers.shared";

type Props = {
    lang: string;
    open: boolean;
    saving: boolean;
    isEditing: boolean;
    form: UserFormValues;
    trainers: AdminUser[];
    trainersLoading: boolean;
    trainersError: string | null;
    submitError: string | null;
    onClose: () => void;
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
    onChange: (next: UserFormValues) => void;
};

function FieldHint({ children }: { children: ReactNode }) {
    return <Typography variant="caption" color="text.secondary">{children}</Typography>;
}

export function AdminUserFormModal({
    lang,
    open,
    saving,
    isEditing,
    form,
    trainers,
    trainersLoading,
    trainersError,
    submitError,
    onClose,
    onSubmit,
    onChange,
}: Props) {
    const title = isEditing ? (lang === "es" ? "Editar usuario" : "Edit user") : lang === "es" ? "Nuevo usuario" : "New user";

    function setCoachMode(next: CoachMode) {
        if (next === "TRAINEE") {
            onChange({ ...form, coachMode: next });
            return;
        }
        onChange({ ...form, coachMode: next, assignedTrainer: null });
    }

    return (
        <Dialog
            open={open}
            onClose={saving ? undefined : onClose}
            fullWidth
            maxWidth="md"
            slotProps={{ paper: { sx: { borderRadius: 3, overflow: "hidden" } } }}
        >
            <Box component="form" onSubmit={onSubmit}>
                <DialogTitle sx={{ borderBottom: 1, borderColor: "divider", fontWeight: 850 }}>{title}</DialogTitle>
                <DialogContent sx={{ p: { xs: 1.5, md: 2.5 }, display: "grid", gap: 1.5 }}>
                    <Typography variant="body2" color="text.secondary">
                        {lang === "es" ? "Crea o edita un usuario desde este modal." : "Create or edit a user from this modal."}
                    </Typography>

                    {submitError ? <Alert severity="warning">{submitError}</Alert> : null}

                    <AppFormGrid columns={{ xs: 1, md: 2 }} gap={1.5}>
                        <TextField size="small" label="Nombre" value={form.name} onChange={(event) => onChange({ ...form, name: event.target.value })} required />
                        <TextField size="small" label="Email" type="email" value={form.email} onChange={(event) => onChange({ ...form, email: event.target.value })} required />
                        <Box>
                            <TextField
                                fullWidth
                                size="small"
                                label={isEditing ? (lang === "es" ? "Nueva contraseña" : "New password") : lang === "es" ? "Contraseña" : "Password"}
                                type="password"
                                value={form.password}
                                onChange={(event) => onChange({ ...form, password: event.target.value })}
                                required={!isEditing}
                            />
                            <FieldHint>
                                {isEditing
                                    ? lang === "es"
                                        ? "Déjalo vacío para conservar la contraseña actual."
                                        : "Leave empty to keep current password."
                                    : lang === "es"
                                        ? "Se usará para el primer inicio de sesión."
                                        : "Used for the first login."}
                            </FieldHint>
                        </Box>
                        <TextField select size="small" label="Rol" value={form.role} onChange={(event) => onChange({ ...form, role: event.target.value === "admin" ? "admin" : "user" })}>
                            <MenuItem value="user">user</MenuItem>
                            <MenuItem value="admin">admin</MenuItem>
                        </TextField>
                        <TextField select size="small" label="Sexo" value={form.sex} onChange={(event) => {
                            const value = event.target.value;
                            onChange({ ...form, sex: value === "male" || value === "female" || value === "other" ? value : "" });
                        }}>
                            <MenuItem value="">{lang === "es" ? "Sin especificar" : "Unspecified"}</MenuItem>
                            <MenuItem value="male">{lang === "es" ? "Hombre" : "Male"}</MenuItem>
                            <MenuItem value="female">{lang === "es" ? "Mujer" : "Female"}</MenuItem>
                            <MenuItem value="other">{lang === "es" ? "Otro" : "Other"}</MenuItem>
                        </TextField>
                        <TextField select size="small" label={lang === "es" ? "Estado" : "Status"} value={form.isActive ? "1" : "0"} onChange={(event) => onChange({ ...form, isActive: event.target.value === "1" })}>
                            <MenuItem value="1">{lang === "es" ? "Activo" : "Active"}</MenuItem>
                            <MenuItem value="0">{lang === "es" ? "Inactivo" : "Inactive"}</MenuItem>
                        </TextField>
                    </AppFormGrid>

                    <Box sx={{ p: 1.25, border: 1, borderColor: "divider", borderRadius: 2, display: "grid", gap: 1.25 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 850 }}>{lang === "es" ? "Coaching" : "Coaching"}</Typography>
                        <AppFormGrid columns={{ xs: 1, md: 2 }} gap={1.5}>
                            <TextField select size="small" label="Coach mode" value={form.coachMode} onChange={(event) => setCoachMode(event.target.value as CoachMode)}>
                                <MenuItem value="NONE">None</MenuItem>
                                <MenuItem value="TRAINER">Trainer</MenuItem>
                                <MenuItem value="TRAINEE">Trainee</MenuItem>
                            </TextField>

                            <TextField
                                select
                                size="small"
                                label={lang === "es" ? "Trainer asignado" : "Assigned trainer"}
                                value={form.assignedTrainer ?? ""}
                                onChange={(event) => onChange({ ...form, assignedTrainer: event.target.value || null })}
                                disabled={form.coachMode !== "TRAINEE" || trainersLoading}
                            >
                                <MenuItem value="">{trainersLoading ? (lang === "es" ? "Cargando…" : "Loading…") : "—"}</MenuItem>
                                {trainers.map((trainer) => (
                                    <MenuItem key={trainer.id} value={trainer.id}>{trainer.name} · {trainer.email}</MenuItem>
                                ))}
                            </TextField>
                        </AppFormGrid>
                        {trainersError ? <Alert severity="error">{trainersError}</Alert> : null}
                    </Box>

                    <FormControlLabel
                        control={<Checkbox checked={form.isActive} onChange={(event) => onChange({ ...form, isActive: event.target.checked })} />}
                        label={lang === "es" ? "Usuario activo" : "Active user"}
                    />
                </DialogContent>
                <DialogActions sx={{ px: { xs: 1.5, md: 2.5 }, py: 1.5, borderTop: 1, borderColor: "divider" }}>
                    <Button variant="outlined" onClick={onClose} disabled={saving}>{lang === "es" ? "Cancelar" : "Cancel"}</Button>
                    <Button type="submit" variant="contained" disabled={saving || Boolean(submitError)}>
                        {saving ? (lang === "es" ? "Guardando…" : "Saving…") : lang === "es" ? "Guardar" : "Save"}
                    </Button>
                </DialogActions>
            </Box>
        </Dialog>
    );
}

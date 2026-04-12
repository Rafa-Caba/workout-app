// src/components/adminUsers/AdminUserFormModal.tsx
import React from "react";

import { Button } from "@/components/ui/button";
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
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    onChange: (next: UserFormValues) => void;
};

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
    if (!open) return null;

    const title =
        isEditing
            ? lang === "es"
                ? "Editar usuario"
                : "Edit user"
            : lang === "es"
                ? "Nuevo usuario"
                : "New user";

    function setCoachMode(next: CoachMode) {
        if (next === "TRAINEE") {
            onChange({ ...form, coachMode: next });
            return;
        }

        onChange({
            ...form,
            coachMode: next,
            assignedTrainer: null,
        });
    }

    function setAssignedTrainer(nextId: string) {
        onChange({
            ...form,
            assignedTrainer: nextId ? nextId : null,
        });
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
            <div className="w-full max-w-3xl rounded-xl border bg-background shadow-xl">
                <div className="border-b p-4 sm:p-6">
                    <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                            <h3 className="text-base font-semibold">{title}</h3>
                            <p className="text-xs text-muted-foreground">
                                {lang === "es"
                                    ? "Crea o edita un usuario desde este modal."
                                    : "Create or edit a user from this modal."}
                            </p>
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            className="h-8 px-3"
                            onClick={onClose}
                            disabled={saving}
                        >
                            {lang === "es" ? "Cerrar" : "Close"}
                        </Button>
                    </div>
                </div>

                <div className="max-h-[85vh] overflow-y-auto p-4 sm:p-6">
                    <form onSubmit={onSubmit} className="space-y-4">
                        <div className="grid gap-3 md:grid-cols-2">
                            <div className="space-y-1">
                                <label className="text-xs font-medium">Nombre</label>
                                <input
                                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                    value={form.name}
                                    onChange={(e) => onChange({ ...form, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-medium">Email</label>
                                <input
                                    type="email"
                                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                    value={form.email}
                                    onChange={(e) => onChange({ ...form, email: e.target.value })}
                                    required
                                />
                            </div>

                            {!isEditing ? (
                                <div className="space-y-1">
                                    <label className="text-xs font-medium">
                                        {lang === "es" ? "Contraseña" : "Password"}
                                    </label>
                                    <input
                                        type="password"
                                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                        value={form.password}
                                        onChange={(e) => onChange({ ...form, password: e.target.value })}
                                        required
                                    />
                                    <p className="text-[11px] text-muted-foreground">
                                        {lang === "es"
                                            ? "Se usará para el primer inicio de sesión."
                                            : "Used for the first login."}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    <label className="text-xs font-medium">
                                        {lang === "es" ? "Nueva contraseña (opcional)" : "New password (optional)"}
                                    </label>
                                    <input
                                        type="password"
                                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                        value={form.password}
                                        onChange={(e) => onChange({ ...form, password: e.target.value })}
                                    />
                                    <p className="text-[11px] text-muted-foreground">
                                        {lang === "es"
                                            ? "Déjalo vacío para conservar la contraseña actual."
                                            : "Leave empty to keep current password."}
                                    </p>
                                </div>
                            )}

                            <div className="space-y-1">
                                <label className="text-xs font-medium">Rol</label>
                                <select
                                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                    value={form.role}
                                    onChange={(e) =>
                                        onChange({
                                            ...form,
                                            role: e.target.value === "admin" ? "admin" : "user",
                                        })
                                    }
                                >
                                    <option value="user">user</option>
                                    <option value="admin">admin</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-medium">Sexo</label>
                                <select
                                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                    value={form.sex}
                                    onChange={(e) =>
                                        onChange({
                                            ...form,
                                            sex:
                                                e.target.value === "male" ||
                                                    e.target.value === "female" ||
                                                    e.target.value === "other"
                                                    ? e.target.value
                                                    : "",
                                        })
                                    }
                                >
                                    <option value="">{lang === "es" ? "Sin especificar" : "Unspecified"}</option>
                                    <option value="male">{lang === "es" ? "Hombre" : "Male"}</option>
                                    <option value="female">{lang === "es" ? "Mujer" : "Female"}</option>
                                    <option value="other">{lang === "es" ? "Otro" : "Other"}</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-medium">{lang === "es" ? "Estado" : "Status"}</label>
                                <select
                                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                    value={form.isActive ? "1" : "0"}
                                    onChange={(e) =>
                                        onChange({
                                            ...form,
                                            isActive: e.target.value === "1",
                                        })
                                    }
                                >
                                    <option value="1">{lang === "es" ? "Activo" : "Active"}</option>
                                    <option value="0">{lang === "es" ? "Inactivo" : "Inactive"}</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-medium">{lang === "es" ? "Coaching" : "Coaching"}</label>
                                <select
                                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                    value={form.coachMode}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        const nextCoachMode: CoachMode =
                                            value === "TRAINER" || value === "TRAINEE" ? value : "NONE";
                                        setCoachMode(nextCoachMode);
                                    }}
                                >
                                    <option value="NONE">{lang === "es" ? "Ninguno" : "None"}</option>
                                    <option value="TRAINER">{lang === "es" ? "Trainer" : "Trainer"}</option>
                                    <option value="TRAINEE">{lang === "es" ? "Trainee" : "Trainee"}</option>
                                </select>
                                <p className="text-[11px] text-muted-foreground">
                                    {lang === "es"
                                        ? "Regla: si es Trainee, requiere trainer asignado."
                                        : "Rule: if Trainee, requires an assigned trainer."}
                                </p>
                            </div>

                            {form.coachMode === "TRAINEE" ? (
                                <div className="space-y-1">
                                    <label className="text-xs font-medium">
                                        {lang === "es" ? "Trainer asignado" : "Assigned trainer"}
                                    </label>

                                    <select
                                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                        value={form.assignedTrainer ?? ""}
                                        onChange={(e) => setAssignedTrainer(e.target.value)}
                                        disabled={trainersLoading}
                                    >
                                        <option value="">
                                            {trainersLoading
                                                ? lang === "es"
                                                    ? "Cargando trainers..."
                                                    : "Loading trainers..."
                                                : lang === "es"
                                                    ? "Selecciona un trainer..."
                                                    : "Select a trainer..."}
                                        </option>

                                        {trainers.map((trainer) => (
                                            <option key={trainer.id} value={trainer.id}>
                                                {trainer.name} — {trainer.email}
                                            </option>
                                        ))}
                                    </select>

                                    {trainersError ? (
                                        <div className="text-[11px] text-red-500">{trainersError}</div>
                                    ) : null}

                                    <p className="text-[11px] text-muted-foreground">
                                        {lang === "es"
                                            ? "Esto define quién puede ver/planear rutinas para este usuario."
                                            : "This defines who can view/plan routines for this user."}
                                    </p>
                                </div>
                            ) : null}
                        </div>

                        {submitError ? (
                            <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400">
                                {submitError}
                            </div>
                        ) : null}

                        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                disabled={saving}
                                className="w-full sm:w-auto"
                            >
                                {lang === "es" ? "Cancelar" : "Cancel"}
                            </Button>
                            <Button
                                type="submit"
                                disabled={saving}
                                className="w-full sm:w-auto"
                            >
                                {saving
                                    ? lang === "es"
                                        ? "Guardando..."
                                        : "Saving..."
                                    : lang === "es"
                                        ? "Guardar"
                                        : "Save"}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
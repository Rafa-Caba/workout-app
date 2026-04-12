// src/components/adminUsers/AdminUsersListCard.tsx
import React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { AdminUser } from "@/types/adminUser.types";

import {
    coachModeLabel,
    formatLastLogin,
    getInitials,
    readAssignedTrainer,
    readCoachMode,
    shortId,
} from "./adminUsers.shared";

type RoleFilter = "all" | "admin" | "user";
type ActiveFilter = "all" | "active" | "inactive";

type Props = {
    lang: string;
    items: AdminUser[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;

    search: string;
    roleFilter: RoleFilter;
    activeFilter: ActiveFilter;

    loading: boolean;
    error: string | null;

    trainersById: Map<string, AdminUser>;

    onSearchChange: (value: string) => void;
    onRoleFilterChange: (value: RoleFilter) => void;
    onActiveFilterChange: (value: ActiveFilter) => void;
    onPrevPage: () => void;
    onNextPage: () => void;

    onCreate: () => void;
    onEdit: (user: AdminUser) => void;
    onDelete: (user: AdminUser) => void;
    onPurge: (user: AdminUser) => void;
    onOpenProfileImage: (user: AdminUser) => void;
};

export function AdminUsersListCard({
    lang,
    items,
    total,
    page,
    pageSize,
    totalPages,
    search,
    roleFilter,
    activeFilter,
    loading,
    error,
    trainersById,
    onSearchChange,
    onRoleFilterChange,
    onActiveFilterChange,
    onPrevPage,
    onNextPage,
    onCreate,
    onEdit,
    onDelete,
    onPurge,
    onOpenProfileImage,
}: Props) {
    return (
        <Card className="w-full">
            <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base">
                    {lang === "es" ? "Usuarios (Admin)" : "Users (Admin)"}
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div className="grid gap-2 md:w-2/3 md:grid-cols-3">
                        <div className="space-y-1">
                            <label className="text-xs font-medium">{lang === "es" ? "Buscar" : "Search"}</label>
                            <input
                                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                                value={search}
                                onChange={(e) => onSearchChange(e.target.value)}
                                placeholder={lang === "es" ? "Nombre o email..." : "Name or email..."}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-medium">{lang === "es" ? "Rol" : "Role"}</label>
                            <select
                                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                                value={roleFilter}
                                onChange={(e) =>
                                    onRoleFilterChange(
                                        e.target.value === "admin" || e.target.value === "user" ? e.target.value : "all"
                                    )
                                }
                            >
                                <option value="all">{lang === "es" ? "Todos" : "All"}</option>
                                <option value="admin">{lang === "es" ? "Admins" : "Admins"}</option>
                                <option value="user">{lang === "es" ? "Usuarios" : "Users"}</option>
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-medium">{lang === "es" ? "Estado" : "Status"}</label>
                            <select
                                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                                value={activeFilter}
                                onChange={(e) =>
                                    onActiveFilterChange(
                                        e.target.value === "active" || e.target.value === "inactive" ? e.target.value : "all"
                                    )
                                }
                            >
                                <option value="all">{lang === "es" ? "Todos" : "All"}</option>
                                <option value="active">{lang === "es" ? "Activos" : "Active"}</option>
                                <option value="inactive">{lang === "es" ? "Inactivos" : "Inactive"}</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center justify-end">
                        <Button type="button" onClick={onCreate} disabled={loading} className="w-full md:w-auto">
                            {lang === "es" ? "Nuevo usuario" : "New user"}
                        </Button>
                    </div>
                </div>

                {loading ? (
                    <div className="text-xs text-muted-foreground">
                        {lang === "es" ? "Cargando usuarios..." : "Loading users..."}
                    </div>
                ) : null}

                {error ? <div className="text-xs text-red-500 wrap-break-words">{error}</div> : null}

                <div className="overflow-x-auto rounded-lg border border-primary/40">
                    <table className="min-w-[281.25] w-full text-sm">
                        <thead className="bg-primary/20">
                            <tr className="text-left">
                                <th className="px-3 py-2 font-medium whitespace-nowrap">
                                    {lang === "es" ? "Foto perfil" : "Profile"}
                                </th>
                                <th className="px-3 py-2 font-medium whitespace-nowrap">Nombre</th>
                                <th className="px-3 py-2 font-medium whitespace-nowrap">Email</th>
                                <th className="px-3 py-2 font-medium whitespace-nowrap">
                                    {lang === "es" ? "Rol" : "Role"}
                                </th>
                                <th className="px-3 py-2 font-medium whitespace-nowrap">
                                    {lang === "es" ? "Coaching" : "Coaching"}
                                </th>
                                <th className="px-3 py-2 font-medium whitespace-nowrap">
                                    {lang === "es" ? "Trainer" : "Trainer"}
                                </th>
                                <th className="px-3 py-2 font-medium whitespace-nowrap">
                                    {lang === "es" ? "Estado" : "Status"}
                                </th>
                                <th className="px-3 py-2 font-medium whitespace-nowrap">
                                    {lang === "es" ? "Último acceso" : "Last login"}
                                </th>
                                <th className="px-3 py-2 font-medium whitespace-nowrap">
                                    {lang === "es" ? "Acciones" : "Actions"}
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {items.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-3 py-4 text-center text-xs text-muted-foreground">
                                        {lang === "es"
                                            ? "No hay usuarios que coincidan con los filtros."
                                            : "No users match the current filters."}
                                    </td>
                                </tr>
                            ) : (
                                items.map((user) => {
                                    const coachMode = readCoachMode(user);
                                    const assignedTrainerId = readAssignedTrainer(user);
                                    const assignedTrainerUser = assignedTrainerId ? trainersById.get(assignedTrainerId) : undefined;
                                    const hasProfilePic = typeof user.profilePicUrl === "string" && user.profilePicUrl.trim().length > 0;

                                    return (
                                        <tr key={user.id} className="border-t border-border/60">
                                            <td className="px-3 py-2">
                                                {hasProfilePic ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => onOpenProfileImage(user)}
                                                        className="mx-auto flex h-15 w-15 items-center justify-center overflow-hidden rounded-full border bg-background"
                                                        title={lang === "es" ? "Ver foto de perfil" : "View profile picture"}
                                                    >
                                                        <img
                                                            src={user.profilePicUrl ?? undefined}
                                                            alt={user.name}
                                                            className="h-full w-full object-cover"
                                                            loading="lazy"
                                                        />
                                                    </button>
                                                ) : (
                                                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border bg-background text-[11px] font-semibold text-muted-foreground">
                                                        {getInitials(user.name)}
                                                    </div>
                                                )}
                                            </td>

                                            <td className="px-3 py-2">
                                                <div className="flex min-w-0 flex-col">
                                                    <span className="truncate font-medium">{user.name}</span>
                                                    <span className="truncate text-[11px] text-muted-foreground">
                                                        id: {user.id}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="px-3 py-2">
                                                <span className="font-mono text-xs">{user.email}</span>
                                            </td>

                                            <td className="px-3 py-2">
                                                <span className="whitespace-nowrap rounded-full bg-muted px-2 py-1 text-xs">
                                                    {user.role === "admin" ? "admin" : "user"}
                                                </span>
                                            </td>

                                            <td className="px-3 py-2">
                                                <span className="whitespace-nowrap rounded-full bg-muted px-2 py-1 text-xs">
                                                    {coachModeLabel(coachMode, lang)}
                                                </span>
                                            </td>

                                            <td className="px-3 py-2">
                                                {coachMode === "TRAINEE" ? (
                                                    <div className="flex min-w-0 flex-col">
                                                        <span className="truncate text-xs font-medium">
                                                            {assignedTrainerUser?.name ?? (assignedTrainerId ? shortId(assignedTrainerId) : "—")}
                                                        </span>
                                                        <span className="truncate font-mono text-[11px] text-muted-foreground">
                                                            {assignedTrainerId ? `id: ${assignedTrainerId}` : "—"}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">—</span>
                                                )}
                                            </td>

                                            <td className="px-3 py-2">
                                                <span
                                                    className={
                                                        "text-xs font-medium " +
                                                        (user.isActive
                                                            ? "text-emerald-600 dark:text-emerald-400"
                                                            : "text-muted-foreground")
                                                    }
                                                >
                                                    {user.isActive
                                                        ? lang === "es"
                                                            ? "Activo"
                                                            : "Active"
                                                        : lang === "es"
                                                            ? "Inactivo"
                                                            : "Inactive"}
                                                </span>
                                            </td>

                                            <td className="px-3 py-2">
                                                <span className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                                                    {formatLastLogin(user.lastLoginAt, lang)}
                                                </span>
                                            </td>

                                            <td className="px-3 py-2">
                                                <div className="flex gap-2">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-7 px-2 text-xs"
                                                        onClick={() => onEdit(user)}
                                                    >
                                                        {lang === "es" ? "Editar" : "Edit"}
                                                    </Button>

                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-7 px-2 text-xs"
                                                        onClick={() => onDelete(user)}
                                                    >
                                                        {lang === "es" ? "Eliminar" : "Delete"}
                                                    </Button>

                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        size="sm"
                                                        className="h-7 px-2 text-xs text-white"
                                                        onClick={() => onPurge(user)}
                                                        disabled={loading}
                                                    >
                                                        {lang === "es" ? "Purgar" : "Purge"}
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {total > pageSize ? (
                    <div className="flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            {lang === "es"
                                ? `Mostrando página ${page} de ${totalPages}, total ${total} usuario(s).`
                                : `Showing page ${page} of ${totalPages}, total ${total} user(s).`}
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-7 px-2"
                                disabled={page <= 1 || loading}
                                onClick={onPrevPage}
                            >
                                {lang === "es" ? "Anterior" : "Prev"}
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-7 px-2"
                                disabled={page >= totalPages || loading}
                                onClick={onNextPage}
                            >
                                {lang === "es" ? "Siguiente" : "Next"}
                            </Button>
                        </div>
                    </div>
                ) : null}
            </CardContent>
        </Card>
    );
}
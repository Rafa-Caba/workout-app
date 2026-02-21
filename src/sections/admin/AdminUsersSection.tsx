import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAdminUsersStore } from "@/state/adminUsers.store";
import type { AdminUser, AdminUserRole } from "@/types/adminUser.types";
import { useI18n } from "@/i18n/I18nProvider";
import { MediaViewerModal } from "@/components/media/MediaViewerModal";
import type { MediaFeedItem } from "@/types/media.types";
import { fetchAdminTrainers } from "@/services/admin/adminUsers.service";

type CoachMode = "NONE" | "TRAINER" | "TRAINEE";

type UserFormValues = {
    id?: string;
    name: string;
    email: string;
    password: string; // only used on create or when resetting
    role: AdminUserRole;
    sex: "male" | "female" | "other" | "";
    isActive: boolean;

    // Coaching (NEW)
    coachMode: CoachMode;
    assignedTrainer: string | null; // User id
};

const emptyForm: UserFormValues = {
    name: "",
    email: "",
    password: "",
    role: "user",
    sex: "",
    isActive: true,

    coachMode: "NONE",
    assignedTrainer: null,
};

function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "U";
    const first = parts[0]?.[0] ?? "U";
    const second = parts.length > 1 ? parts[1]?.[0] : parts[0]?.[1];
    return (first + (second ?? "")).toUpperCase();
}

type PurgeCleanupItem = { model: string; deletedCount: number };
type PurgeResult = {
    id: string;
    message: string;
    cleanup?: {
        items: PurgeCleanupItem[];
        totalDeleted: number;
    };
};

function formatDeletedCount(n: number): string {
    try {
        return new Intl.NumberFormat("es-MX").format(n);
    } catch {
        return String(n);
    }
}

function shortId(id: string | null | undefined): string {
    if (!id) return "—";
    if (id.length <= 10) return id;
    return `${id.slice(0, 6)}…${id.slice(-4)}`;
}

function coachModeLabel(mode: CoachMode, lang: string): string {
    if (lang === "es") {
        if (mode === "TRAINER") return "Trainer";
        if (mode === "TRAINEE") return "Trainee";
        return "None";
    }
    if (mode === "TRAINER") return "Trainer";
    if (mode === "TRAINEE") return "Trainee";
    return "None";
}

export function AdminUsersSection() {
    const { lang } = useI18n();

    const {
        items,
        total,
        page,
        pageSize,
        search,
        roleFilter,
        activeFilter,
        loading,
        error,
        setSearch,
        setRoleFilter,
        setActiveFilter,
        setPage,
        loadUsers,
        createUser,
        updateUser,
        removeUser,
        purgeUser,
    } = useAdminUsersStore();

    const [formOpen, setFormOpen] = React.useState(false);
    const [form, setForm] = React.useState<UserFormValues>(emptyForm);
    const [saving, setSaving] = React.useState(false);
    const [selectedMedia, setSelectedMedia] = React.useState<MediaFeedItem | null>(null);

    // Trainers list (for assignedTrainer select)
    const [trainersLoading, setTrainersLoading] = React.useState(false);
    const [trainersError, setTrainersError] = React.useState<string | null>(null);
    const [trainers, setTrainers] = React.useState<AdminUser[]>([]);

    // Purge modal state
    const [purgeOpen, setPurgeOpen] = React.useState(false);
    const [purgeTarget, setPurgeTarget] = React.useState<AdminUser | null>(null);
    const [purgeConfirmText, setPurgeConfirmText] = React.useState("");
    const [purging, setPurging] = React.useState(false);
    const [purgeResult, setPurgeResult] = React.useState<PurgeResult | null>(null);

    const isEditing = !!form.id;

    React.useEffect(() => {
        void loadUsers();
    }, [page, search, roleFilter, activeFilter, loadUsers]);

    React.useEffect(() => {
        // Load trainers for the "assignedTrainer" dropdown.
        // Keep this separate from store so it doesn't affect list paging filters.
        let alive = true;

        async function loadTrainers() {
            setTrainersLoading(true);
            setTrainersError(null);

            try {
                const res = await fetchAdminTrainers({ page: 1, limit: 200 });
                if (!alive) return;
                setTrainers(Array.isArray(res.items) ? res.items : []);
            } catch (e: any) {
                if (!alive) return;
                const msg =
                    e?.response?.data?.error?.message ??
                    e?.response?.data?.message ??
                    e?.message ??
                    (lang === "es" ? "No se pudieron cargar trainers." : "Could not load trainers.");
                setTrainersError(msg);
            } finally {
                if (!alive) return;
                setTrainersLoading(false);
            }
        }

        void loadTrainers();

        return () => {
            alive = false;
        };
    }, [lang]);

    const trainersById = React.useMemo(() => {
        const map = new Map<string, AdminUser>();
        for (const t of trainers) map.set(t.id, t);
        return map;
    }, [trainers]);

    function openCreateForm() {
        setForm(emptyForm);
        setFormOpen(true);
    }

    function openEditForm(user: AdminUser) {
        setForm({
            id: user.id,
            name: user.name,
            email: user.email,
            password: "",
            role: user.role,
            sex: user.sex ?? "",
            isActive: user.isActive,

            coachMode: ((user as any).coachMode ?? "NONE") as CoachMode,
            assignedTrainer: ((user as any).assignedTrainer ?? null) as string | null,
        });
        setFormOpen(true);
    }

    function closeForm() {
        setFormOpen(false);
        setForm(emptyForm);
    }

    function setCoachMode(next: CoachMode) {
        setForm((f) => {
            // Cross-field consistency on the client:
            // - TRAINEE requires assignedTrainer (we don't auto-pick to avoid wrong assignments)
            // - otherwise assignedTrainer must be null
            if (next === "TRAINEE") return { ...f, coachMode: next };
            return { ...f, coachMode: next, assignedTrainer: null };
        });
    }

    function setAssignedTrainer(nextId: string) {
        setForm((f) => ({
            ...f,
            assignedTrainer: nextId ? nextId : null,
        }));
    }

    function canSubmitForm(): { ok: boolean; reason?: string } {
        const nameOk = form.name.trim().length > 0;
        const emailOk = form.email.trim().length > 0;

        if (!nameOk) return { ok: false, reason: lang === "es" ? "Nombre requerido." : "Name is required." };
        if (!emailOk) return { ok: false, reason: lang === "es" ? "Email requerido." : "Email is required." };

        // On create, password is required
        if (!isEditing && !form.password.trim()) {
            return { ok: false, reason: lang === "es" ? "Contraseña requerida." : "Password is required." };
        }

        // Coaching rules
        if (form.coachMode === "TRAINEE" && !form.assignedTrainer) {
            return {
                ok: false,
                reason:
                    lang === "es"
                        ? "Si el usuario es TRAINEE, debes asignar un trainer."
                        : "If user is TRAINEE, you must assign a trainer.",
            };
        }

        return { ok: true };
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        const gate = canSubmitForm();
        if (!gate.ok) return;

        setSaving(true);

        // Prepare consistent coaching payload for BE validators:
        // - TRAINEE -> assignedTrainer required
        // - otherwise -> assignedTrainer must be null
        const coachMode: CoachMode = form.coachMode ?? "NONE";
        const assignedTrainer = coachMode === "TRAINEE" ? form.assignedTrainer : null;

        try {
            if (isEditing && form.id) {
                await updateUser(form.id, {
                    name: form.name,
                    email: form.email,
                    role: form.role,
                    sex: form.sex || null,
                    isActive: form.isActive,
                    ...(form.password.trim() ? { password: form.password.trim() } : {}),

                    // Coaching (NEW)
                    coachMode,
                    assignedTrainer,
                } as any);
            } else {
                await createUser({
                    name: form.name,
                    email: form.email,
                    password: form.password.trim(),
                    role: form.role,
                    sex: form.sex || null,
                    isActive: form.isActive,

                    // Coaching (NEW)
                    coachMode,
                    assignedTrainer,
                } as any);
            }

            setSaving(false);
            closeForm();
        } catch {
            setSaving(false);
        }
    }

    async function handleDelete(user: AdminUser) {
        if (
            !window.confirm(
                lang === "es" ? `¿Desactivar usuario "${user.name}"?` : `Deactivate user "${user.name}"?`
            )
        ) {
            return;
        }
        await removeUser(user.id);
    }

    function openPurgeModal(user: AdminUser) {
        setPurgeTarget(user);
        setPurgeConfirmText("");
        setPurgeResult(null);
        setPurgeOpen(true);
    }

    function closePurgeModal() {
        setPurgeOpen(false);
        setPurgeTarget(null);
        setPurgeConfirmText("");
        setPurging(false);
        setPurgeResult(null);
    }

    async function handleConfirmPurge() {
        if (!purgeTarget) return;

        setPurging(true);
        try {
            const result: PurgeResult = await purgeUser(purgeTarget.id);
            setPurgeResult(result);

            // refresh list
            await loadUsers();
        } catch {
            // store already handles global errors/toasts
        } finally {
            setPurging(false);
        }
    }

    /**
 * Formats an ISO datetime like "2026-02-20T17:22:23.257Z"
 * into: "Feb 20, 2026 - 17:22" (or localized for es).
 */
    function formatLastLogin(iso: string | null | undefined, lang: string): string {
        if (!iso) return "—";

        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return "—";

        const locale = lang === "es" ? "es-MX" : "en-US";

        try {
            // "Feb 20, 2026"
            const datePart = new Intl.DateTimeFormat(locale, {
                year: "numeric",
                month: "short",
                day: "2-digit",
            }).format(d);

            // "17:22" (24h for both; adjust if you want 12h for en)
            const timePart = new Intl.DateTimeFormat(locale, {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
            }).format(d);

            return `${datePart} - ${timePart}`;
        } catch {
            // Fallback (still human-ish)
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, "0");
            const day = String(d.getDate()).padStart(2, "0");
            const hh = String(d.getHours()).padStart(2, "0");
            const mm = String(d.getMinutes()).padStart(2, "0");
            return `${y}-${m}-${day} - ${hh}:${mm}`;
        }
    }

    const totalPages = total > 0 ? Math.max(1, Math.ceil(total / pageSize)) : 1;
    const purgeIsUnlocked = purgeConfirmText.trim().toUpperCase() === "PURGE";

    const submitGate = canSubmitForm();

    return (
        <div className="space-y-4">
            <Card className="w-full">
                <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-base">
                        {lang === "es" ? "Usuarios (Admin)" : "Users (Admin)"}
                    </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
                    {/* Filtros */}
                    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                        <div className="grid gap-2 md:grid-cols-3 md:w-2/3">
                            <div className="space-y-1">
                                <label className="text-xs font-medium">{lang === "es" ? "Buscar" : "Search"}</label>
                                <input
                                    className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder={lang === "es" ? "Nombre o email..." : "Name or email..."}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-medium">{lang === "es" ? "Rol" : "Role"}</label>
                                <select
                                    className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                                    value={roleFilter}
                                    onChange={(e) => setRoleFilter(e.target.value as any)}
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
                                    onChange={(e) => setActiveFilter(e.target.value as any)}
                                >
                                    <option value="all">{lang === "es" ? "Todos" : "All"}</option>
                                    <option value="active">{lang === "es" ? "Activos" : "Active"}</option>
                                    <option value="inactive">{lang === "es" ? "Inactivos" : "Inactive"}</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center justify-end">
                            <Button
                                type="button"
                                onClick={openCreateForm}
                                disabled={loading}
                                className="w-full md:w-auto"
                            >
                                {lang === "es" ? "Nuevo usuario" : "New user"}
                            </Button>
                        </div>
                    </div>

                    {/* Estado de carga / error */}
                    {loading ? (
                        <div className="text-xs text-muted-foreground">
                            {lang === "es" ? "Cargando usuarios..." : "Loading users..."}
                        </div>
                    ) : null}

                    {error ? <div className="text-xs text-red-500 wrap-break-words">{error}</div> : null}

                    {/* Tabla */}
                    <div className="overflow-x-auto rounded-lg border border-primary/40">
                        <table className="min-w-[225] w-full text-sm">
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

                                    {/* NEW columns */}
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
                                    items.map((u) => {
                                        const hasProfilePic = !!u.profilePicUrl;

                                        const coachMode = ((u as any).coachMode ?? "NONE") as CoachMode;
                                        const assignedTrainerId = ((u as any).assignedTrainer ?? null) as string | null;
                                        const assignedTrainerUser = assignedTrainerId ? trainersById.get(assignedTrainerId) : undefined;

                                        return (
                                            <tr key={u.id} className="border-t border-border/60">
                                                {/* Foto perfil con modal */}
                                                <td className="px-3 py-2">
                                                    {hasProfilePic ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const createdAt =
                                                                    (u.lastLoginAt as any) ??
                                                                    (u as any).createdAt ??
                                                                    new Date().toISOString();

                                                                const mediaItem: MediaFeedItem = {
                                                                    source: "adminSettings",
                                                                    publicId: u.profilePicUrl ?? `user_${u.id}`,
                                                                    url: u.profilePicUrl!,
                                                                    resourceType: "image",
                                                                    format: null,
                                                                    createdAt,
                                                                    meta: { userId: u.id, userName: u.name },
                                                                    date: null,
                                                                    weekKey: "admin-user",
                                                                    sessionId: null,
                                                                    sessionType:
                                                                        lang === "es" ? "Foto de perfil" : "Profile picture",
                                                                    dayNotes: null,
                                                                    dayTags: null,
                                                                };

                                                                setSelectedMedia(mediaItem);
                                                            }}
                                                            className="flex h-15 w-15 mx-auto items-center justify-center overflow-hidden rounded-full border bg-background"
                                                            title={lang === "es" ? "Ver foto de perfil" : "View profile picture"}
                                                        >
                                                            <img
                                                                src={u.profilePicUrl!}
                                                                alt={u.name}
                                                                className="h-full w-full object-cover"
                                                                loading="lazy"
                                                            />
                                                        </button>
                                                    ) : (
                                                        <div className="flex h-10 w-10 mx-auto items-center justify-center rounded-full border bg-background text-[11px] font-semibold text-muted-foreground">
                                                            {getInitials(u.name)}
                                                        </div>
                                                    )}
                                                </td>

                                                <td className="px-3 py-2">
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="font-medium truncate">{u.name}</span>
                                                        <span className="text-[11px] text-muted-foreground truncate">
                                                            id: {u.id}
                                                        </span>
                                                    </div>
                                                </td>

                                                <td className="px-3 py-2">
                                                    <span className="text-xs font-mono">{u.email}</span>
                                                </td>

                                                <td className="px-3 py-2">
                                                    <span className="text-xs rounded-full bg-muted px-2 py-1 whitespace-nowrap">
                                                        {u.role === "admin" ? "admin" : "user"}
                                                    </span>
                                                </td>

                                                {/* Coaching mode */}
                                                <td className="px-3 py-2">
                                                    <span className="text-xs rounded-full bg-muted px-2 py-1 whitespace-nowrap">
                                                        {coachModeLabel(coachMode, lang)}
                                                    </span>
                                                </td>

                                                {/* Assigned trainer */}
                                                <td className="px-3 py-2">
                                                    {coachMode === "TRAINEE" ? (
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="text-xs font-medium truncate">
                                                                {assignedTrainerUser?.name ?? (assignedTrainerId ? shortId(assignedTrainerId) : "—")}
                                                            </span>
                                                            <span className="text-[11px] text-muted-foreground font-mono truncate">
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
                                                            (u.isActive
                                                                ? "text-emerald-600 dark:text-emerald-400"
                                                                : "text-muted-foreground")
                                                        }
                                                    >
                                                        {u.isActive ? (lang === "es" ? "Activo" : "Active") : (lang === "es" ? "Inactivo" : "Inactive")}
                                                    </span>
                                                </td>

                                                <td className="px-3 py-2">
                                                    <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">
                                                        {formatLastLogin(u.lastLoginAt, lang)}
                                                    </span>
                                                </td>

                                                <td className="px-3 py-2">
                                                    <div className="flex gap-2">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-7 px-2 text-xs"
                                                            onClick={() => openEditForm(u)}
                                                        >
                                                            {lang === "es" ? "Editar" : "Edit"}
                                                        </Button>

                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-7 px-2 text-xs"
                                                            onClick={() => handleDelete(u)}
                                                        >
                                                            {lang === "es" ? "Eliminar" : "Delete"}
                                                        </Button>

                                                        <Button
                                                            type="button"
                                                            variant="destructive"
                                                            size="sm"
                                                            className="h-7 px-2 text-xs text-white"
                                                            onClick={() => openPurgeModal(u)}
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

                    {/* Paginación */}
                    {total > pageSize ? (
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs text-muted-foreground">
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
                                    onClick={() => setPage(page - 1)}
                                >
                                    {lang === "es" ? "Anterior" : "Prev"}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-7 px-2"
                                    disabled={page >= totalPages || loading}
                                    onClick={() => setPage(page + 1)}
                                >
                                    {lang === "es" ? "Siguiente" : "Next"}
                                </Button>
                            </div>
                        </div>
                    ) : null}
                </CardContent>
            </Card>

            {/* Formulario crear/editar */}
            {formOpen ? (
                <Card className="border-dashed border-primary/30 w-full">
                    <CardHeader className="p-4 sm:p-6">
                        <CardTitle className="text-base">
                            {isEditing
                                ? lang === "es"
                                    ? "Editar usuario"
                                    : "Edit user"
                                : lang === "es"
                                    ? "Nuevo usuario"
                                    : "New user"}
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid gap-3 md:grid-cols-2">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium">Nombre</label>
                                    <input
                                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                        value={form.name}
                                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                        required
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-medium">Email</label>
                                    <input
                                        type="email"
                                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                        value={form.email}
                                        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
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
                                            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
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
                                            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
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
                                        onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as AdminUserRole }))}
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
                                        onChange={(e) => setForm((f) => ({ ...f, sex: e.target.value as any }))}
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
                                        onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.value === "1" }))}
                                    >
                                        <option value="1">{lang === "es" ? "Activo" : "Active"}</option>
                                        <option value="0">{lang === "es" ? "Inactivo" : "Inactive"}</option>
                                    </select>
                                </div>

                                {/* Coaching (NEW) */}
                                <div className="space-y-1">
                                    <label className="text-xs font-medium">{lang === "es" ? "Coaching" : "Coaching"}</label>
                                    <select
                                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                        value={form.coachMode}
                                        onChange={(e) => setCoachMode(e.target.value as CoachMode)}
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

                                {/* Assigned trainer (only for TRAINEE) */}
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

                                            {trainers.map((t) => (
                                                <option key={t.id} value={t.id}>
                                                    {t.name} — {t.email}
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

                            {!submitGate.ok && submitGate.reason ? (
                                <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400">
                                    {submitGate.reason}
                                </div>
                            ) : null}

                            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={closeForm}
                                    disabled={saving}
                                    className="w-full sm:w-auto"
                                >
                                    {lang === "es" ? "Cancelar" : "Cancel"}
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={saving || !submitGate.ok}
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
                    </CardContent>
                </Card>
            ) : null}

            {selectedMedia ? <MediaViewerModal item={selectedMedia} onClose={() => setSelectedMedia(null)} /> : null}

            {/* ✅ Purge Modal */}
            {purgeOpen ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
                    <div className="w-full max-w-lg rounded-xl border bg-background shadow-xl">
                        <div className="p-4 sm:p-5 border-b">
                            <div className="flex items-start justify-between gap-3">
                                <div className="space-y-1">
                                    <h3 className="text-base font-semibold">{lang === "es" ? "Purgar usuario" : "Purge user"}</h3>
                                    <p className="text-xs text-muted-foreground">
                                        {lang === "es"
                                            ? "Esto eliminará permanentemente al usuario y sus datos relacionados. Esta acción no se puede deshacer."
                                            : "This will permanently delete the user and related data. This action cannot be undone."}
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-7 px-2"
                                    onClick={closePurgeModal}
                                    disabled={purging}
                                >
                                    {lang === "es" ? "Cerrar" : "Close"}
                                </Button>
                            </div>
                        </div>

                        <div className="p-4 sm:p-5 space-y-4">
                            {purgeTarget ? (
                                <div className="rounded-lg border bg-muted/30 p-3">
                                    <div className="text-sm font-medium truncate">{purgeTarget.name}</div>
                                    <div className="text-xs text-muted-foreground font-mono truncate">{purgeTarget.email}</div>
                                    <div className="text-[11px] text-muted-foreground font-mono truncate">id: {purgeTarget.id}</div>
                                </div>
                            ) : null}

                            {!purgeResult ? (
                                <>
                                    <div className="space-y-2">
                                        <div className="text-xs font-medium text-red-600 dark:text-red-400">
                                            {lang === "es"
                                                ? "Advertencia: esto borrará datos (días, rutinas, tokens, métricas, etc.)."
                                                : "Warning: this will delete data (days, routines, tokens, metrics, etc.)."}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {lang === "es" ? 'Para confirmar, escribe "PURGE" en el campo.' : 'To confirm, type "PURGE" in the field.'}
                                        </p>

                                        <input
                                            className="h-9 w-full rounded-md border bg-background px-3 text-sm font-mono"
                                            value={purgeConfirmText}
                                            onChange={(e) => setPurgeConfirmText(e.target.value)}
                                            placeholder="PURGE"
                                            disabled={purging}
                                        />
                                    </div>

                                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
                                        <Button type="button" variant="outline" onClick={closePurgeModal} disabled={purging} className="w-full sm:w-auto">
                                            {lang === "es" ? "Cancelar" : "Cancel"}
                                        </Button>

                                        <Button
                                            type="button"
                                            variant="destructive"
                                            onClick={handleConfirmPurge}
                                            disabled={!purgeIsUnlocked || purging}
                                            className="w-full sm:w-auto"
                                        >
                                            {purging ? (lang === "es" ? "Purgando..." : "Purging...") : (lang === "es" ? "Confirmar purga" : "Confirm purge")}
                                        </Button>
                                    </div>

                                    <p className="text-[11px] text-muted-foreground">
                                        {lang === "es"
                                            ? "Tip: si solo quieres desactivar el acceso, usa “Eliminar” (desactiva)."
                                            : "Tip: if you only want to disable access, use “Delete” (deactivates)."}
                                    </p>
                                </>
                            ) : (
                                <div className="space-y-3">
                                    <div className="rounded-lg border bg-emerald-500/10 p-3">
                                        <div className="text-sm font-medium">{lang === "es" ? "Purga completada" : "Purge completed"}</div>
                                        <div className="text-xs text-muted-foreground">{purgeResult.message}</div>
                                    </div>

                                    {purgeResult.cleanup?.items?.length ? (
                                        <div className="rounded-lg border p-3">
                                            <div className="text-xs font-semibold mb-2">{lang === "es" ? "Reporte de limpieza" : "Cleanup report"}</div>

                                            <div className="space-y-1">
                                                {purgeResult.cleanup.items.map((it) => (
                                                    <div key={it.model} className="flex items-center justify-between gap-3 text-xs">
                                                        <span className="font-mono">{it.model}</span>
                                                        <span className="font-mono text-muted-foreground">{formatDeletedCount(it.deletedCount)}</span>
                                                    </div>
                                                ))}
                                                <div className="mt-2 border-t pt-2 flex items-center justify-between text-xs">
                                                    <span className="font-semibold">{lang === "es" ? "Total eliminado" : "Total deleted"}</span>
                                                    <span className="font-mono font-semibold">{formatDeletedCount(purgeResult.cleanup.totalDeleted)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-xs text-muted-foreground">
                                            {lang === "es" ? "No se recibió reporte de limpieza." : "No cleanup report received."}
                                        </div>
                                    )}

                                    <div className="flex justify-end">
                                        <Button type="button" onClick={closePurgeModal}>
                                            {lang === "es" ? "Listo" : "Done"}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
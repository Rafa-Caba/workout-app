// src/components/adminUsers/AdminUsersSection.tsx
import React from "react";

import { useAdminUsersStore } from "@/state/adminUsers.store";
import type { AdminUser } from "@/types/adminUser.types";
import { useI18n } from "@/i18n/I18nProvider";
import { MediaViewerModal } from "@/components/media/MediaViewerModal";
import type { MediaFeedItem } from "@/types/media.types";
import { fetchAdminTrainers } from "@/services/admin/adminUsers.service";

import { AdminUserFormModal } from "@/components/adminUsers/AdminUserFormModal";
import { AdminUsersListCard } from "@/components/adminUsers/AdminUsersListCard";
import { AdminUserPurgeModal } from "@/components/adminUsers/AdminUserPurgeModal";
import {
    type CoachMode,
    type UserFormValues,
    emptyUserForm,
    parsePurgeResult,
    readAssignedTrainer,
    readCoachMode,
    readCreatedAt,
} from "./../../components/adminUsers/adminUsers.shared";

type RoleFilter = "all" | "admin" | "user";
type ActiveFilter = "all" | "active" | "inactive";

function getErrorMessage(error: unknown, lang: string): string {
    if (error instanceof Error && error.message.trim().length > 0) {
        return error.message;
    }

    const fallback =
        lang === "es"
            ? "Ocurrió un error inesperado."
            : "An unexpected error occurred.";

    if (typeof error === "object" && error !== null) {
        const maybeMessage = Reflect.get(error, "message");
        if (typeof maybeMessage === "string" && maybeMessage.trim().length > 0) {
            return maybeMessage;
        }

        const maybeResponse = Reflect.get(error, "response");
        if (typeof maybeResponse === "object" && maybeResponse !== null) {
            const maybeData = Reflect.get(maybeResponse, "data");
            if (typeof maybeData === "object" && maybeData !== null) {
                const maybeError = Reflect.get(maybeData, "error");
                if (typeof maybeError === "object" && maybeError !== null) {
                    const message = Reflect.get(maybeError, "message");
                    if (typeof message === "string" && message.trim().length > 0) {
                        return message;
                    }
                }

                const message = Reflect.get(maybeData, "message");
                if (typeof message === "string" && message.trim().length > 0) {
                    return message;
                }
            }
        }
    }

    return fallback;
}

function buildSubmitError(form: UserFormValues, isEditing: boolean, lang: string): string | null {
    if (form.name.trim().length === 0) {
        return lang === "es" ? "Nombre requerido." : "Name is required.";
    }

    if (form.email.trim().length === 0) {
        return lang === "es" ? "Email requerido." : "Email is required.";
    }

    if (!isEditing && form.password.trim().length === 0) {
        return lang === "es" ? "Contraseña requerida." : "Password is required.";
    }

    if (form.coachMode === "TRAINEE" && !form.assignedTrainer) {
        return lang === "es"
            ? "Si el usuario es TRAINEE, debes asignar un trainer."
            : "If user is TRAINEE, you must assign a trainer.";
    }

    return null;
}

function buildMediaItem(user: AdminUser, lang: string): MediaFeedItem | null {
    if (!user.profilePicUrl) return null;

    const createdAt = user.lastLoginAt ?? readCreatedAt(user) ?? new Date().toISOString();

    return {
        source: "adminSettings",
        publicId: user.profilePicUrl,
        url: user.profilePicUrl,
        resourceType: "image",
        format: null,
        createdAt,
        meta: {
            userId: user.id,
            userName: user.name,
        },
        date: null,
        weekKey: "admin-user",
        sessionId: null,
        sessionType: lang === "es" ? "Foto de perfil" : "Profile picture",
        dayNotes: null,
        dayTags: null,
    };
}

function buildEditForm(user: AdminUser): UserFormValues {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        password: "",
        role: user.role,
        sex: user.sex ?? "",
        isActive: user.isActive,
        coachMode: readCoachMode(user),
        assignedTrainer: readAssignedTrainer(user),
    };
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
    const [form, setForm] = React.useState<UserFormValues>(emptyUserForm);
    const [saving, setSaving] = React.useState(false);
    const [selectedMedia, setSelectedMedia] = React.useState<MediaFeedItem | null>(null);

    const [trainersLoading, setTrainersLoading] = React.useState(false);
    const [trainersError, setTrainersError] = React.useState<string | null>(null);
    const [trainers, setTrainers] = React.useState<AdminUser[]>([]);

    const [purgeOpen, setPurgeOpen] = React.useState(false);
    const [purgeTarget, setPurgeTarget] = React.useState<AdminUser | null>(null);
    const [purgeConfirmText, setPurgeConfirmText] = React.useState("");
    const [purging, setPurging] = React.useState(false);
    const [purgeResult, setPurgeResult] = React.useState<ReturnType<typeof parsePurgeResult>>(null);

    const isEditing = Boolean(form.id);

    React.useEffect(() => {
        void loadUsers();
    }, [page, search, roleFilter, activeFilter, loadUsers]);

    React.useEffect(() => {
        let alive = true;

        async function loadTrainers() {
            setTrainersLoading(true);
            setTrainersError(null);

            try {
                const response = await fetchAdminTrainers({ page: 1, limit: 200 });

                if (!alive) return;

                setTrainers(Array.isArray(response.items) ? response.items : []);
            } catch (error: unknown) {
                if (!alive) return;
                setTrainersError(getErrorMessage(error, lang));
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

        for (const trainer of trainers) {
            map.set(trainer.id, trainer);
        }

        return map;
    }, [trainers]);

    const totalPages = total > 0 ? Math.max(1, Math.ceil(total / pageSize)) : 1;
    const submitError = buildSubmitError(form, isEditing, lang);

    function openCreateForm() {
        setForm(emptyUserForm);
        setFormOpen(true);
    }

    function openEditForm(user: AdminUser) {
        setForm(buildEditForm(user));
        setFormOpen(true);
    }

    function closeForm() {
        setFormOpen(false);
        setForm(emptyUserForm);
        setSaving(false);
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (submitError) return;

        setSaving(true);

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
                    coachMode,
                    assignedTrainer,
                });
            } else {
                await createUser({
                    name: form.name,
                    email: form.email,
                    password: form.password.trim(),
                    role: form.role,
                    sex: form.sex || null,
                    isActive: form.isActive,
                    coachMode,
                    assignedTrainer,
                });
            }

            closeForm();
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(user: AdminUser) {
        const confirmed = window.confirm(
            lang === "es"
                ? `¿Desactivar usuario "${user.name}"?`
                : `Deactivate user "${user.name}"?`
        );

        if (!confirmed) return;

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
            const rawResult = await purgeUser(purgeTarget.id);
            setPurgeResult(parsePurgeResult(rawResult));
            await loadUsers();
        } finally {
            setPurging(false);
        }
    }

    function handleOpenProfileImage(user: AdminUser) {
        const mediaItem = buildMediaItem(user, lang);
        if (!mediaItem) return;
        setSelectedMedia(mediaItem);
    }

    return (
        <div className="space-y-4">
            <AdminUsersListCard
                lang={lang}
                items={items}
                total={total}
                page={page}
                pageSize={pageSize}
                totalPages={totalPages}
                search={search}
                roleFilter={roleFilter as RoleFilter}
                activeFilter={activeFilter as ActiveFilter}
                loading={loading}
                error={error}
                trainersById={trainersById}
                onSearchChange={setSearch}
                onRoleFilterChange={setRoleFilter}
                onActiveFilterChange={setActiveFilter}
                onPrevPage={() => setPage(page - 1)}
                onNextPage={() => setPage(page + 1)}
                onCreate={openCreateForm}
                onEdit={openEditForm}
                onDelete={handleDelete}
                onPurge={openPurgeModal}
                onOpenProfileImage={handleOpenProfileImage}
            />

            <AdminUserFormModal
                lang={lang}
                open={formOpen}
                saving={saving}
                isEditing={isEditing}
                form={form}
                trainers={trainers}
                trainersLoading={trainersLoading}
                trainersError={trainersError}
                submitError={submitError}
                onClose={closeForm}
                onSubmit={handleSubmit}
                onChange={setForm}
            />

            <AdminUserPurgeModal
                lang={lang}
                open={purgeOpen}
                target={purgeTarget}
                confirmText={purgeConfirmText}
                purging={purging}
                result={purgeResult}
                onClose={closePurgeModal}
                onConfirmTextChange={setPurgeConfirmText}
                onConfirm={handleConfirmPurge}
            />

            {selectedMedia ? (
                <MediaViewerModal item={selectedMedia} onClose={() => setSelectedMedia(null)} />
            ) : null}
        </div>
    );
}
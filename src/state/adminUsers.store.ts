import { create } from "zustand";
import { toast } from "sonner";
import type {
    AdminUser,
    AdminUserActiveFilter,
    AdminUserCreatePayload,
    AdminUserListResponse,
    AdminUserRoleFilter,
    AdminUserUpdatePayload,
} from "@/types/adminUser.types";
import {
    createAdminUser,
    deleteAdminUser,
    fetchAdminUsers,
    updateAdminUser,
} from "@/services/admin/adminUsers.service";

type AdminUsersState = {
    items: AdminUser[];
    total: number;
    page: number;
    pageSize: number;

    search: string;
    roleFilter: AdminUserRoleFilter;
    activeFilter: AdminUserActiveFilter;

    loading: boolean;
    error: string | null;

    // actions
    setSearch: (value: string) => void;
    setRoleFilter: (value: AdminUserRoleFilter) => void;
    setActiveFilter: (value: AdminUserActiveFilter) => void;
    setPage: (page: number) => void;

    loadUsers: () => Promise<void>;

    createUser: (payload: AdminUserCreatePayload) => Promise<AdminUser | null>;
    updateUser: (
        id: string,
        payload: AdminUserUpdatePayload
    ) => Promise<AdminUser | null>;
    removeUser: (id: string) => Promise<boolean>;
};

export const useAdminUsersStore = create<AdminUsersState>((set, get) => ({
    items: [],
    total: 0,
    page: 1,
    pageSize: 10,

    search: "",
    roleFilter: "all",
    activeFilter: "all",

    loading: false,
    error: null,

    setSearch(value) {
        set({ search: value, page: 1 });
    },

    setRoleFilter(value) {
        set({ roleFilter: value, page: 1 });
    },

    setActiveFilter(value) {
        set({ activeFilter: value, page: 1 });
    },

    setPage(page) {
        set({ page });
    },

    async loadUsers() {
        const { page, pageSize, search, roleFilter, activeFilter } = get();

        set({ loading: true, error: null });

        try {
            const query: any = {
                page,
                pageSize,
            };

            if (search.trim()) query.search = search.trim();
            if (roleFilter !== "all") query.role = roleFilter;
            if (activeFilter !== "all") {
                query.isActive = activeFilter === "active";
            }

            const data: AdminUserListResponse = await fetchAdminUsers(query);

            set({
                items: data.items,
                total: data.total,
                page: data.page,
                pageSize: data.pageSize,
                loading: false,
                error: null,
            });
        } catch (e: any) {
            const msg =
                e?.response?.data?.error?.message ??
                e?.message ??
                "No se pudieron cargar los usuarios.";
            set({ loading: false, error: msg });
            toast.error("Error al cargar usuarios", {
                description: msg,
            });
        }
    },

    async createUser(payload) {
        try {
            const user = await createAdminUser(payload);
            toast.success("Usuario creado");
            // recargar lista (mantiene filtros/página)
            await get().loadUsers();
            return user;
        } catch (e: any) {
            const msg =
                e?.response?.data?.error?.message ??
                e?.message ??
                "No se pudo crear el usuario.";
            toast.error("Error al crear usuario", { description: msg });
            return null;
        }
    },

    async updateUser(id, payload) {
        try {
            const user = await updateAdminUser(id, payload);
            toast.success("Usuario actualizado");

            // actualizar en memoria sin forzar refetch completo
            set((state) => ({
                items: state.items.map((u) => (u.id === id ? user : u)),
            }));

            return user;
        } catch (e: any) {
            const msg =
                e?.response?.data?.error?.message ??
                e?.message ??
                "No se pudo actualizar el usuario.";
            toast.error("Error al actualizar usuario", { description: msg });
            return null;
        }
    },

    async removeUser(id) {
        try {
            await deleteAdminUser(id);
            toast.success("Usuario eliminado");

            set((state) => ({
                items: state.items.filter((u) => u.id !== id),
                total: Math.max(0, state.total - 1),
            }));

            return true;
        } catch (e: any) {
            const msg =
                e?.response?.data?.error?.message ??
                e?.message ??
                "No se pudo eliminar el usuario.";
            toast.error("Error al eliminar usuario", { description: msg });
            return false;
        }
    },
}));

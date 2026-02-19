import { api } from "@/api/axios";
import type {
    AdminUser,
    AdminUserCreatePayload,
    AdminUserListResponse,
    AdminUserQuery,
    AdminUserUpdatePayload,
} from "@/types/adminUser.types";

export async function fetchAdminUsers(
    query: AdminUserQuery = {}
): Promise<AdminUserListResponse> {
    const res = await api.get<AdminUserListResponse>("/admin/users", {
        params: query,
    });
    return res.data;
}

export async function fetchAdminUserById(id: string): Promise<AdminUser> {
    const res = await api.get<AdminUser>(`/admin/users/${id}`);
    return res.data;
}

export async function createAdminUser(
    payload: AdminUserCreatePayload
): Promise<AdminUser> {
    const res = await api.post<AdminUser>("/admin/users", payload);
    return res.data;
}

export async function updateAdminUser(
    id: string,
    payload: AdminUserUpdatePayload
): Promise<AdminUser> {
    const res = await api.patch<AdminUser>(
        `/admin/users/${id}`,
        payload
    );
    return res.data;
}

// Soft delete (desactivar)
export async function deleteAdminUser(id: string): Promise<{ id: string; message: string }> {
    const { data } = await api.delete(`/admin/users/${id}`);
    return data;
}

export type AdminUserPurgeResponse = {
    id: string;
    message: string;
    cleanup?: {
        items: { model: string; deletedCount: number }[];
        totalDeleted: number;
    };
};

// Hard delete + cleanup report
export async function purgeAdminUser(id: string): Promise<AdminUserPurgeResponse> {
    const { data } = await api.delete(`/admin/users/${id}/purge`);
    return data;
}
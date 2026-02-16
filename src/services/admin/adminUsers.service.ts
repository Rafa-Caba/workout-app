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

export async function deleteAdminUser(id: string): Promise<void> {
    await api.delete(`/admin/users/${id}`);
}


export type AdminUserRole = "admin" | "user";

export type AdminUserSex = "male" | "female" | "other" | null;

export type AdminUserActivityGoal =
    | "fat_loss"
    | "hypertrophy"
    | "strength"
    | "maintenance"
    | "other"
    | null;

export type AdminUserUnits = {
    weight: "kg" | "lb";
    distance: "km" | "mi";
} | null;

export interface AdminUser {
    id: string;
    name: string;
    email: string;
    sex: AdminUserSex;
    role: AdminUserRole;
    isActive: boolean;

    profilePicUrl: string | null;

    heightCm: number | null;
    currentWeightKg: number | null;

    units: AdminUserUnits;

    birthDate: string | null; // YYYY-MM-DD
    activityGoal: AdminUserActivityGoal;
    timezone: string | null;

    lastLoginAt: string | null;

    createdAt: string;
    updatedAt: string;
}

export interface AdminUserListResponse {
    items: AdminUser[];
    total: number;
    page: number;
    pageSize: number;
}

export type AdminUserRoleFilter = AdminUserRole | "all";
export type AdminUserActiveFilter = "all" | "active" | "inactive";

export interface AdminUserQuery {
    page?: number;
    pageSize?: number;
    search?: string;
    role?: AdminUserRole;
    isActive?: boolean;
}

export interface AdminUserCreatePayload {
    name: string;
    email: string;
    password: string;
    role: AdminUserRole;
    sex?: AdminUserSex;
    isActive?: boolean;

    heightCm?: number | null;
    currentWeightKg?: number | null;

    units?: AdminUserUnits;

    birthDate?: string | null;
    activityGoal?: AdminUserActivityGoal;
    timezone?: string | null;
}

export interface AdminUserUpdatePayload {
    name?: string;
    email?: string;
    password?: string; // optional: if present, backend will reset password
    role?: AdminUserRole;
    sex?: AdminUserSex;
    isActive?: boolean;

    heightCm?: number | null;
    currentWeightKg?: number | null;

    units?: AdminUserUnits;

    birthDate?: string | null;
    activityGoal?: AdminUserActivityGoal;
    timezone?: string | null;
}

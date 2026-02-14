export type Units = {
    weight: "kg" | "lb";
    distance: "km" | "mi";
};

export type UserRole = "admin" | "user";
export type Sex = "male" | "female" | "other" | null;

export type PublicUser = {
    id: string;
    name: string;
    email: string;
    sex: Sex;
    role: UserRole;

    profilePicUrl: string | null;

    heightCm: number | null;
    currentWeightKg: number | null;

    units: Units | null;

    birthDate: string | null; // YYYY-MM-DD
    activityGoal: "fat_loss" | "hypertrophy" | "strength" | "maintenance" | "other" | null;
    timezone: string | null;

    createdAt: string;
    updatedAt: string;
};

export type AuthTokens = {
    accessToken: string;
    refreshToken: string;
};

export type AuthUser = PublicUser;

export type RegisterRequest = {
    name: string;
    email: string;
    password: string;
    sex?: Sex;
};

export type LoginRequest = {
    email: string;
    password: string;
};

export type AuthResponse = {
    user: AuthUser;
    tokens: AuthTokens;
};

export type LoginResponse = AuthResponse;
export type RegisterResponse = AuthResponse;

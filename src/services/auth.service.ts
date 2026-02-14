import { api } from "@/api/axios";
import type {
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    RegisterResponse,
    AuthTokens,
} from "@/types/auth.types";

export async function login(payload: LoginRequest): Promise<LoginResponse> {
    const res = await api.post("/auth/login", payload);
    return res.data as LoginResponse;
}

export async function register(payload: RegisterRequest): Promise<RegisterResponse> {
    const res = await api.post("/auth/register", payload);
    return res.data as RegisterResponse;
}

// BE: POST /auth/refresh -> { tokens: { accessToken, refreshToken } }
export async function refresh(refreshToken: string): Promise<{ tokens: AuthTokens }> {
    const res = await api.post("/auth/refresh", { refreshToken });
    return res.data as { tokens: AuthTokens };
}

// BE: POST /auth/logout -> { ok: true }
export async function logout(refreshToken: string): Promise<{ ok: true }> {
    const res = await api.post("/auth/logout", { refreshToken });
    return res.data as { ok: true };
}

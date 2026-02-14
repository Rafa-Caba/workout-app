import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/state/auth.store";
import { normalizeApiError, type ApiError } from "@/api/httpErrors";

export const api = axios.create({
    baseURL: "http://localhost:4000/api",
});

api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// --- Refresh orchestration (avoid multiple refresh calls)
let refreshPromise: Promise<{ accessToken: string; refreshToken: string }> | null = null;

async function refreshTokens(): Promise<{ accessToken: string; refreshToken: string }> {
    const rt = useAuthStore.getState().refreshToken;
    if (!rt) {
        throw Object.assign(new Error("No refresh token available"), { status: 401 });
    }

    // Call backend refresh: POST /api/auth/refresh
    const res = await axios.post(
        "http://localhost:4000/api/auth/refresh",
        { refreshToken: rt },
        {
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
        }
    );

    const tokens = res.data?.tokens;
    if (!tokens?.accessToken || !tokens?.refreshToken) {
        throw Object.assign(new Error("Invalid refresh response"), { status: 401 });
    }

    return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
}

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

function isAuthRoute(url?: string) {
    if (!url) return false;
    // covers both absolute and relative uses
    return url.includes("/auth/login") || url.includes("/auth/refresh") || url.includes("/auth/register");
}

api.interceptors.response.use(
    (res) => res,
    async (error: AxiosError) => {
        const apiErr = normalizeApiError(error) as ApiError;

        const status = apiErr.status ?? (error.response?.status ?? null);
        const original = (error.config ?? null) as RetriableConfig | null;

        if (!original) return Promise.reject(apiErr);

        // Never try to refresh for auth endpoints themselves
        if (isAuthRoute(original.url)) {
            if (status === 401) {
                useAuthStore.getState().clear();
            }
            return Promise.reject(apiErr);
        }

        // Handle 401 with refresh
        if (status === 401 && !original._retry) {
            original._retry = true;

            // If no refresh token, clear auth immediately
            const rt = useAuthStore.getState().refreshToken;
            if (!rt) {
                useAuthStore.getState().clear();
                return Promise.reject(apiErr);
            }

            try {
                if (!refreshPromise) {
                    refreshPromise = refreshTokens().finally(() => {
                        refreshPromise = null;
                    });
                }

                const newTokens = await refreshPromise;

                // Save tokens
                useAuthStore.getState().setTokens(newTokens);

                // Reattach new token and retry
                original.headers = original.headers ?? {};
                original.headers.Authorization = `Bearer ${newTokens.accessToken}`;

                return api.request(original);
            } catch (_e) {
                // Refresh failed → clear auth
                useAuthStore.getState().clear();
                return Promise.reject(apiErr);
            }
        }

        return Promise.reject(apiErr);
    }
);

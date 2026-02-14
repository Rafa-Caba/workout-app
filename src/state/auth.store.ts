import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthUser, LoginRequest, RegisterRequest, AuthTokens } from "@/types/auth.types";
import * as authService from "@/services/auth.service";
import { useUserStore } from "@/state/user.store";

type AuthState = {
    user: AuthUser | null;
    accessToken: string | null;
    refreshToken: string | null;

    setAuth: (args: { user: AuthUser; accessToken: string; refreshToken: string }) => void;
    setTokens: (args: { accessToken: string; refreshToken: string }) => void;
    setUser: (user: AuthUser | null) => void;

    // async actions
    login: (payload: LoginRequest) => Promise<void>;
    register: (payload: RegisterRequest) => Promise<void>;
    logout: () => Promise<void>;
    refreshNow: () => Promise<AuthTokens | null>;

    clear: () => void;
};

const STORAGE_KEY = "workout-auth";

function clearUserDomainState() {
    try {
        // Clear user domain store as well to avoid stale profile/settings/metrics
        useUserStore.getState().clearMe();
    } catch {
        // ignore
    }
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            accessToken: null,
            refreshToken: null,

            setAuth: ({ user, accessToken, refreshToken }) => {
                set({ user, accessToken, refreshToken });
                // hydrate user domain store too
                try {
                    useUserStore.setState({ me: user });
                } catch {
                    // ignore
                }
            },

            setTokens: ({ accessToken, refreshToken }) => set({ accessToken, refreshToken }),

            setUser: (user) => {
                set({ user });
                // keep user domain store in sync
                try {
                    useUserStore.setState({ me: user });
                } catch {
                    // ignore
                }
            },

            login: async (payload) => {
                const data = await authService.login(payload);

                set({
                    user: data.user,
                    accessToken: data.tokens.accessToken,
                    refreshToken: data.tokens.refreshToken,
                });

                // hydrate user domain store
                try {
                    useUserStore.setState({ me: data.user, loading: false, error: null });
                } catch {
                    // ignore
                }
            },

            register: async (payload) => {
                const data = await authService.register(payload);

                set({
                    user: data.user,
                    accessToken: data.tokens.accessToken,
                    refreshToken: data.tokens.refreshToken,
                });

                // hydrate user domain store
                try {
                    useUserStore.setState({ me: data.user, loading: false, error: null });
                } catch {
                    // ignore
                }
            },

            refreshNow: async () => {
                const rt = get().refreshToken;
                if (!rt) return null;

                try {
                    const out = await authService.refresh(rt);
                    const tokens = out.tokens;

                    set({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
                    return tokens;
                } catch {
                    // if refresh fails, clear session
                    get().clear();
                    return null;
                }
            },

            logout: async () => {
                const rt = get().refreshToken;

                // Always clear locally (idempotent UX)
                set({ user: null, accessToken: null, refreshToken: null });
                clearUserDomainState();

                try {
                    localStorage.removeItem(STORAGE_KEY);
                } catch {
                    // ignore
                }

                // Best-effort server logout (idempotent on BE)
                if (rt) {
                    try {
                        await authService.logout(rt);
                    } catch {
                        // ignore
                    }
                }
            },

            clear: () => {
                set({ user: null, accessToken: null, refreshToken: null });
                clearUserDomainState();

                try {
                    localStorage.removeItem(STORAGE_KEY);
                } catch {
                    // ignore
                }
            },
        }),
        {
            name: STORAGE_KEY,
            partialize: (s) => ({
                user: s.user,
                accessToken: s.accessToken,
                refreshToken: s.refreshToken,
            }),
        }
    )
);

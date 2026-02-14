import { create } from "zustand";
import type { AuthUser } from "@/types/auth.types";
import type { UserProfileUpdateRequest } from "@/types/user.types";
import { getMe, patchMe, uploadMyProfilePic, deleteMyProfilePic } from "@/services/user.service";
import { useAuthStore } from "@/state/auth.store";

type UserStoreState = {
    me: AuthUser | null;
    loading: boolean;
    error: string | null;

    // read actions
    fetchMe: () => Promise<AuthUser | null>;
    clearMe: () => void;

    // write actions
    updateMe: (payload: UserProfileUpdateRequest) => Promise<AuthUser>;
    uploadProfilePic: (file: File) => Promise<AuthUser>;
    deleteProfilePic: () => Promise<AuthUser>;
};

function setAuthUser(user: AuthUser | null) {
    // Keep NavBar + any auth-dependent UI in sync
    const auth = useAuthStore.getState();
    auth.setUser(user);
}

function getAccessToken(): string | null {
    return useAuthStore.getState().accessToken ?? null;
}

export const useUserStore = create<UserStoreState>((set, get) => ({
    me: null,
    loading: false,
    error: null,

    fetchMe: async () => {
        const token = getAccessToken();
        if (!token) {
            set({ me: null, loading: false, error: null });
            setAuthUser(null);
            return null;
        }

        set({ loading: true, error: null });

        try {
            const me = await getMe();
            set({ me, loading: false, error: null });
            setAuthUser(me);
            return me;
        } catch (e: any) {
            const msg = typeof e?.message === "string" ? e.message : "Failed to load profile";
            set({ loading: false, error: msg });
            return null;
        }
    },

    clearMe: () => {
        set({ me: null, loading: false, error: null });
        setAuthUser(null);
    },

    updateMe: async (payload: UserProfileUpdateRequest) => {
        const token = getAccessToken();
        if (!token) throw new Error("Not authenticated");

        set({ loading: true, error: null });

        try {
            const updated = await patchMe(payload);
            set({ me: updated, loading: false, error: null });
            setAuthUser(updated);
            return updated;
        } catch (e: any) {
            const msg = typeof e?.message === "string" ? e.message : "Failed to update profile";
            set({ loading: false, error: msg });
            throw new Error(msg);
        }
    },

    uploadProfilePic: async (file: File) => {
        const token = getAccessToken();
        if (!token) throw new Error("Not authenticated");

        set({ loading: true, error: null });

        try {
            const updated = await uploadMyProfilePic(file);
            set({ me: updated, loading: false, error: null });
            setAuthUser(updated);
            return updated;
        } catch (e: any) {
            const msg = typeof e?.message === "string" ? e.message : "Failed to upload profile picture";
            set({ loading: false, error: msg });
            throw new Error(msg);
        }
    },

    deleteProfilePic: async () => {
        const token = getAccessToken();
        if (!token) throw new Error("Not authenticated");

        set({ loading: true, error: null });

        try {
            const updated = await deleteMyProfilePic();
            set({ me: updated, loading: false, error: null });
            setAuthUser(updated);
            return updated;
        } catch (e: any) {
            const msg = typeof e?.message === "string" ? e.message : "Failed to delete profile picture";
            set({ loading: false, error: msg });
            throw new Error(msg);
        }
    },
}));

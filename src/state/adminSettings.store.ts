import { create } from "zustand";
import { toast } from "sonner";
import type {
    AdminSettings,
    AdminSettingsPalette,
    AdminSettingsThemeMode,
} from "@/types/adminSettings.types";
import {
    fetchAdminSettings,
    updateAdminSettingsJson,
    uploadAdminSettingsLogo,
    type AdminSettingsUpdatePayload,
} from "@/services/admin/adminSettings.service";

type AdminSettingsUpdateInput = AdminSettingsUpdatePayload & {
    logoFile?: File | null;
};

type AdminSettingsState = {
    settings: AdminSettings | null;
    loading: boolean;
    saving: boolean;
    error: string | null;

    loadSettings: () => Promise<void>;
    updateSettings: (input: AdminSettingsUpdateInput) => Promise<AdminSettings | null>;
};

export const useAdminSettingsStore = create<AdminSettingsState>((set) => ({
    settings: null,
    loading: false,
    saving: false,
    error: null,

    async loadSettings() {
        set({ loading: true, error: null });
        try {
            const data = await fetchAdminSettings();
            set({ settings: data, loading: false });
        } catch (e: any) {
            const msg =
                e?.response?.data?.error?.message ??
                e?.message ??
                "No se pudieron cargar los ajustes.";
            set({ loading: false, error: msg });
            toast.error("Error al cargar ajustes", { description: msg });
        }
    },

    async updateSettings(input) {
        set({ saving: true });
        try {
            const { logoFile, ...rest } = input;

            // 1) Actualizar ajustes JSON
            let current = await updateAdminSettingsJson(rest);

            // 2) Si hay logo, subirlo
            if (logoFile) {
                current = await uploadAdminSettingsLogo(logoFile);
            }

            set({ settings: current, saving: false });
            toast.success("Ajustes guardados");
            return current;
        } catch (e: any) {
            const msg =
                e?.response?.data?.error?.message ??
                e?.message ??
                "No se pudieron guardar los ajustes.";
            set({ saving: false });
            toast.error("Error al guardar ajustes", { description: msg });
            return null;
        }
    },
}));

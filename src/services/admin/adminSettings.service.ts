import { api } from "@/api/axios";
import type {
    AdminSettings,
    AdminSettingsPalette,
    AdminSettingsThemeMode,
} from "@/types/adminSettings.types";

export interface AdminSettingsUpdatePayload {
    appName: string;
    appSubtitle?: string | null;
    debugShowJson: boolean;
    themeMode: AdminSettingsThemeMode;
    themePalette: AdminSettingsPalette;
}

/**
 * GET /admin/settings
 */
export async function fetchAdminSettings(): Promise<AdminSettings> {
    const res = await api.get<AdminSettings>("/admin/settings");
    return res.data;
}

/**
 * PATCH /admin/settings
 * JSON only (sin logo)
 */
export async function updateAdminSettingsJson(
    payload: AdminSettingsUpdatePayload
): Promise<AdminSettings> {
    const res = await api.patch<AdminSettings>("/admin/settings", {
        appName: payload.appName,
        appSubtitle: payload.appSubtitle ?? null,
        debugShowJson: payload.debugShowJson,
        themeMode: payload.themeMode,
        themePalette: payload.themePalette,
    });

    return res.data;
}

/**
 * POST /admin/settings/logo
 * field name: "image"
 */
export async function uploadAdminSettingsLogo(
    file: File
): Promise<AdminSettings> {
    const fd = new FormData();
    fd.append("image", file);

    const res = await api.post<AdminSettings>(
        "/admin/settings/logo",
        fd,
        {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        }
    );

    return res.data;
}

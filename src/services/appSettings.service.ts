import { api } from "@/api/axios";
import type { AppSettings } from "@/types/appSettings.types";

/**
 * GET /api/app-settings
 */
export async function getAppSettings(): Promise<AppSettings> {
    const res = await api.get<AppSettings>("/app-settings");
    return res.data;
}

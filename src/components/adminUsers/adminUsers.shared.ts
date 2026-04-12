// src/components/adminUsers/adminUsers.shared.ts
import type { AdminUser } from "@/types/adminUser.types";

export type CoachMode = "NONE" | "TRAINER" | "TRAINEE";

export type UserFormValues = {
    id?: string;
    name: string;
    email: string;
    password: string;
    role: "admin" | "user";
    sex: "male" | "female" | "other" | "";
    isActive: boolean;
    coachMode: CoachMode;
    assignedTrainer: string | null;
};

export type PurgeCleanupItem = {
    model: string;
    deletedCount: number;
};

export type PurgeResult = {
    id: string;
    message: string;
    cleanup?: {
        items: PurgeCleanupItem[];
        totalDeleted: number;
    };
};

export const emptyUserForm: UserFormValues = {
    name: "",
    email: "",
    password: "",
    role: "user",
    sex: "",
    isActive: true,
    coachMode: "NONE",
    assignedTrainer: null,
};

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
    return typeof value === "object" && value !== null;
}

export function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "U";

    const first = parts[0]?.[0] ?? "U";
    const second = parts.length > 1 ? parts[1]?.[0] : parts[0]?.[1];

    return (first + (second ?? "")).toUpperCase();
}

export function formatDeletedCount(n: number): string {
    try {
        return new Intl.NumberFormat("es-MX").format(n);
    } catch {
        return String(n);
    }
}

export function shortId(id: string | null | undefined): string {
    if (!id) return "—";
    if (id.length <= 10) return id;
    return `${id.slice(0, 6)}…${id.slice(-4)}`;
}

export function coachModeLabel(mode: CoachMode, lang: string): string {
    if (mode === "TRAINER") return "Trainer";
    if (mode === "TRAINEE") return "Trainee";
    return lang === "es" ? "None" : "None";
}

export function formatLastLogin(iso: string | null | undefined, lang: string): string {
    if (!iso) return "—";

    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";

    const locale = lang === "es" ? "es-MX" : "en-US";

    try {
        const datePart = new Intl.DateTimeFormat(locale, {
            year: "numeric",
            month: "short",
            day: "2-digit",
        }).format(d);

        const timePart = new Intl.DateTimeFormat(locale, {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        }).format(d);

        return `${datePart} - ${timePart}`;
    } catch {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        const hh = String(d.getHours()).padStart(2, "0");
        const mm = String(d.getMinutes()).padStart(2, "0");
        return `${y}-${m}-${day} - ${hh}:${mm}`;
    }
}

export function readCoachMode(user: AdminUser): CoachMode {
    const raw: unknown = user;

    if (!isRecord(raw)) return "NONE";

    const value = raw["coachMode"];
    if (value === "TRAINER" || value === "TRAINEE" || value === "NONE") {
        return value;
    }

    return "NONE";
}

export function readAssignedTrainer(user: AdminUser): string | null {
    const raw: unknown = user;

    if (!isRecord(raw)) return null;

    const value = raw["assignedTrainer"];
    return typeof value === "string" && value.trim().length > 0 ? value : null;
}

export function readCreatedAt(user: AdminUser): string | null {
    const raw: unknown = user;

    if (!isRecord(raw)) return null;

    const value = raw["createdAt"];
    return typeof value === "string" && value.trim().length > 0 ? value : null;
}

export function parsePurgeResult(input: unknown): PurgeResult | null {
    if (!isRecord(input)) return null;

    const id = typeof input["id"] === "string" ? input["id"] : "";
    const message = typeof input["message"] === "string" ? input["message"] : "";

    const cleanupRaw = input["cleanup"];
    let cleanup: PurgeResult["cleanup"];

    if (isRecord(cleanupRaw)) {
        const itemsRaw = cleanupRaw["items"];
        const totalDeletedRaw = cleanupRaw["totalDeleted"];

        const items: PurgeCleanupItem[] = Array.isArray(itemsRaw)
            ? itemsRaw.flatMap((item) => {
                if (!isRecord(item)) return [];
                const model = typeof item["model"] === "string" ? item["model"] : "";
                const deletedCount =
                    typeof item["deletedCount"] === "number" && Number.isFinite(item["deletedCount"])
                        ? item["deletedCount"]
                        : 0;

                return model ? [{ model, deletedCount }] : [];
            })
            : [];

        const totalDeleted =
            typeof totalDeletedRaw === "number" && Number.isFinite(totalDeletedRaw)
                ? totalDeletedRaw
                : 0;

        cleanup = {
            items,
            totalDeleted,
        };
    }

    if (!id && !message) return null;

    return {
        id,
        message,
        cleanup,
    };
}
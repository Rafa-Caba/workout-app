import { toast } from "sonner";
import type { ApiError } from "@/api/httpErrors";

export function safeStringify(value: unknown) {
    return JSON.stringify(value, null, 2);
}

export function safeParseJson(
    text: string
): { ok: true; value: unknown } | { ok: false; error: string } {
    try {
        return { ok: true, value: JSON.parse(text) };
    } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "Invalid JSON" };
    }
}

export function toastApiError(e: unknown, fallback: string) {
    const err = e as Partial<ApiError> | undefined;
    const msg = err?.message ?? fallback;
    const details = err?.details ? JSON.stringify(err.details, null, 2) : undefined;
    toast.error(msg, { description: details });
}

export function getRoutinePlaceholders(lang: "es" | "en") {
    if (lang === "es") {
        return {
            sessionType: "Ej. Pull Power",
            focus: "Ej. Espalda + bíceps",
            tags: "power, hypertrophy",
            notes: "Notas del día…",
            exNotes: "Opcional…",
            sets: "3",
            reps: "8-10",
            load: "kg / RPE",
        };
    }
    return {
        sessionType: "e.g. Pull Power",
        focus: "e.g. Back + biceps",
        tags: "power, hypertrophy",
        notes: "Day notes…",
        exNotes: "Optional…",
        sets: "3",
        reps: "8-10",
        load: "kg / RPE",
    };
}

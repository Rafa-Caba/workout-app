// src/utils/dayNotes.ts
// Strongly typed helpers for structured notes stored in WorkoutDay.meta.dayNotes.

import type {
    WorkoutDayMeta,
    WorkoutDayNote,
    WorkoutDayNoteDraft,
    WorkoutDayNoteType,
} from "@/types/workoutDay.types";

type JsonRecord = Record<string, unknown>;

export type DayNoteTypeOption = {
    value: WorkoutDayNoteType;
    emoji: string;
    label: {
        es: string;
        en: string;
    };
};

export const DAY_NOTE_TYPE_OPTIONS: readonly DayNoteTypeOption[] = [
    { value: "birthday", emoji: "🎁", label: { es: "Cumpleaños", en: "Birthday" } },
    { value: "appointment", emoji: "📅", label: { es: "Cita", en: "Appointment" } },
    { value: "reminder", emoji: "🔔", label: { es: "Recordatorio", en: "Reminder" } },
    { value: "health", emoji: "🩺", label: { es: "Salud", en: "Health" } },
    { value: "personal", emoji: "📝", label: { es: "Personal", en: "Personal" } },
    { value: "other", emoji: "📌", label: { es: "Otro", en: "Other" } },
] as const;

function isRecord(value: unknown): value is JsonRecord {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cleanString(value: unknown): string | null {
    if (typeof value !== "string") return null;

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}

function isWorkoutDayNoteType(value: unknown): value is WorkoutDayNoteType {
    return DAY_NOTE_TYPE_OPTIONS.some((option) => option.value === value);
}

function normalizeWorkoutDayNote(value: unknown): WorkoutDayNote | null {
    if (!isRecord(value)) return null;

    const id = cleanString(value.id);
    const title = cleanString(value.title);
    const type = value.type;
    const createdAt = cleanString(value.createdAt);
    const updatedAt = cleanString(value.updatedAt);

    if (!id || !title || !isWorkoutDayNoteType(type) || !createdAt || !updatedAt) {
        return null;
    }

    return {
        id,
        type,
        title,
        description: cleanString(value.description),
        createdAt,
        updatedAt,
    };
}

export function getWorkoutDayNotes(meta: WorkoutDayMeta | undefined): WorkoutDayNote[] {
    if (!isRecord(meta)) return [];

    const rawNotes = meta.dayNotes;
    if (!Array.isArray(rawNotes)) return [];

    return rawNotes
        .map((note) => normalizeWorkoutDayNote(note))
        .filter((note): note is WorkoutDayNote => note !== null);
}

export function getDayNoteTypeOption(type: WorkoutDayNoteType): DayNoteTypeOption {
    return DAY_NOTE_TYPE_OPTIONS.find((option) => option.value === type) ?? DAY_NOTE_TYPE_OPTIONS[5];
}

function createNoteId(): string {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }

    return `day_note_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function createWorkoutDayNote(draft: WorkoutDayNoteDraft): WorkoutDayNote {
    const now = new Date().toISOString();

    return {
        id: createNoteId(),
        type: draft.type,
        title: draft.title.trim(),
        description: draft.description?.trim() || null,
        createdAt: now,
        updatedAt: now,
    };
}

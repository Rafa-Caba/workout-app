// src/utils/routines/jsonIds.ts
// Utilities for normalizing routine JSON payloads before saving.
// Ensures exercises pasted through JSON editors receive stable ids.

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

function makeId(): string {
    if (globalThis.crypto?.randomUUID) {
        return globalThis.crypto.randomUUID();
    }

    return `ex_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeExerciseRecord(value: Record<string, unknown>): Record<string, unknown> {
    const rawId = value.id;
    const id = typeof rawId === "string" && rawId.trim().length > 0 ? rawId.trim() : makeId();

    const rawAttachmentIds = value.attachmentPublicIds;
    const attachmentPublicIds = Array.isArray(rawAttachmentIds)
        ? rawAttachmentIds.filter((item): item is string => typeof item === "string")
        : rawAttachmentIds === undefined
            ? []
            : rawAttachmentIds;

    return {
        ...value,
        id,
        attachmentPublicIds,
    };
}

function normalizeValue(value: unknown, keyHint?: string): unknown {
    if (Array.isArray(value)) {
        if (keyHint === "exercises") {
            return value.map((item) => (isRecord(item) ? normalizeExerciseRecord(item) : item));
        }

        return value.map((item) => normalizeValue(item));
    }

    if (!isRecord(value)) {
        return value;
    }

    const next: Record<string, unknown> = {};

    for (const [key, child] of Object.entries(value)) {
        next[key] = normalizeValue(child, key);
    }

    return next;
}

export function normalizeRoutineJsonExerciseIds<T>(value: T): T {
    return normalizeValue(value) as T;
}

export type { JsonValue };

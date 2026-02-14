import { api } from "@/api/axios";
import type { RoutineUpsertBody } from "@/utils/routines/putBody";

export type DayKey = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

export type RoutineWeek = {
    id: string;
    weekKey: string;

    status?: "active" | "archived";
    title?: string | null;
    split?: string | null;
    plannedDays?: DayKey[] | null;

    attachments?: unknown[] | null;
    days?: unknown[] | null;

    meta?: Record<string, unknown> | null;

    createdAt?: string;
    updatedAt?: string;
};

export async function getRoutineWeek(weekKey: string): Promise<RoutineWeek | null> {
    const res = await api.get(`/workout/routines/weeks/${encodeURIComponent(weekKey)}`);
    return (res.data ?? null) as RoutineWeek | null;
}

export async function initRoutineWeek(
    weekKey: string,
    args?: { title?: string; split?: string; unarchive?: boolean }
): Promise<RoutineWeek> {
    // ✅ backend validates QUERY, not body
    const res = await api.post(
        `/workout/routines/weeks/${encodeURIComponent(weekKey)}/init`,
        null,
        { params: args ?? {} }
    );
    return res.data as RoutineWeek;
}

export async function updateRoutineWeek(weekKey: string, payload: unknown): Promise<RoutineWeek> {
    const res = await api.put(`/workout/routines/weeks/${encodeURIComponent(weekKey)}`, payload);
    return res.data as RoutineWeek;
}

export async function setRoutineArchived(weekKey: string, archived: boolean): Promise<RoutineWeek> {
    // ✅ backend route is /archive and expects query param "archived"
    const res = await api.patch(
        `/workout/routines/weeks/${encodeURIComponent(weekKey)}/archive`,
        null,
        { params: { archived } }
    );
    return res.data as RoutineWeek;
}

/**
 * Converts RoutineWeek -> editable upsert body (UI helper)
 * Fully typed for autocomplete + no `any`.
 */
export function toRoutineUpsertBody(routine: RoutineWeek): RoutineUpsertBody {
    return {
        title: routine.title ?? null,
        split: routine.split ?? null,
        plannedDays: routine.plannedDays ?? null,
        meta: routine.meta ?? null,
    };
}

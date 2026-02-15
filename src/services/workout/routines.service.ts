import { api } from "@/api/axios";
import type { RoutineUpsertBody } from "@/utils/routines/putBody";
import type { WorkoutRoutineWeek, WorkoutRoutineStatus, WorkoutRoutineWeekSummary } from "@/types/workoutRoutine.types";

export async function getRoutineWeek(weekKey: string): Promise<WorkoutRoutineWeek | null> {
    const res = await api.get(`/workout/routines/weeks/${encodeURIComponent(weekKey)}`);
    return (res.data ?? null) as WorkoutRoutineWeek | null;
}

export async function initRoutineWeek(
    weekKey: string,
    args?: { title?: string; split?: string; unarchive?: boolean }
): Promise<WorkoutRoutineWeek> {
    // backend validates QUERY, not body
    const res = await api.post(`/workout/routines/weeks/${encodeURIComponent(weekKey)}/init`, null, {
        params: args ?? {},
    });
    return res.data as WorkoutRoutineWeek;
}

export async function updateRoutineWeek(weekKey: string, payload: unknown): Promise<WorkoutRoutineWeek> {
    const res = await api.put(`/workout/routines/weeks/${encodeURIComponent(weekKey)}`, payload);
    return res.data as WorkoutRoutineWeek;
}

export async function setRoutineArchived(weekKey: string, archived: boolean): Promise<WorkoutRoutineWeek> {
    const res = await api.patch(`/workout/routines/weeks/${encodeURIComponent(weekKey)}/archive`, null, {
        params: { archived },
    });
    return res.data as WorkoutRoutineWeek;
}

/**
 * Converts RoutineWeek -> editable upsert body (UI helper)
 * Fully typed for autocomplete + no `any`.
 */
export function toRoutineUpsertBody(routine: WorkoutRoutineWeek): RoutineUpsertBody {
    return {
        title: routine.title ?? null,
        split: routine.split ?? null,
        plannedDays: routine.plannedDays ?? null,
        meta: routine.meta ?? null,
    };
}

export function toStatusLabel(status: WorkoutRoutineStatus, lang: string): string {
    if (lang === "es") return status === "archived" ? "Archivada" : "Activa";
    return status === "archived" ? "Archived" : "Active";
}

export async function listRoutineWeeks(status?: WorkoutRoutineStatus): Promise<WorkoutRoutineWeekSummary[]> {
    const res = await api.get(`/workout/routines/weeks`, {
        params: status ? { status, limit: 30 } : { limit: 30 },
    });
    return (res.data ?? []) as WorkoutRoutineWeekSummary[];
}
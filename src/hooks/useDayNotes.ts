// src/hooks/useDayNotes.ts
// Creates, updates, and deletes structured notes in WorkoutDay.meta.dayNotes.

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { ApiError } from "@/api/httpErrors";
import {
    getWorkoutDayServ,
    upsertWorkoutDay,
} from "@/services/workout/days.service";
import type {
    WorkoutDay,
    WorkoutDayNote,
    WorkoutDayNoteDraft,
} from "@/types/workoutDay.types";
import {
    createWorkoutDayNote,
    getWorkoutDayNotes,
} from "@/utils/dayNotes";

type AddDayNoteArgs = {
    date: string;
    draft: WorkoutDayNoteDraft;
};

type UpdateDayNoteArgs = {
    date: string;
    noteId: string;
    draft: WorkoutDayNoteDraft;
};

type DeleteDayNoteArgs = {
    date: string;
    noteId: string;
};

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readStatus(error: unknown): number | null {
    if (!isRecord(error)) return null;

    if (typeof error.status === "number") return error.status;

    const response = error.response;
    if (!isRecord(response)) return null;

    return typeof response.status === "number" ? response.status : null;
}

async function readExistingDay(date: string): Promise<WorkoutDay | null> {
    try {
        return await getWorkoutDayServ(date);
    } catch (error: unknown) {
        if (readStatus(error) === 404) return null;
        throw error;
    }
}

async function saveDayNotes(date: string, notes: readonly WorkoutDayNote[]): Promise<WorkoutDay> {
    return upsertWorkoutDay(
        date,
        {
            meta: {
                dayNotes: [...notes],
            },
        },
        "merge",
    );
}

function useInvalidateDayNoteQueries() {
    const queryClient = useQueryClient();

    return React.useCallback(
        (day: WorkoutDay, date: string): void => {
            queryClient.setQueryData(["workoutDay", date], day);
            queryClient.invalidateQueries({ queryKey: ["daySummary", date] });
            queryClient.invalidateQueries({ queryKey: ["workoutCalendar"] });
            queryClient.invalidateQueries({ queryKey: ["workoutWeekView"] });
        },
        [queryClient],
    );
}

export function useAddDayNote() {
    const invalidateDayNoteQueries = useInvalidateDayNoteQueries();

    return useMutation<WorkoutDay, ApiError, AddDayNoteArgs>({
        mutationFn: async ({ date, draft }) => {
            const existingDay = await readExistingDay(date);
            const existingNotes = getWorkoutDayNotes(existingDay?.meta);
            const nextNote = createWorkoutDayNote(draft);

            return saveDayNotes(date, [...existingNotes, nextNote]);
        },
        onSuccess: (day, variables) => {
            invalidateDayNoteQueries(day, variables.date);
        },
    });
}

export function useUpdateDayNote() {
    const invalidateDayNoteQueries = useInvalidateDayNoteQueries();

    return useMutation<WorkoutDay, ApiError, UpdateDayNoteArgs>({
        mutationFn: async ({ date, noteId, draft }) => {
            const existingDay = await readExistingDay(date);
            const existingNotes = getWorkoutDayNotes(existingDay?.meta);
            const now = new Date().toISOString();
            let noteFound = false;

            const nextNotes = existingNotes.map((note) => {
                if (note.id !== noteId) return note;

                noteFound = true;

                return {
                    ...note,
                    type: draft.type,
                    title: draft.title.trim(),
                    description: draft.description?.trim() || null,
                    updatedAt: now,
                };
            });

            if (!noteFound) {
                throw new Error("Workout day note not found");
            }

            return saveDayNotes(date, nextNotes);
        },
        onSuccess: (day, variables) => {
            invalidateDayNoteQueries(day, variables.date);
        },
    });
}

export function useDeleteDayNote() {
    const invalidateDayNoteQueries = useInvalidateDayNoteQueries();

    return useMutation<WorkoutDay, ApiError, DeleteDayNoteArgs>({
        mutationFn: async ({ date, noteId }) => {
            const existingDay = await readExistingDay(date);
            const existingNotes = getWorkoutDayNotes(existingDay?.meta);
            const nextNotes = existingNotes.filter((note) => note.id !== noteId);

            if (nextNotes.length === existingNotes.length) {
                throw new Error("Workout day note not found");
            }

            return saveDayNotes(date, nextNotes);
        },
        onSuccess: (day, variables) => {
            invalidateDayNoteQueries(day, variables.date);
        },
    });
}

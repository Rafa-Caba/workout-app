// src/hooks/useDayNotes.ts
// Adds structured notes to WorkoutDay.meta.dayNotes without replacing other day metadata.

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { ApiError } from "@/api/httpErrors";
import {
    getWorkoutDayServ,
    upsertWorkoutDay,
} from "@/services/workout/days.service";
import type {
    WorkoutDay,
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

export function useAddDayNote() {
    const queryClient = useQueryClient();

    return useMutation<WorkoutDay, ApiError, AddDayNoteArgs>({
        mutationFn: async ({ date, draft }) => {
            const existingDay = await readExistingDay(date);
            const existingNotes = getWorkoutDayNotes(existingDay?.meta);
            const nextNote = createWorkoutDayNote(draft);

            return upsertWorkoutDay(
                date,
                {
                    meta: {
                        dayNotes: [...existingNotes, nextNote],
                    },
                },
                "merge",
            );
        },
        onSuccess: (day, variables) => {
            queryClient.setQueryData(["workoutDay", variables.date], day);
            queryClient.invalidateQueries({ queryKey: ["daySummary", variables.date] });
            queryClient.invalidateQueries({ queryKey: ["workoutCalendar"] });
            queryClient.invalidateQueries({ queryKey: ["workoutWeekView"] });
        },
    });
}

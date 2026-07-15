// src/services/workout/calendar.service.ts
// Typed monthly/range calendar reader for WorkoutDay summaries and metadata.

import { api } from "@/api/axios";
import type { CalendarViewResponse, ISODate } from "@/types/workoutDay.types";

export type GetWorkoutCalendarArgs = {
    from: ISODate;
    to: ISODate;
    fields?: string[] | null;
    fillMissingDays?: boolean;
    includeRollups?: boolean;
    includeSleep?: boolean;
    includeTraining?: boolean;
    includeSummaries?: boolean;
    includeTotals?: boolean;
    includeTypes?: boolean;
    includeRaw?: boolean;
};

function buildCalendarParams(args: GetWorkoutCalendarArgs): Record<string, unknown> {
    const params: Record<string, unknown> = {
        from: args.from,
        to: args.to,
    };

    if (args.fields !== undefined) params.fields = args.fields;
    if (args.fillMissingDays !== undefined) params.fillMissingDays = args.fillMissingDays;
    if (args.includeRollups !== undefined) params.includeRollups = args.includeRollups;
    if (args.includeSleep !== undefined) params.includeSleep = args.includeSleep;
    if (args.includeTraining !== undefined) params.includeTraining = args.includeTraining;
    if (args.includeSummaries !== undefined) params.includeSummaries = args.includeSummaries;
    if (args.includeTotals !== undefined) params.includeTotals = args.includeTotals;
    if (args.includeTypes !== undefined) params.includeTypes = args.includeTypes;
    if (args.includeRaw !== undefined) params.includeRaw = args.includeRaw;

    return params;
}

export async function getWorkoutCalendar(args: GetWorkoutCalendarArgs): Promise<CalendarViewResponse> {
    const response = await api.get("/workout/calendar", {
        params: buildCalendarParams(args),
    });

    return response.data as CalendarViewResponse;
}

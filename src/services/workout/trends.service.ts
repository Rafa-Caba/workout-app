import { api } from "@/api/axios";
import type { WeeksTrendResponse, WeekKey } from "@/types/workoutSummary.types";

export async function getWeeklyTrends(fromWeek: WeekKey, toWeek: WeekKey): Promise<WeeksTrendResponse> {
    const res = await api.get(`/workout/trends/weeks`, { params: { fromWeek, toWeek } });
    return res.data as WeeksTrendResponse;
}

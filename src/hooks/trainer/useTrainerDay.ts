import { useQuery } from "@tanstack/react-query";
import type { ApiError } from "@/api/httpErrors";
import type { ISODate } from "@/types/workoutDay.types";
import type { GetTraineeDayResponse } from "@/types/trainer.types";
import { getTraineeDay } from "@/services/workout/trainer.service";

export function useTrainerDay(args: { traineeId: string; date: ISODate }) {
    const enabled = Boolean(args?.traineeId) && Boolean(args?.date);

    return useQuery<GetTraineeDayResponse, ApiError>({
        queryKey: ["trainer", "day", args.traineeId, args.date],
        queryFn: () => getTraineeDay(args.traineeId, args.date),
        enabled,
        staleTime: 15_000,
    });
}
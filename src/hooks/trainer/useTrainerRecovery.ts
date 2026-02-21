import { useQuery } from "@tanstack/react-query";
import type { ApiError } from "@/api/httpErrors";
import type { ISODate } from "@/types/workoutDay.types";
import type { GetTraineeRecoveryResponse } from "@/types/trainer.types";
import { getTraineeRecovery } from "@/services/workout/trainer.service";

export function useTrainerRecovery(args: { traineeId: string; from: ISODate; to: ISODate }) {
    const enabled = Boolean(args?.traineeId) && Boolean(args?.from) && Boolean(args?.to);

    return useQuery<GetTraineeRecoveryResponse, ApiError>({
        queryKey: ["trainer", "recovery", args.traineeId, args.from, args.to],
        queryFn: () => getTraineeRecovery(args.traineeId, args.from, args.to),
        enabled,
        staleTime: 30_000,
    });
}
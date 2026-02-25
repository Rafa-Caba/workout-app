import { useQuery } from "@tanstack/react-query";
import type { ApiError } from "@/api/httpErrors";
import type { GetTraineeCoachProfileResponse } from "@/types/trainerCoachProfile.types";
import { getTraineeCoachProfile } from "@/services/workout/trainer.service";

export function useTrainerCoachProfile(args: { traineeId: string }) {
    const enabled = Boolean(args?.traineeId);

    return useQuery<GetTraineeCoachProfileResponse, ApiError>({
        queryKey: ["trainer", "coachProfile", args.traineeId],
        queryFn: () => getTraineeCoachProfile(args.traineeId),
        enabled,
        staleTime: 30_000,
    });
}
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ApiError } from "@/api/httpErrors";
import type {
    UpsertTraineeCoachProfileBody,
    UpsertTraineeCoachProfileResponse,
} from "@/types/trainerCoachProfile.types";
import { upsertTraineeCoachProfile } from "@/services/workout/trainer.service";

export function useUpsertTrainerCoachProfile() {
    const qc = useQueryClient();

    return useMutation<
        UpsertTraineeCoachProfileResponse,
        ApiError,
        { traineeId: string; body: UpsertTraineeCoachProfileBody }
    >({
        mutationFn: ({ traineeId, body }) => upsertTraineeCoachProfile(traineeId, body),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: ["trainer", "coachProfile", vars.traineeId] });
        },
    });
}
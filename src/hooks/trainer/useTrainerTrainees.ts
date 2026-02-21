import { useQuery } from "@tanstack/react-query";
import type { ApiError } from "@/api/httpErrors";
import type { PublicUser } from "@/types/auth.types";
import { listTrainees } from "@/services/workout/trainer.service";

export function useTrainerTrainees() {
    return useQuery<PublicUser[], ApiError>({
        queryKey: ["trainer", "trainees"],
        queryFn: () => listTrainees(),
        staleTime: 30_000,
    });
}
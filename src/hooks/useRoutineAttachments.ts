import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ApiError } from "@/api/httpErrors";
import { deleteRoutineAttachment, uploadRoutineAttachments } from "@/services/workout/routineAttachments.service";
import { WorkoutRoutineWeek } from "@/types/workoutRoutine.types";

function unwrapRoutineWeek(maybe: unknown): WorkoutRoutineWeek | null {
    if (!maybe || typeof maybe !== "object") return null;
    const rec = maybe as Record<string, unknown>;
    if (rec && rec.routine && typeof rec.routine === "object") return rec.routine as WorkoutRoutineWeek;
    if (rec && ("weekKey" in rec) && ("days" in rec)) return rec as WorkoutRoutineWeek;
    return null;
}

export function useUploadRoutineAttachments(weekKey: string) {
    const qc = useQueryClient();

    return useMutation<
        unknown,
        ApiError,
        { files: File[]; query?: Record<string, string | number | boolean | undefined | null> }
    >({
        mutationFn: ({ files, query }) => uploadRoutineAttachments(weekKey, files, query),
        onSuccess: (data) => {
            const routine = unwrapRoutineWeek(data);
            if (routine) qc.setQueryData(["routineWeek", weekKey], routine);
            qc.invalidateQueries({ queryKey: ["routineWeek", weekKey] });
            qc.invalidateQueries({ queryKey: ["planVsActual", weekKey] });
        },
    });
}

export function useDeleteRoutineAttachment(weekKey: string) {
    const qc = useQueryClient();

    return useMutation<unknown, ApiError, { publicId: string; deleteCloudinary?: boolean }>({
        mutationFn: ({ publicId, deleteCloudinary }) => deleteRoutineAttachment(weekKey, { publicId, deleteCloudinary }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["routineWeek", weekKey] });
            qc.invalidateQueries({ queryKey: ["planVsActual", weekKey] });
        },
    });
}

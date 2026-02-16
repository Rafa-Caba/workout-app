import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ApiError } from "@/api/httpErrors";
import type {
    Movement,
    MovementsListQuery,
} from "@/types/movements.types";
import {
    listMovements,
    getMovementById,
    createMovement,
    updateMovement,
    deleteMovement,
} from "@/services/workout/movements.service";

// -------------------- Query Keys --------------------

function movementsKey(query?: MovementsListQuery) {
    const q = (query?.q ?? "").trim() || null;
    const activeOnly = query?.activeOnly === true ? true : null;
    return ["movements", { q, activeOnly }] as const;
}

function movementKey(id: string) {
    return ["movement", id] as const;
}

// -------------------- Queries --------------------

export function useMovements(query?: MovementsListQuery) {
    return useQuery<Movement[], ApiError>({
        queryKey: movementsKey(query),
        queryFn: () => listMovements(query),
        staleTime: 30_000,
    });
}

export function useMovementById(id: string | null | undefined) {
    return useQuery<Movement, ApiError>({
        queryKey: movementKey(String(id ?? "")),
        queryFn: () => getMovementById(String(id)),
        enabled: Boolean(id),
        staleTime: 30_000,
    });
}

// -------------------- Mutations --------------------

// ⬇️ ahora el payload de la mutación es FormData
export function useCreateMovement(queryToRefresh?: MovementsListQuery) {
    const qc = useQueryClient();

    return useMutation<Movement, ApiError, FormData>({
        mutationFn: (formData) => createMovement(formData),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: movementsKey(queryToRefresh) });
            qc.invalidateQueries({ queryKey: ["movements"] }); // broad safety net
        },
    });
}

// ⬇️ update recibe { id, formData }
export function useUpdateMovement(queryToRefresh?: MovementsListQuery) {
    const qc = useQueryClient();

    return useMutation<Movement, ApiError, { id: string; formData: FormData }>({
        mutationFn: ({ id, formData }) => updateMovement(id, formData),
        onSuccess: (updated) => {
            qc.setQueryData(movementKey(updated.id), updated);
            qc.invalidateQueries({ queryKey: movementsKey(queryToRefresh) });
            qc.invalidateQueries({ queryKey: ["movements"] });
        },
    });
}

export function useDeleteMovement(queryToRefresh?: MovementsListQuery) {
    const qc = useQueryClient();

    return useMutation<{ deleted: true; movement: Movement }, ApiError, { id: string }>({
        mutationFn: ({ id }) => deleteMovement(id),
        onSuccess: (_data, vars) => {
            qc.removeQueries({ queryKey: movementKey(vars.id) });
            qc.invalidateQueries({ queryKey: movementsKey(queryToRefresh) });
            qc.invalidateQueries({ queryKey: ["movements"] });
        },
    });
}

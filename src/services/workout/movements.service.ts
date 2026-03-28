// /src/services/workout/movements.service.ts

import { api } from "@/api/axios";
import type {
    Movement,
    MovementDeletedResponse,
    MovementListResponse,
    MovementsListQuery,
} from "@/types/movements.types";

/**
 * List movements.
 */
export async function listMovements(query?: MovementsListQuery): Promise<Movement[]> {
    const response = await api.get<MovementListResponse>("/movements", {
        params: query ?? {},
    });

    return response.data.movements;
}

/**
 * Get a single movement by id.
 */
export async function getMovementById(id: string): Promise<Movement> {
    const response = await api.get<Movement>(`/movements/${encodeURIComponent(id)}`);
    return response.data;
}

/**
 * Create movement with multipart/form-data.
 *
 * The caller must build the FormData in the component/form layer.
 */
export async function createMovement(formData: FormData): Promise<Movement> {
    const response = await api.post<Movement>("/movements", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });

    return response.data;
}

/**
 * Update movement with multipart/form-data.
 */
export async function updateMovement(id: string, formData: FormData): Promise<Movement> {
    const response = await api.put<Movement>(`/movements/${encodeURIComponent(id)}`, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });

    return response.data;
}

/**
 * Delete movement.
 */
export async function deleteMovement(id: string): Promise<MovementDeletedResponse> {
    const response = await api.delete<MovementDeletedResponse>(`/movements/${encodeURIComponent(id)}`);
    return response.data;
}
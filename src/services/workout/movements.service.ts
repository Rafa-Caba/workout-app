import { api } from "@/api/axios";
import type {
    Movement,
    MovementsListQuery,
} from "@/types/movements.types";

/**
 * List movements (json, sin cambios).
 */
export async function listMovements(query?: MovementsListQuery): Promise<Movement[]> {
    const res = await api.get(`/movements`, {
        params: query ?? {},
    });

    // BE returns: { movements }
    return (res.data?.movements ?? []) as Movement[];
}

/**
 * Get single movement (json, sin cambios).
 */
export async function getMovementById(id: string): Promise<Movement> {
    const res = await api.get(`/movements/${encodeURIComponent(id)}`);
    return res.data as Movement;
}

/**
 * Create movement with multipart/form-data.
 * Espera que el caller ya haya construido el FormData
 * (name, muscleGroup, equipment, isActive, media, etc.).
 */
export async function createMovement(formData: FormData): Promise<Movement> {
    const res = await api.post(`/movements`, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    return res.data as Movement;
}

/**
 * Update movement with multipart/form-data.
 * Igual que create, pero con PUT y el id en la ruta.
 */
export async function updateMovement(id: string, formData: FormData): Promise<Movement> {
    const res = await api.put(`/movements/${encodeURIComponent(id)}`, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    return res.data as Movement;
}

/**
 * Delete movement (json, sin cambios).
 */
export async function deleteMovement(id: string): Promise<{ deleted: true; movement: Movement }> {
    const res = await api.delete(`/movements/${encodeURIComponent(id)}`);
    return res.data as { deleted: true; movement: Movement };
}

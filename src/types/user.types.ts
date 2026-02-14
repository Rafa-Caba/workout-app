import type { AuthUser, Sex, Units } from "@/types/auth.types";

/**
 * =========================================================
 * User domain types (FE)
 * - We reuse AuthUser as the canonical user shape
 * - This file only adds update payloads for /users/me
 * =========================================================
 */

export type User = AuthUser;

export type ActivityGoal =
    | "fat_loss"
    | "hypertrophy"
    | "strength"
    | "maintenance"
    | "other"
    | null;

/**
 * PATCH /users/me payload
 * Keep it optional fields only (partial updates).
 *
 * IMPORTANT:
 * - Only include fields that the backend actually allows updating.
 * - If BE rejects unknown fields, this stays safe.
 */
export type UserProfileUpdateRequest = Partial<{
    name: string;
    sex: Sex;

    heightCm: number | null;
    currentWeightKg: number | null;

    units: Units | null;

    birthDate: string | null; // YYYY-MM-DD
    activityGoal: ActivityGoal;
    timezone: string | null;
}>;

/**
 * Small utility: sometimes UI edits only units.
 */
export type UserUnitsUpdate = {
    units: Units | null;
};

// src/services/workout/outdoor.service.ts

/**
 * Deprecated compatibility layer.
 * New code should import from src/services/workout/cardio.service.ts.
 */

import {
    buildCardioCreatePayload,
    buildCardioDayStats,
    buildCardioPatchPayload,
    buildCardioRangeSummary,
    buildIsoDateTime,
    buildRouteSummary,
    cleanString,
    createEmptyCardioFormValues,
    dedupeSessionsById,
    deriveDurationSeconds,
    filterCardioSessions,
    getCardioSessionsFromDay,
    getCanonicalCardioEnvironment,
    isCardioActivityType,
    isCardioEnvironment,
    mapCardioSessionToFormValues,
    parseNullableInt,
    parseNullableNumber,
    sortSessionsDesc,
} from "@/services/workout/cardio.service";

export {
    buildCardioCreatePayload,
    buildCardioDayStats,
    buildCardioPatchPayload,
    buildCardioRangeSummary,
    buildIsoDateTime,
    buildRouteSummary,
    cleanString,
    createEmptyCardioFormValues,
    dedupeSessionsById,
    deriveDurationSeconds,
    filterCardioSessions,
    getCardioSessionsFromDay,
    getCanonicalCardioEnvironment,
    isCardioActivityType,
    isCardioEnvironment,
    mapCardioSessionToFormValues,
    parseNullableInt,
    parseNullableNumber,
    sortSessionsDesc,
};

export const isOutdoorActivityType = isCardioActivityType;
export const createEmptyOutdoorFormValues = createEmptyCardioFormValues;
export const mapOutdoorSessionToFormValues = mapCardioSessionToFormValues;
export const buildOutdoorCreatePayload = buildCardioCreatePayload;
export const buildOutdoorPatchPayload = buildCardioPatchPayload;
export const getOutdoorSessionsFromDay = getCardioSessionsFromDay;
export const buildOutdoorDayStats = buildCardioDayStats;
export const buildOutdoorRangeSummary = buildCardioRangeSummary;

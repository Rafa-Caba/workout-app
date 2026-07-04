// src/types/outdoor.types.ts

/**
 * Deprecated compatibility exports.
 * New Web code should import from src/types/cardio.types.ts.
 */

import type {
    CardioActivityFilter,
    CardioDayStats,
    CardioEnvironmentFilter,
    CardioFormMode,
    CardioFormValues,
    CardioRangeSummary,
    CardioSessionListItem,
    CardioSupportedActivityType,
    CardioSupportedEnvironment,
} from "@/types/cardio.types";

export type OutdoorSupportedActivityType = CardioSupportedActivityType;
export type OutdoorSupportedEnvironment = CardioSupportedEnvironment;
export type OutdoorFormMode = CardioFormMode;
export type OutdoorFormValues = CardioFormValues;
export type OutdoorSessionListItem = CardioSessionListItem;
export type OutdoorDayStats = CardioDayStats;
export type OutdoorRangeSummary = CardioRangeSummary;
export type OutdoorEnvironmentFilter = CardioEnvironmentFilter;
export type OutdoorActivityFilter = CardioActivityFilter;

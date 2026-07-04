// src/hooks/useOutdoorDaySessions.ts

/**
 * Deprecated compatibility layer.
 * New code should import useCardioDaySessions from src/hooks/useCardioDaySessions.ts.
 */

import {
    useCardioDaySessions,
    type CardioDaySessionsResult,
} from "@/hooks/useCardioDaySessions";

export type OutdoorDaySessionsResult = CardioDaySessionsResult;
export const useOutdoorDaySessions = useCardioDaySessions;

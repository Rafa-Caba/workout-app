// src/components/sessionTypeOptions.ts
// Canonical session type options shared by web forms and selectors.
// Keep these aligned with RN so progress/session grouping stays consistent.

export const SESSION_TYPE_OPTIONS = [
    "Upper",
    "Lower",
    "Upper/Lower",
    "Push",
    "Pull",
    "Leg Day",
    "Upper Power",
    "Push Power",
    "Pull Power",
    "Upper Hypertrophy",
    "Lower Hypertrophy",
    "Full Body",
    "Hypertrophy",
    "Strength Training",
    "Walking",
    "Running",
] as const;

export type SessionTypeOption = (typeof SESSION_TYPE_OPTIONS)[number];
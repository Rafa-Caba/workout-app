import { toWeekKey, normalizeWeekKey } from "@/utils/weekKey";

export function defaultTrendsRange(today = new Date()): { fromWeek: string; toWeek: string } {
    const toWeek = toWeekKey(today);
    const fromDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 28);
    const fromWeek = toWeekKey(fromDate);
    return { fromWeek, toWeek };
}

export function sanitizeWeekKeyInput(value: string): string {
    // Allows user to type freely but normalizes when possible (YYYY-W##)
    return normalizeWeekKey(value.trim());
}

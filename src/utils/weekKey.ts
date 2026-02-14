import {
    addWeeks,
    endOfISOWeek,
    getISOWeek,
    getISOWeekYear,
    startOfISOWeek,
} from "date-fns";

/**
 * Backend contract uses week keys like: YYYY-W##
 * Example: 2026-W05
 */
export function toWeekKey(date: Date): string {
    const year = getISOWeekYear(date);
    const week = getISOWeek(date);
    const padded = String(week).padStart(2, "0");
    return `${year}-W${padded}`;
}

export function normalizeWeekKey(value: string): string {
    const m = /^(\d{4})-W(\d{2})$/.exec(value);
    if (!m) return value;
    const year = m[1];
    const week = m[2];
    return `${year}-W${week}`;
}

/**
 * Converts weekKey (YYYY-W##) to the start date (Monday) of that ISO week.
 * Algorithm:
 * - ISO week 1 is the week containing Jan 4.
 * - Find Monday of ISO week 1, then add (week-1) weeks.
 */
export function weekKeyToStartDate(weekKey: string): Date | null {
    const m = /^(\d{4})-W(\d{2})$/.exec(weekKey);
    if (!m) return null;

    const year = Number(m[1]);
    const week = Number(m[2]);

    if (!Number.isFinite(year) || !Number.isFinite(week) || week < 1 || week > 53) {
        return null;
    }

    const jan4 = new Date(year, 0, 4);
    const week1Start = startOfISOWeek(jan4);
    return addWeeks(week1Start, week - 1);
}

export function weekKeyToEndDate(weekKey: string): Date | null {
    const start = weekKeyToStartDate(weekKey);
    if (!start) return null;
    return endOfISOWeek(start);
}

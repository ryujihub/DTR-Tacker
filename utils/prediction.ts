import { addDays, format, getDaysInMonth, startOfMonth } from 'date-fns';
import { DailyRecord } from './storage';

export type DayStatus = 'done' | 'partial' | 'none';

/**
 * Determines the status of a single day based on its DTR record.
 * - done: all morning & afternoon slots are filled
 * - partial: at least one slot is filled
 * - none: no data
 */
export const getDayStatus = (record: DailyRecord | undefined): DayStatus => {
    if (!record) return 'none';
    const done =
        record.morningIn && record.morningOut &&
        record.afternoonIn && record.afternoonOut;
    if (done) return 'done';
    if (record.morningIn || record.morningOut || record.afternoonIn || record.afternoonOut ||
        record.overtimeIn || record.overtimeOut) return 'partial';
    return 'none';
};

/**
 * Calculates the average logged hours per day that has any entry.
 */
export const getAverageDailyHours = (records: DailyRecord[]): number => {
    const withHours = records.filter(r => r.totalHours > 0);
    if (withHours.length === 0) return 0;
    const total = withHours.reduce((sum, r) => sum + r.totalHours, 0);
    return total / withHours.length;
};

/**
 * Total hours logged across all records.
 */
export const getTotalHours = (records: DailyRecord[]): number => {
    return records.reduce((sum, r) => sum + r.totalHours, 0);
};

/**
 * Returns the number of working days (Mon–Fri) between today and the target date.
 * Used internally to estimate how many days until completion.
 */
export const countWorkingDaysFromToday = (targetDate: Date): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let count = 0;
    let cursor = new Date(today);
    while (cursor <= targetDate) {
        const dow = cursor.getDay();
        if (dow !== 0 && dow !== 6) count++;
        cursor = addDays(cursor, 1);
    }
    return count;
};

/**
 * Predicts the OJT completion date.
 * @returns a Date if computable, or null
 */
export const predictCompletionDate = (
    records: DailyRecord[],
    goalHours: number
): Date | null => {
    const totalLogged = getTotalHours(records);
    const remaining = goalHours - totalLogged;
    if (remaining <= 0) return new Date(); // already done

    const avg = getAverageDailyHours(records);
    if (avg <= 0) return null; // no data yet

    const daysNeeded = Math.ceil(remaining / avg);

    // Walk forward from today, skipping weekends
    let cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    let workDaysLeft = daysNeeded;

    while (workDaysLeft > 0) {
        cursor = addDays(cursor, 1);
        const dow = cursor.getDay();
        if (dow !== 0 && dow !== 6) workDaysLeft--;
    }

    return cursor;
};

/**
 * Returns a 6×7 matrix of dates (or null for padding) for a given month.
 * Row = week, Column = weekday (0=Sun…6=Sat)
 */
export const getMonthMatrix = (year: number, month: number): (Date | null)[][] => {
    const firstDay = startOfMonth(new Date(year, month, 1));
    const totalDays = getDaysInMonth(firstDay);
    const startDow = firstDay.getDay(); // 0=Sun

    const matrix: (Date | null)[][] = [];
    let dayCount = 1;
    let started = false;

    for (let row = 0; row < 6; row++) {
        const week: (Date | null)[] = [];
        for (let col = 0; col < 7; col++) {
            if (!started && col < startDow) {
                week.push(null);
            } else if (dayCount > totalDays) {
                week.push(null);
            } else {
                started = true;
                week.push(new Date(year, month, dayCount));
                dayCount++;
            }
        }
        matrix.push(week);
        if (dayCount > totalDays) break;
    }

    return matrix;
};

/**
 * Formats a Date to the same YYYY-MM-DD key used in DailyRecord.
 */
export const toDateKey = (d: Date): string => format(d, 'yyyy-MM-dd');

/**
 * Builds a lookup map from date string → DailyRecord for O(1) access.
 */
export const buildRecordMap = (records: DailyRecord[]): Map<string, DailyRecord> => {
    const map = new Map<string, DailyRecord>();
    records.forEach(r => map.set(r.date, r));
    return map;
};

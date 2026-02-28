import { differenceInMinutes, format, isSameDay, isValid, parseISO, subDays } from 'date-fns';

/**
 * Formats a date string or object to a human-friendly time.
 */
export const formatTime = (date: Date | string | null | undefined, use24Hour: boolean = true) => {
    if (!date) return '---';
    const d = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(d)) return '---';
    return format(d, use24Hour ? 'HH:mm' : 'hh:mm a');
};

/**
 * Formats a date to a full readable string (e.g., Monday, Jan 01, 2024).
 */
export const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(d)) return '---';
    return format(d, 'EEEE, MMM dd, yyyy');
};

/**
 * Returns a relative date string (Today, Yesterday, or formatted date).
 */
export const getRelativeDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    const today = new Date();
    const yesterday = subDays(today, 1);

    if (isSameDay(date, today)) return 'Today';
    if (isSameDay(date, yesterday)) return 'Yesterday';
    return format(date, 'MMM dd');
};

/**
 * Returns a time-based greeting (Morning, Afternoon, Evening).
 */
export const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
};

/**
 * Calculates minutes between two ISO strings.
 */
export const calculateMinutes = (start: string | null, end: string | null): number => {
    if (!start || !end) return 0;
    try {
        return differenceInMinutes(parseISO(end), parseISO(start));
    } catch (e) {
        return 0;
    }
};

/**
 * Formats minutes into a sleeker duration (e.g., 8h 30m).
 */
export const formatDurationFromMinutes = (minutes: number): string => {
    if (minutes <= 0) return '0h 0m';
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    return `${h}h ${m}m`;
};

/**
 * Calculates the total minutes for a DailyRecord object.
 */
export const calculateDailyTotalMinutes = (record: any): number => {
    let total = 0;
    // If a session has started but not ended, count minutes up to `now` so totals reflect ongoing work
    const nowIso = new Date().toISOString();
    total += calculateMinutes(record.morningIn, record.morningOut ?? nowIso);
    total += calculateMinutes(record.afternoonIn, record.afternoonOut ?? nowIso);
    total += calculateMinutes(record.overtimeIn, record.overtimeOut ?? nowIso);
    return total;
};

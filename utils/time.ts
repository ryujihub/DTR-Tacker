import { differenceInMinutes, format, isValid, parseISO } from 'date-fns';

export const formatTime = (date: Date | string | null | undefined) => {
    if (!date) return '---';
    const d = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(d)) return '---';
    return format(d, 'hh:mm a');
};

export const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, 'EEEE, MMM dd, yyyy');
};

export const calculateMinutes = (start: string | null, end: string | null): number => {
    if (!start || !end) return 0;
    return differenceInMinutes(parseISO(end), parseISO(start));
};

export const formatDurationFromMinutes = (minutes: number): string => {
    if (minutes <= 0) return '0h 0m';
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    return `${h}h ${m}m`;
};

export const calculateDailyTotalMinutes = (record: any): number => {
    let total = 0;
    total += calculateMinutes(record.morningIn, record.morningOut);
    total += calculateMinutes(record.afternoonIn, record.afternoonOut);
    total += calculateMinutes(record.overtimeIn, record.overtimeOut);
    return total;
};

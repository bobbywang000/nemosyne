import { Impression } from '../entity/Impression';

// Totally arbitrary - would use infinity (or negative infinity) for all the extreme values,
// but Typeorm doesn't like infinity. So we just choose arbitrarily large numbers.
const MIN_YEAR = '1000';
const MAX_YEAR = '3000';

export const getOffsetDate = (date: Date, offsetDays: number): Date => {
    const offsetDate = new Date(date);
    offsetDate.setDate(offsetDate.getDate() + offsetDays);
    return offsetDate;
};

export const dateToSqliteTimestamp = (date: Date): string => {
    return date.toISOString().replace('T', ' ').replace('Z', '');
};

export const startDateOrDefault = (start: string): string => {
    return dateToSqliteTimestamp(new Date(start || MIN_YEAR));
};

export const endDateOrDefault = (end: string): string => {
    return dateToSqliteTimestamp(new Date(end || MAX_YEAR));
};

export const formatRange = (start: Date, end: Date, impression: Impression): string => {
    let formattedDate;
    if (start.getTime() === end.getTime()) {
        formattedDate = formatShortDate(start);
    } else {
        // TODO: just give the title of the range here
        formattedDate = `${formatShortDate(start)} - ${formatShortDate(end)}`;
    }

    if (impression) {
        return `${formattedDate} (+${impression.positivity}/${impression.negativity})`;
    } else {
        return formattedDate;
    }
};

export const formatShortDate = (date: Date): string => {
    const options = {
        timeZone: 'Etc/UTC',
    };
    return date.toLocaleDateString('en-US', options);
};

export const dateToSlug = (date: Date): string => {
    return date.toISOString().split('T')[0];
};

export const parseDateOrDefault = (dateSlug: string): Date => {
    if (dateSlug) {
        return new Date(dateSlug);
    } else {
        return new Date(dateToSlug(new Date()));
    }
};

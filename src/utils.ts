export const getOffsetDate = (date: Date, offsetDays: number): Date => {
    const offsetDate = new Date(date);
    offsetDate.setDate(offsetDate.getDate() + offsetDays);
    return offsetDate;
};

export const isoToSqliteTimestamp = (isoTimestamp: string): string => {
    return isoTimestamp.replace('T', ' ').replace('Z', '');
};

export const dateToSqliteTimestamp = (date: Date): string => {
    return isoToSqliteTimestamp(date.toISOString());
};

export const arrayify = (input: any[] | any): any[] => {
    return Array.isArray(input) ? input : [input];
};

export const IMPRESSION_QUERY =
    'impression.negativity >= :negativityAbove' +
    ' AND impression.negativity <= :negativityBelow' +
    ' AND impression.positivity >= :positivityAbove' +
    ' AND impression.positivity <= :positivityBelow' +
    ' AND (impression.positivity + impression.negativity) >= :totalAbove' +
    ' AND (impression.positivity + impression.negativity) <= :totalBelow';

// Totally arbitrary - would use infinity (or negative infinity) for all the extreme values,
// but Typeorm doesn't like infinity. So we just choose arbitrarily large numbers.
const MIN_YEAR = '1000';
const MAX_YEAR = '3000';
const IMPRESSION_FILTER_DEFAULTS = {
    negativityAbove: -100,
    negativityBelow: 0,
    positivityAbove: 0,
    positivityBelow: 100,
    totalAbove: -100,
    totalBelow: 100,
};

export const startDateOrDefault = (start: string): string => {
    return dateToSqliteTimestamp(new Date(start || MIN_YEAR));
};

export const endDateOrDefault = (end: string): string => {
    return dateToSqliteTimestamp(new Date(end || MAX_YEAR));
};

export const getImpressionOpts = (query: any): Record<string, string> => {
    return Object.keys(IMPRESSION_FILTER_DEFAULTS).reduce((acc, requirement) => {
        acc[requirement] = parseImpressionOrDefault(
            query[requirement] as string,
            IMPRESSION_FILTER_DEFAULTS[requirement],
        );
        return acc;
    }, {});
};

const parseImpressionOrDefault = (input: string, defaultValue: number): number => {
    return input ? parseFloat(input) : defaultValue;
};

export const unique = (inputArr: any[]): any[] => {
    return inputArr.filter((value, index, array) => {
        return array.findIndex((other) => value.name == other.name) === index;
    });
};

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

export const getOffsetDate = (date: Date, offsetDays: number): Date => {
    const offsetDate = new Date(date);
    offsetDate.setDate(offsetDate.getDate() + offsetDays);
    return offsetDate;
};

export const IMPRESSION_QUERY =
    'impression.negativity >= :negativityAbove' +
    ' AND impression.negativity <= :negativityBelow' +
    ' AND impression.positivity >= :positivityAbove' +
    ' AND impression.positivity <= :positivityBelow' +
    ' AND (impression.positivity + impression.negativity) >= :totalAbove' +
    ' AND (impression.positivity + impression.negativity) <= :totalBelow';

// Totally arbitrary - would use infinity (or negative infinity) for all the extreme values,
// but Typeorm doesn't like infinity. So we just choose arbitrarily large numbers.
const IMPRESSION_FILTER_DEFAULTS = {
    negativityAbove: -100,
    negativityBelow: 0,
    positivityAbove: 0,
    positivityBelow: 100,
    totalAbove: -100,
    totalBelow: 100,
};

export const getImpressionOpts = (query: Record<string, unknown>): Record<string, string> => {
    return Object.keys(IMPRESSION_FILTER_DEFAULTS).reduce((acc, requirement) => {
        acc[requirement] = parseImpressionOrDefault(
            query[requirement] as string,
            IMPRESSION_FILTER_DEFAULTS[requirement],
        );
        return acc;
    }, {});
};

export const hasImpressionOpts = (query: Record<string, unknown>): boolean => {
    return Object.keys(IMPRESSION_FILTER_DEFAULTS).some((key) => query[key] as boolean);
};

const parseImpressionOrDefault = (input: string, defaultValue: number): number => {
    return input ? parseFloat(input) : defaultValue;
};

export const nullifyIfBlank = (input: string): string | null => {
    return input.length === 0 ? null : input;
};

export const toExecutableJSArray = (arr: unknown[]): string => {
    return `[${arr.join(',\n')}]`;
};

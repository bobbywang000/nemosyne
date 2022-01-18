export const nullifyIfBlank = (input: string): string | null => {
    return input.length === 0 ? null : input;
};

export const escapeArrayToExecutableJSArray = (arr: unknown[]): string => {
    return `[${arr.join(',\n')}]`;
};

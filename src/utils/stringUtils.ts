export const nullifyIfBlank = (input: string): string | null => {
    return input.length === 0 ? null : input;
};

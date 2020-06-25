export const arrayify = (input: any[] | any): any[] => {
    return Array.isArray(input) ? input : [input];
};

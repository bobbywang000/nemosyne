/* eslint-disable @typescript-eslint/no-explicit-any */
export const arrayify = (input: any[] | any): any[] => {
    return Array.isArray(input) ? input : [input];
};

export const splitArray = (array: any[], splitSize: number): any[] => {
    const splits = [];
    for (let i = 0; i < array.length; i += splitSize) {
        splits.push(array.slice(i, i + splitSize));
    }
    return splits;
};

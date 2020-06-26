export const arrayify = (input: any[] | any): any[] => {
    return Array.isArray(input) ? input : [input];
};

export const splitArray = (array: any[], splitSize: number) => {
    const splits = [];
    for (let i = 0; i < array.length; i += splitSize) {
        splits.push(array.slice(i, i + splitSize));
    }
    return splits;
};

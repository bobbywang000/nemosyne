export const arrayify = (input: any[] | any): any[] => {
    return Array.isArray(input) ? input : [input];
};

export const unique = (inputArr: any[]): any[] => {
    return inputArr.filter((value, index, array) => {
        return array.findIndex((other) => value.name == other.name) === index;
    });
};

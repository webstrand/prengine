declare global {
    var prengine: {
        [key: string]: new () => HTMLElement;
    };
}
export declare function kebabToSanitizedCamelCase(str: string): string;
export declare function camelToPascalCase(str: string): string;

declare global {
    var prengine: {
        [key: string]: new () => HTMLElement;
    };
}
export declare function install(closure?: {
    [key: string]: unknown;
}): void;
export declare function kebabToSanitizedCamelCase(str: string): string;
export declare function camelToPascalCase(str: string): string;

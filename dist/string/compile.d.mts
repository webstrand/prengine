declare global {
    interface FunctionConstructor {
        new (...args: string[]): Function;
        new <Param extends readonly unknown[], Ret>(...args: string[]): (...args: Param) => Ret;
    }
}
/**
 * Compile a string containing `{` and `}` delimited executable regions into a
 * callable function.
 *
 * @param str A template string to parse and compile.
 * @param signature A string or list of strings that compose together to create
 * the parameters list for the compiled function.
 * @param closure An object of key-value pairs to be injected into the compiled
 * function as part of its closure.
 * @param namespace Valid ECMAScript identifier, visible from user-templates,
 * that will be prefixed to all generated constants and variables.
 */
export declare function compile(str: string, signature?: undefined, closure?: {
    [key: string]: unknown;
}, namespace?: string): (() => string) | null;
export declare function compile<T extends readonly unknown[]>(str: string, signature: readonly [...T], closure?: {
    [key: string]: unknown;
}, namespace?: string): ((...args: {
    [P in keyof T]: unknown;
}) => string) | null;
export declare function compile<T extends readonly unknown[]>(str: string, signature: string | {
    [P in keyof T]: string;
}, closure?: {
    [key: string]: unknown;
}, namespace?: string): ((...args: T) => string) | null;
export declare function compile<T extends (...args: never) => string>(str: string, signature: string | {
    [P in keyof Parameters<T>]: string;
} & readonly string[], closure?: {
    [key: string]: unknown;
}, namespace?: string): T | null;
export declare function compile(str: string, signature?: string | readonly string[], closure?: {
    [key: string]: unknown;
}, namespace?: string): ((...args: never) => string) | null;

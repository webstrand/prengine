declare global {
    interface FunctionConstructor {
        new (...args: string[]): Function;
        new <Param extends readonly unknown[], Ret>(...args: string[]): (...args: Param) => Ret;
    }
}
/**
 * Walk the provided {@link archetype} tree and generate a function that will
 * execute all of the string templates found on it on another identical tree.
 *
 * @param archetype Read-only tree of DOM `Node`s to search for templates.
 * @param reference Valid ECMAScript identifier, visible from user-templates,
 * that points to the root of the instance tree.
 * @param signature A string or list of strings that compose together to create
 * the parameters list for the compiled function. If left undefined, defaults to
 * {@link reference}.
 * @param closure An object of key-value pairs to be injected into the compiled
 * function as part of its closure.
 * @param namespace Valid ECMAScript identifier, visible from user-templates,
 * that will be prefixed to all generated constants and variables.
 */
export declare function compile(archetype: Node, reference?: string, signature?: undefined, closure?: {
    [key: string]: unknown;
}, namespace?: string): ((reference: Node) => void) | null;
export declare function compile<T extends readonly unknown[]>(archetype: Node, reference: string | undefined, signature: readonly [...T], closure?: {
    [key: string]: unknown;
}, namespace?: string): ((...args: {
    [P in keyof T]: unknown;
}) => void) | null;
export declare function compile<T extends readonly unknown[]>(archetype: Node, reference: string | undefined, signature: string | {
    [P in keyof T]: string;
}, closure?: {
    [key: string]: unknown;
}, namespace?: string): ((...args: T) => string) | null;
export declare function compile<T extends (...args: never) => void>(archetype: Node, reference: string | undefined, signature: string | {
    [P in keyof Parameters<T>]: string;
} & readonly string[], closure?: {
    [key: string]: unknown;
}, namespace?: string): T | null;
export declare function compile(archetype: Node, reference?: string, signature?: string | readonly string[], closure?: {
    [key: string]: unknown;
}, namespace?: string): ((...args: never) => void) | null;
export declare type Diagnostic = {
    kind: "attr";
    selector: string;
    element: Element;
    attr: string;
    error: unknown;
} | {
    kind: "data";
    selector: string;
    characterData: CharacterData;
    error: unknown;
} | {
    kind: "engine";
    error: unknown;
};
export declare function diagnose(archetype: Node, reference?: string, signature?: string | readonly string[], closure?: {
    [key: string]: unknown;
} | null, namespace?: string): Diagnostic[] | null;

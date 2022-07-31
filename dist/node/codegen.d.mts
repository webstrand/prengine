/**
 * Walk the provided {@link archetype} tree and generate code that will execute
 * all of the string templates found on it on another identical tree.
 *
 * @param archetype Read-only tree of DOM `Node`s to search for templates.
 * @param reference Valid ECMAScript identifier or expression pointing to the
 * root of the instance tree.
 * @param mayAlias When `true` the generated code will generate an alias for the
 * {@link reference} if it is referenced multiple times. Useful when the
 * {@link reference} is a compound expression.
 * @param namespace Valid and unused ECMAScript identifier that will be prefixed
 * to all generated constants and variables. Must be usable without any suffix.
 * @returns ECMAScript
 */
export declare function codegen(archetype: Node, reference?: string, namespace?: string, mayAlias?: boolean, diagnostic?: (...args: [archetype: CharacterData, attr?: undefined] | [archetype: Element, attr: string]) => void): string | null;

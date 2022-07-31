import { codegen } from "./codegen.mjs";

declare global {
	interface FunctionConstructor {
		new(...args: string[]): Function;
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
export function compile(
	archetype: Node,
	reference?: string,
	signature?: undefined,
	closure?: { [key: string]: unknown },
	namespace?: string,
): ((reference: Node) => void) | null;

export function compile<T extends readonly unknown[]>(
	archetype: Node,
	reference: string | undefined,
	signature: readonly [...T],
	closure?: { [key: string]: unknown },
	namespace?: string,
): ((...args:  { [P in keyof T]: unknown }) => void) | null;

export function compile<T extends readonly unknown[]>(
	archetype: Node,
	reference: string | undefined,
	signature: string | { [P in keyof T]: string },
	closure?: { [key: string]: unknown },
	namespace?: string,
): ((...args: T) => string) | null;

export function compile<T extends (...args: never) => void>(
	archetype: Node,
	reference: string | undefined,
	signature: string | { [P in keyof Parameters<T>]: string } & readonly string[],
	closure?: { [key: string]: unknown },
	namespace?: string,
): T | null;

export function compile(
	archetype: Node,
	reference?: string,
	signature?: string | readonly string[],
	closure?: { [key: string]: unknown },
	namespace?: string,
): ((...args: never) => void) | null;

export function compile(
	archetype: Node,
	reference: string = "fragment",
	signature: string | readonly string[] = reference,
	closure: { [key: string]: unknown } | null = null,
	namespace: string = "_"
): ((...args: never) => void) | null {
	const body = codegen(archetype, reference, namespace, false);
	if(body === null) return null;

	const closureIdentifiers: string[] = [];
	const closureValues: unknown[] = [];
	for(let id in closure) {
		closureIdentifiers.push(id);
		closureValues.push(closure[id]);
	}

	const sig = typeof signature === "string" ? signature : signature.join(",");

	try {
		return closureValues.length === 0
			? new Function<[component: Node], void>(sig, "\"use strict\";"+body)
			: new Function<typeof closureValues, (...args: unknown[]) => void>(...closureIdentifiers, "\"use strict\";return function ("+sig+") {"+body+"}")(...closureValues);
	}
	catch(e: unknown) {
		if(e instanceof SyntaxError) {
			throw new Error("Failed to compile", { cause: e });
		}
		/* c8 ignore next */
		else { throw e }
	}
}

import { compile as stringCompile } from "../string/compile.mjs";

export type Diagnostic =
	| { kind: "attr", selector: string, element: Element, attr: string, error: unknown }
	| { kind: "data", selector: string, characterData: CharacterData, error: unknown }
	| { kind: "engine", error: unknown }

export function diagnose(
	archetype: Node,
	reference: string = "fragment",
	signature: string | readonly string[] = reference,
	closure: { [key: string]: unknown } | null = null,
	namespace: string = "_",
): Diagnostic[] | null {
	const errors: Diagnostic[] = [];
	const diagnosticClosure = { [reference]: null, ...closure };
	const body = codegen(archetype, reference, namespace, false, diagnostic);
	if(errors.length === 0 && body === null) return null;

	function diagnostic(...[node, attr]: [node: CharacterData, attr?: undefined] | [node: Element, attr: string])  {
		if(attr !== undefined) {
			const value = node.getAttribute(attr);
			/* c8 ignore start */
			if(value === null) return errors.push({
				kind: "engine",
				error: new Error("Attempted to compile null at" + selectorOf(node, archetype)),
			});
			/* c8 ignore end */
			try {
				stringCompile(value, signature, diagnosticClosure, namespace);
			}
			catch(e: unknown) {
				return errors.push({
					kind: "attr",
					selector: selectorOf(node, archetype),
					element: node,
					attr,
					error: e,
				});
			}
		}
		else {
			try {
				stringCompile(node.data, signature, diagnosticClosure, namespace);
			}
			catch(e: unknown) {
				return errors.push({
					kind: "data",
					selector: selectorOf(node, archetype),
					characterData: node,
					error: e,
				});
			}
		}
	}

	if(errors.length > 0) return errors;

	const closureIdentifiers: string[] = [];
	const closureValues: unknown[] = [];
	for(let id in closure) {
		closureIdentifiers.push(id);
		closureValues.push(closure[id]);
	}

	const sig = typeof signature === "string" ? signature : signature.join(",");

	try {
		closureValues.length === 0
			? new Function<[component: Node], void>(sig, "\"use strict\";"+body)
			: new Function<typeof closureValues, (...args: unknown[]) => void>(...closureIdentifiers, "\"use strict\";return function ("+sig+") {"+body+"}")(...closureValues);
	}
	catch(e: unknown) {
		errors.push({
			kind: "engine",
			error: e
		});
	}

	return errors;
}

function selectorOf(child: Node, root: Node) {
	let selector = "";
	let cursor = child;
	while(cursor !== root) {
		const parent = cursor.parentNode;
		if(parent === null) break;

		selector =  (
			cursor instanceof Element
				? cursor.tagName.toLowerCase() + ":nth-child(" + Array.prototype.indexOf.call(parent.children, cursor) + ")"
				: cursor.constructor.name + "[" + Array.prototype.indexOf.call(parent.childNodes, cursor) + "]"
		) + " > " + selector;

		cursor = parent;
	}

	return (
		cursor instanceof Element
			? cursor.tagName.toLowerCase() + ":root > " + selector
			: cursor.constructor.name + ":root > " + selector
	).slice(0, -3);
}

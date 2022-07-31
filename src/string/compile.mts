import { codegen } from "./codegen.mjs";

declare global {
	interface FunctionConstructor {
		new(...args: string[]): Function;
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
export function compile(
	str: string,
	signature?: undefined,
	closure?: { [key: string]: unknown },
	namespace?: string,
): (() => string) | null;

export function compile<T extends readonly unknown[]>(
	str: string,
	signature: readonly [...T],
	closure?: { [key: string]: unknown },
	namespace?: string,
): ((...args:  { [P in keyof T]: unknown }) => string) | null;

export function compile<T extends readonly unknown[]>(
	str: string,
	signature: string | { [P in keyof T]: string },
	closure?: { [key: string]: unknown },
	namespace?: string,
): ((...args: T) => string) | null;

export function compile<T extends (...args: never) => string>(
	str: string,
	signature: string | { [P in keyof Parameters<T>]: string } & readonly string[],
	closure?: { [key: string]: unknown },
	namespace?: string,
): T | null;

export function compile(
	str: string,
	signature?: string | readonly string[],
	closure?: { [key: string]: unknown },
	namespace?: string,
): ((...args: never) => string) | null;

export function compile(
	this: unknown,
	str: string,
	signature: string | readonly string[] = "",
	closure: { [key: string]: unknown } | null = null,
	namespace: string = "_",
): ((...args: never) => string)  | null{
	const code = codegen(str, namespace);
	if(code === null) return null;
	const { decl, expr } = code;

	const closureIdentifiers: string[] = [];
	const closureValues: unknown[] = [];
	for(let id in closure) {
		closureIdentifiers.push(id);
		closureValues.push(closure[id]);
	}

	const sig = typeof signature === "string" ? signature : signature.join(",");
	return closureValues.length === 0
		? new Function<any, string>(sig, "\"use strict\";"+decl+"return ("+expr+")")
		: new Function<typeof closureValues, (...args: unknown[]) => string>(...closureIdentifiers, "\"use strict\";return function ("+sig+") {"+decl+"return ("+expr+")}")(...closureValues);
}

import { openBraces, closeBraces, openParens, closeParens } from "./cache.mjs";
import { parse } from "./parse.mjs";

export function codegen(str: string, namespace: string = "_"): { decl: string, expr: string } | null {
	/**
	 * Declarations of inline functions generated from code substitutions in the
	 * template string.
	 */
	 let decl = "";

	/**
	 * An expression of all of the bare strings and calls to code substitution
	 * declaraions with a leading "+" that needs to be stripped.
	 */
	let concat = "";

	if(!parse(str, visitString, visitExpr)) return null;
	function visitString(string: string, offset: number) {
		concat += "+" + JSON.stringify(string);
	}
	function visitExpr(untrimmedExpr: string, offset: number) {
		const expr = untrimmedExpr.trim();
		if(expr.length === 0 || expr.includes("return") || expr[0] === ";" || expr[expr.length - 1] === ";") {
			// We wrap the code fragment in an appropriate number of braces, to
			// prevent escape.
			const nest = countClosingBraces(expr) + 1;
			const open = openBraces[nest] ??= "{".repeat(nest);
			const close = closeBraces[nest] ??= "}".repeat(nest);
			// We finally wrap with `label:if(true){ ... } else {break label}`
			// to make any innocent code that has unbalanced braces an error again.
			if(expr.includes("_ebiwl315yn9p4145wymd31rvej")) throw new Error("Expression must not contain escape token");
			decl += ","+namespace+offset+"=()=>"+open+"_ebiwl315yn9p4145wymd31rvej:if(true){"+expr+"}else{break _ebiwl315yn9p4145wymd31rvej}"+close;
		}
		else {
			// We wrap the code fragment in an appropriate number of
			// parentheses, to prevent escape.
			const nest = countClosingParens(expr) + 1;
			const open = openParens[nest] ??= "(".repeat(nest);
			const close = closeParens[nest] ??= ")".repeat(nest);
			decl += ","+namespace+offset+"=()=>"+open+expr+close;
		}
		concat += "+"+namespace+offset+"()";
	}

	return { decl: "const " + decl.slice(1) + ";", expr: concat.slice(1) };
}

/** @internal */
export function countClosingParens(str: string) {
	let count = 0;
	let lastCloseParen = -1;
	while((lastCloseParen = str.indexOf(")", lastCloseParen + 1)) !== -1) count++;
	return count;
}

/** @internal */
export function countClosingBraces(str: string) {
	let count = 0;
	let lastCloseBrace = -1;
	while((lastCloseBrace = str.indexOf("}", lastCloseBrace + 1)) !== -1) count++;
	return count;
}

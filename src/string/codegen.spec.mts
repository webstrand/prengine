import { codegen, countClosingBraces, countClosingParens } from "./codegen.mjs";

test("should not generate code for simple strings", () => {
	expect(codegen("", "fn")).toBeNull();
	expect(codegen("${ bar", "fn")).toBeNull();
	expect(codegen("{{  }", "fn")).toBeNull();
	expect(codegen("foo ${{ bar baz }", "fn")).toBeNull();
});

function concat({decl, expr}: { decl: string, expr: string }): string {
	return decl + expr;
}

test("should generate code", () => {
	expect(() => new Function("bar", concat(codegen("foo ${ bar } baz", "fn")!))).not.toThrow();
	expect(() => new Function("bar", concat(codegen("foo ${ bar } baz ${ bar + bar }", "fn")!))).not.toThrow();
	expect(() => new Function("bar", concat(codegen("foo ${ bar; } baz ${ bar + bar; }", "fn")!))).not.toThrow();
});

test("should generate code for empty expressions", () => {
	expect(() => new Function("bar", concat(codegen("foo ${}", "fn")!))).not.toThrow();
	expect(() => new Function("bar", concat(codegen("foo ${     }", "fn")!))).not.toThrow();
});

test("should throw on expressions containing escape tokens", () => {
	expect(() => codegen("${_ebiwl315yn9p4145wymd31rvej;}", "fn")).toThrow(/escape token/);
});

test("countClosingParen", () => {
	expect(countClosingParens("")).toBe(0);
	expect(countClosingParens("x")).toBe(0);
	expect(countClosingParens("))) ))) )")).toBe(7);
	expect(countClosingParens(")(())( )()()( )(")).toBe(7);
});

test("countClosingBraces", () => {
	expect(countClosingBraces("")).toBe(0);
	expect(countClosingBraces("x")).toBe(0);
	expect(countClosingBraces("}}} }}} }")).toBe(7);
	expect(countClosingBraces("}{{}}{ }{}{}{ }{")).toBe(7);
});

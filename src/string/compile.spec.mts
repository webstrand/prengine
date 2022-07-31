import { codegen } from "./codegen.mjs";
import { compile } from "./compile.mjs";

declare global {
	var bar: string;
	var qux: string;
}
globalThis.bar = "global.bar" + Math.random();
globalThis.qux = "global.qux" + Math.random();

function expect_toBeFunction(actual: unknown): asserts actual is Function {
	expect(typeof actual).toBe("function");
}

test("should reject simple strings", () => {
	expect(compile("")).toBeNull();
	expect(compile("f")).toBeNull();
	expect(compile("${")).toBeNull();
	expect(compile("}")).toBeNull();
	expect(compile("foo bar baz")).toBeNull();
	expect(compile("foo bar baz".repeat(2000))).toBeNull();
	expect(compile("foo ${ bar baz")).toBeNull();
	expect(compile("foo ${{ bar baz")).toBeNull();
	expect(compile("foo ${{ bar } baz")).toBeNull();
	expect(compile("foo ${{{ bar } baz")).toBeNull();
	expect(compile("foo ${{{ bar }} baz")).toBeNull();
});

describe("compilation", () => {
	describe("expression handling", () => {
		test("should throw on unbalanced parentheses", () => {
			expect(() => compile("foo ${{{ bar ) }}} bar")).toThrow();
			expect(() => compile("foo ${{{ bar ( }}} bar")).toThrow();
			expect(() => compile("foo ${{{ bar ; const x = 1 }}} bar")).toThrow();
			expect(() => compile("foo ${{{ bar ); const x = (1 }}} bar")).toThrow();
			expect(() => compile("foo ${{{ bar )); const x = ((1 }}} bar")).toThrow();
			expect(() => compile("foo ${{{ bar ))); const x = (((1 }}} bar")).toThrow();
		});

		test("should accept comma expressions", () => {
			expect(() => compile("foo ${{{ bar, bar }}} baz")).not.toThrow();
		});

		test("should encapsulate comma expression", () => {
			expect(compile("foo ${{{ bar, () => \"subst\" }}} baz")?.()).not.toBe("foo subst baz");
		});

		test("should throw when failing to recognize statement", () => {
			expect(() => compile("foo ${{{ bar; 1 }}} baz")).toThrow();
			expect(() => compile("foo ${{{ throw bar; 1 }}} baz")).toThrow();
		})
	});

	describe("statement handling", () => {
		test("should throw on unbalanced braces", () => {
			expect(() => compile("foo ${{{ return bar } }}}")).toThrow();
			expect(() => compile("foo ${{{ return bar { }}}")).toThrow();
			expect(() => compile("foo ${{{{ return bar }; { }}}} baz")).toThrow();
			expect(() => compile("foo ${{{{ return bar }; const x = { }}}} baz")).toThrow();
			expect(() => compile("foo ${{{{ return bar }}; const x = {{ }}}} baz")).toThrow();
			expect(() => compile("foo ${{{{ return bar }}}; const x = {{{ }}}} baz")).toThrow();
		});

		test("should accept statements", () => {
			expect(() => compile("foo ${{{ bar; }}} baz")).not.toThrow();
			expect(() => compile("foo ${{{; bar }}} baz")).not.toThrow();
			expect(() => compile("foo ${{{ return bar; }}} baz")).not.toThrow();
			expect(() => compile("foo ${{{ return bar; throw bar; }}} baz")).not.toThrow();
		});

		test("should throw on statements containing the escape token", () => {
			expect(() => compile("foo ${ return \"_ebiwl315yn9p4145wymd31rvej\" } baz")).toThrow(/escape token/);
		})
	});

	test("should rethrow exceptions", () => {
		expect(() => compile("${ await 1 }")).toThrow(SyntaxError);
		expect(() => compile("${ return await 1 }")).toThrow(SyntaxError);
	});
});

test("should evaluate simple expressions", () => {
	expect(compile("foo ${ bar } baz")?.()).toBe(`foo ${ bar } baz`);
	expect(compile("foo ${ bar }} baz")?.()).toBe(`foo ${ bar }} baz`);
	expect(compile("foo ${{ bar }} baz")?.()).toBe(`foo ${ bar } baz`);
	expect(compile("foo ${{ bar }}} baz")?.()).toBe(`foo ${ bar }} baz`);
	expect(compile("foo ${{{ bar }}} baz")?.()).toBe(`foo ${ bar } baz`);
	expect(compile("foo ${{{ bar }}}} baz")?.()).toBe(`foo ${ bar }} baz`);
	expect(compile("foo ${{ bar + '}' }} baz")?.()).toBe(`foo ${ bar }} baz`);
	expect(compile("foo ${{{ bar + '}}' }}} baz")?.()).toBe(`foo ${ bar }}} baz`);
});

test("should evaluate comma expressions", () => {
	expect(compile("foo ${{{ bar, bar }}} baz")?.()).toBe(`foo ${bar} baz`);
	expect(compile("foo ${{{ bar, \"subst\" }}} baz")?.()).toBe(`foo ${"subst"} baz`);
});

test("should evaluate simple statements", () => {
	expect(compile("foo ${ return bar } baz")?.()).toBe(`foo ${ bar } baz`);
	expect(compile("foo ${ return bar }} baz")?.()).toBe(`foo ${ bar }} baz`);
	expect(compile("foo ${{ return bar }} baz")?.()).toBe(`foo ${ bar } baz`);
	expect(compile("foo ${{ return bar }}} baz")?.()).toBe(`foo ${ bar }} baz`);
	expect(compile("foo ${{{ return bar }}} baz")?.()).toBe(`foo ${ bar } baz`);
	expect(compile("foo ${{{ return bar }}}} baz")?.()).toBe(`foo ${ bar }} baz`);
	expect(compile("foo ${{ return bar + '}' }} baz")?.()).toBe(`foo ${ bar }} baz`);
	expect(compile("foo ${{{ return bar + '}}' }}} baz")?.()).toBe(`foo ${ bar }}} baz`);
});

test("should evaluate multiple substitutions", () => {
	expect(compile("foo ${{ return bar }} baz ${ qux }")?.()).toBe(`foo ${ bar } baz ${ qux }`);
});

test("should accept parameters", () => {
	const tmpl = compile("foo ${ bar } baz ${ qux }", ["bar", "qux"]);
	expect_toBeFunction(tmpl);
	// @ts-expect-error
	expect(tmpl()).toBe(`foo undefined baz undefined`);
	// @ts-expect-error
	expect(tmpl("a")).toBe(`foo a baz undefined`);
	expect(tmpl("a", "b")).toBe(`foo a baz b`);
});

test("should accept string signature", () => {
	const tmpl = compile("foo ${ bar } baz ${ qux }", "bar,qux");
	expect_toBeFunction(tmpl);
	expect(tmpl()).toBe(`foo undefined baz undefined`);
	expect(tmpl("a")).toBe(`foo a baz undefined`);
	expect(tmpl("a", "b")).toBe(`foo a baz b`);
});

test("should use closure", () => {
	const closure = {
		bar: ["closure.bar" + Math.random()],
		qux: ["closure.qux" + Math.random()],
	};
	const tmpl = compile("foo ${ bar } baz ${ return qux }", undefined, closure);
	expect_toBeFunction(tmpl);
	expect(tmpl()).toBe(`foo ${closure.bar} baz ${closure.qux}`);
	closure.bar[0] = "closure2.bar" + Math.random();
	closure.qux[0] = "closure2.qux" + Math.random();
	expect(tmpl()).toBe(`foo ${closure.bar} baz ${closure.qux}`);
});

/**
 * @jest-environment jsdom
 */

import { compile, diagnose } from "./compile.mjs";

function expect_toBeFunction(actual: unknown): asserts actual is Function {
	expect(typeof actual).toBe("function");
}

test("should not compile trees without expressions", () => {
	expect(compile(<div><a href="test">test</a></div>)).toBeNull();
});

test("should compile and apply to trees with expressions", () => {
	const fn = jest.fn(x => x);
	const content = <>
		<script src="must be set ${ 1 }">{"${ fn('must not change') }"}</script>
		<div class="${ fn('foo') }">
			<img src="${ fn('bar') }"/>
			<a href="xx">{"${ fn('baz') }"}</a>
		</div>
	</>;
	const apply = compile(content, undefined, undefined, { fn });
	expect_toBeFunction(apply);
	expect(fn).not.toBeCalled();

	const instance = content.cloneNode(true);
	expect(() => apply(instance)).not.toThrow();
	expect(fn.mock.calls).toEqual([
		["foo"],
		["bar"],
		["baz"],
	]);
	fn.mockClear();

	expect(() => apply(instance)).not.toThrow();
	expect(fn.mock.calls).toEqual([
		["foo"],
		["bar"],
		["baz"],
	]);
	fn.mockClear();
});

test("should use signature", () => {
	const fn = jest.fn(x => x);
	const content = <>
		<script src="must be set ${ 1 }">{"${ fn('must not change') }"}</script>
		<div class="${ fn('foo') }">
			<img src="${ fn('bar') }"/>
			<a href="xx">{"${ fn('baz') }"}</a>
		</div>
	</>;

	const apply = compile(content, "instance", [ "instance", "fn" ]);
	expect_toBeFunction(apply);
	expect(fn).not.toBeCalled();

	const instance = content.cloneNode(true);
	expect(() => apply(instance, fn)).not.toThrow();
	expect(fn.mock.calls).toEqual([
		["foo"],
		["bar"],
		["baz"],
	]);
	fn.mockClear();

	expect(() => apply(instance, fn)).not.toThrow();
	expect(fn.mock.calls).toEqual([
		["foo"],
		["bar"],
		["baz"],
	]);
	fn.mockClear();
});

test("should throw on syntax error in attribute", () => {
	const content = <>
		<div class="${ \\ }"></div>
	</>
	expect(() => compile(content)).toThrow();
	const diagnostics = diagnose(content);
	expect(diagnostics).toEqual([{
			kind: "attr",
			selector: "DocumentFragment:root > div:nth-child(0)",
			element: content.children[0],
			attr: "class",
			error: diagnostics![0]!.error,
	}]);
	expect(diagnostics![0]!.error).toBeInstanceOf(SyntaxError);
});

test("should throw on syntax error in text", () => {
	const content = <>
		<div>{"${ \\ }"}</div>
	</>
	expect(() => compile(content)).toThrow();
	const diagnostics = diagnose(content);
	expect(diagnostics).toEqual([{
			kind: "data",
			selector: "DocumentFragment:root > div:nth-child(0) > Text[0]",
			characterData: content.children[0]!.childNodes[0],
			error: diagnostics![0]!.error,
	}]);
	expect(diagnostics![0]!.error).toBeInstanceOf(SyntaxError);
});

test("should diagnose on trees without expressions", () => {
	expect(diagnose(<div><a href="test">test</a></div>)).toBeNull();
});

test("should diagnose with signature", () => {
	expect(diagnose(<div>{"${ c }"}</div>, "instance", ["instance", "c"])).toEqual([]);
	expect(diagnose(<div>{"${ c }"}</div>, "instance", ["instance", "d"])).toEqual([]);
});

test("should diagnose with closure", () => {
	expect(diagnose(<div>{"${ c }"}</div>, undefined, undefined, { c: 1 })).toEqual([]);
	expect(diagnose(<div>{"${ c }"}</div>, undefined, undefined, { d: 1 })).toEqual([]);
});

test("should diagnose top-level errors", () => {
	const diagnostics = diagnose(<div>{"${ c }"}</div>, "instance", "instance=null")
	expect(diagnostics).toEqual([{
		kind: "engine",
		error: diagnostics![0]!.error
	}]);
	expect(diagnostics![0]!.error).toBeInstanceOf(SyntaxError);
});

test("should diagnose top-level elements", () => {
	const content1 = <div>{"${ \\ }"}</div>;
	const diagnostics1 = diagnose(content1);
	expect(diagnostics1).toEqual([{
		kind: "data",
		selector: "div:root > Text[0]",
		characterData: content1.childNodes[0],
		error: diagnostics1![0]!.error
	}]);
	expect(diagnostics1![0]!.error).toBeInstanceOf(SyntaxError);

	const content2 = <div class="${ \\ }"></div>;
	const diagnostics2 = diagnose(content2);
	expect(diagnostics2).toEqual([{
		kind: "attr",
		selector: "div:root",
		element: content2,
		attr: "class",
		error: diagnostics2![0]!.error
	}]);
	expect(diagnostics2![0]!.error).toBeInstanceOf(SyntaxError);
});

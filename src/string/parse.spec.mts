import { parse, VisitConst, VisitExpr } from "./parse.mjs";

test("should not parse simple strings", () => {
	const visitString = jest.fn();
	const visitCall = jest.fn();
	expect(parse("", visitString, visitCall)).toBe(false);
	expect(parse("${    ", visitString, visitCall)).toBe(false);
	expect(parse("${{    }", visitString, visitCall)).toBe(false);
	expect(parse("${{{    }}", visitString, visitCall)).toBe(false);
	expect(parse("foo bar baz", visitString, visitCall)).toBe(false);
	expect(visitString).not.toBeCalled();
	expect(visitCall).not.toBeCalled();
});

test("should visit components of strings containing substitutions", () => {
	const visitor = jest.fn<void, Parameters<VisitConst> | Parameters<VisitExpr>>();
	expect(parse("foo ${ bar } baz", visitor, visitor)).toBe(true);
	expect(visitor.mock.calls).toEqual([
		["foo ", 0],
		[" bar ", 4],
		[" baz", 12]
	]);
	visitor.mockClear();

	expect(parse("${ foo }${  bar  } baz", visitor, visitor)).toBe(true);
	expect(visitor.mock.calls).toEqual([
		[" foo ", 0],
		["  bar  ", 8],
		[" baz", 18]
	]);
	visitor.mockClear();
});

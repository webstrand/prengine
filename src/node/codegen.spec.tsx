/**
 * @jest-environment jsdom
 */

import {codegen} from "./codegen.mjs";

test("should generate no code", () => {
	expect(codegen(<div>{}</div>)).toBeNull();
	expect(codegen(<div>{"${"}</div>)).toBeNull();
	expect(codegen(<div>{"}"}</div>)).toBeNull();
	expect(codegen(<div><img>{"foo"}</img>{"bar"}<a>{"baz"}</a></div>)).toBeNull();
	expect(codegen(<div><img>{"${ foo"}</img>{"${{ bar }"}<a>{"${{{ baz }}"}</a></div>)).toBeNull();
	expect(codegen(<div class="${{ bar }"><img class="${ foo">{"foo"}</img>{"bar"}<a class="${{{ baz }}">{"baz"}</a></div>)).toBeNull();
});

test("should generate code", () => {
	expect(codegen(<div>{"${ foo }"}</div>)).toBeDefined();
	expect(codegen(<div><img>{"${ foo }"}</img>{"bar"}<a>{"baz"}</a></div>)).toBeDefined();
	expect(codegen(<div><img>{"foo"}</img>{"${ bar }"}<a>{"baz"}</a></div>)).toBeDefined();
	expect(codegen(<div><img>{"foo"}</img>{"bar"}<a>{"${ baz }"}</a></div>)).toBeDefined();

	expect(codegen(<div class="${foo}"><img>{"foo"}</img>{"bar"}<a>{"baz"}</a></div>)).toBeDefined();
	expect(codegen(<div><img class="${foo}">{"foo"}</img>{"bar"}<a>{"baz"}</a></div>)).toBeDefined();
	expect(codegen(<div><img>{"foo"}</img>{"bar"}<a class="${foo}">{"baz"}</a></div>)).toBeDefined();
});

test("should skip <script> elements", () => {
	expect(codegen(<div><script type="text/javascript">{"alert(`is ${globalThis}`)"}</script></div>)).toBeNull();
	expect(codegen(<div><script type="text/javascript" src="${foo}">{"alert(`is ${globalThis}`)"}</script></div>)).toBeDefined();
});

export {jsx, jsx as jsxs, jsx as Fragment}

type DOMElement = Element;
declare global {
	namespace JSX {
		type Element = DOMElement;
		type ChildElement = string | number | boolean | symbol | bigint | null | undefined | { toString(): string } | (() => ChildElements) | Node;
		type ChildElements = ChildElement | Iterable<ChildElement>;

		interface HTMLAttributes<T> {
			id?: string;
			class?: string;
		}

		interface HTMLImageAttributes<T extends HTMLImageElement> extends HTMLAttributes<T> {
			src?: string;
		}

		interface HTMLScriptAttributes<T extends HTMLScriptElement> extends HTMLAttributes<T> {
			type?: string;
			src?: string;
		}

		interface HTMLAnchorAttributes<T extends HTMLAnchorElement> extends HTMLAttributes<T> {
			href?: string;
		}

		interface IntrinsicElements {
			div: HTMLAttributes<HTMLDivElement>;
			img: HTMLImageAttributes<HTMLImageElement>;
			a: HTMLAnchorAttributes<HTMLAnchorElement>;
			script: HTMLScriptAttributes<HTMLScriptElement>;
		}
	}
}

function isIterable(o: {}): o is Iterable<any> {
	return Symbol.iterator in o;
}

function expandChildren(children: JSX.ChildElements): (string | Node)[] {
	switch(typeof children) {
		case "string":
			return [children];
		case "function":
			return expandChildren(children());
		case "object":
			if(children !== null) {
				if(children instanceof Node) {
					return [children];
				}
				else if(isIterable(children)) {
					return [...children].flatMap(child => expandChildren(child));
				}
				break;
			}
		case "undefined":
			return [];
		case "number":
		case "boolean":
		case "symbol":
		case "bigint":
	}
	return [String(children)]
}


function jsx<T extends keyof JSX.IntrinsicElements, Attrs extends JSX.IntrinsicElements[T] & { children?: JSX.ChildElements }>(tag: string | ((attrs: Attrs) => Element), attrs: Attrs) {
	if(typeof tag === "function") {
		if(tag === jsx as never) {
			const fragment = document.createDocumentFragment();
			fragment.append(...expandChildren(attrs.children));
			return fragment;
		}
		else return tag(attrs);
	}

	const element = document.createElement(tag);
	for(const attr in attrs) {
		if(attr === "children") continue;
		element.setAttribute(attr, attrs[attr] as any);
	}

	element.append(...expandChildren(attrs.children));

	return element;
}

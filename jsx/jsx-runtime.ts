export {jsx, jsx as jsxs, jsx as Fragment}

type DOMElement = Element;
declare global {
	namespace JSX {
		// Result type of all JSX expressions
		type Element = DOMElement;

		// Type that all function components must be compatible with.
		// The `| string` is needed for intrinsics, I choose not to double
		// the check against IntrinsicElements.
		type ElementType = (() => Element) | string;

		// Type that all class component instances must satisfy. By setting to
		// never we disable class components. Also disabled by ElementType.
		type ElementClass = never;

		// Deprecated. Specifies the class instance property used for
		// type-checking the types of attributes on custom component classes.
		interface ElementAttributesProperty {
			// Empty implies that we use all properties on the class instance
			// as arguments.
		}

		// Specifies which attribute name to use for type-checking jsx element
		// children.
		interface ElementChildrenAttribute {
			children: {};
		}

		type ChildElement = string | number | boolean | symbol | bigint | null | undefined | { toString(): string } | (() => ChildElements) | Node;
		type ChildElements = ChildElement | Iterable<ChildElement>;

		type RefLike<T> = { current?: T } | ((current: T) => void);

		interface HTMLAttributes<T> {
			id?: string;
			class?: string;
			children?: ChildElements;
			ref?: RefLike<T>
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

		interface IntrinsicAttributes {
			ref?: RefLike<Element>;
		}

		// Special attributes only for class components
		interface IntrinsicClassAttributes<T> {
		}

		// Transforms the types of class component attributes based on the
		// underlying instance type.
		type LibraryManagedAttributes<T, Props> = Props;
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
		//case "number":
		//case "boolean":
		//case "symbol":
		//case "bigint":
	}
	return [String(children)]
}


function jsx<T extends keyof JSX.IntrinsicElements, Attrs extends JSX.IntrinsicElements[T]>(tag: string | ((attrs: Attrs) => JSX.ElementType), attrs: Attrs) {
	if(typeof tag === "function") {
		if(tag === jsx as never) {
			const fragment = document.createDocumentFragment();
			fragment.append(...expandChildren(attrs.children));
			return fragment;
		}
		else {
			const result = tag(attrs);
			const ref = attrs.ref;
			switch(typeof ref) {
				case "function":
					ref(result as never);
					break;
				case "object":
					ref.current = result as never;
					break;
			}

			return result;
		}
	}

	const element = document.createElement(tag);
	for(const attr in attrs) {
		switch(attr) {
			case "children":
			case "ref":
				continue;
		}
		element.setAttribute(attr, attrs[attr] as never);
	}

	element.append(...expandChildren(attrs.children));

	const ref = attrs.ref;
	switch(typeof ref) {
		case "function":
			ref(element as never);
			break;
		case "object":
			ref.current = element as never;
			break;
	}

	return element;
}

import { compile } from "./node/compile.mjs";
export function install(closure) {
    if (globalThis.prengine)
        throw new Error("Cannot reinstall");
    globalThis.prengine = {};
    for (const template of document.querySelectorAll("template[data-component]")) {
        const componentName = template.dataset["component"];
        const templateName = kebabToSanitizedCamelCase(componentName);
        const className = camelToPascalCase(templateName);
        const templateContent = template.content;
        globalThis.prengine[className] = ({
            [className]: class extends HTMLElement {
                constructor() {
                    super();
                    const shadowRoot = this.attachShadow({ mode: 'open' });
                    const content = templateContent.cloneNode(true);
                    this.apply(content);
                    shadowRoot.replaceChildren(content);
                }
                static data1 = [];
                apply(_component) { }
                ;
                static {
                    const apply = compile(templateContent, "content", undefined, closure);
                    if (apply)
                        Object.defineProperty(this.prototype, "apply", {
                            configurable: true,
                            enumerable: false,
                            writable: true,
                            value: apply
                        });
                }
                static {
                    customElements.define(componentName, this);
                }
            }
        })[className];
    }
}
export function kebabToSanitizedCamelCase(str) {
    return str.replace(/^[^$_\p{ID_Start}]+|[^$_\p{ID_Start}]+([$_\p{ID_Start}])|(?<=[$_\p{ID_Start}\p{ID_Continue}])[^$_\p{ID_Start}\p{ID_Continue}]+([\p{ID_Continue}])|[^$_\p{ID_Start}\p{ID_Continue}]+$/gus, (_, $1, $2) => ($1 ?? $2 ?? "").toUpperCase());
}
export function camelToPascalCase(str) {
    const firstChar = str.at(0);
    if (firstChar === void 0)
        return str;
    return str.toUpperCase() + str.slice(firstChar.length);
}

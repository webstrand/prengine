import { compile, diagnose } from "./node/compile.mjs";
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
                    shadowRoot.replaceChildren(templateContent.cloneNode(true));
                    this.apply(shadowRoot, this);
                }
                apply(shadowRoot, component) { }
                ;
                static {
                    try {
                        const apply = compile(templateContent, "content", ["content", "component"], closure);
                        if (apply)
                            Object.defineProperty(this.prototype, "apply", {
                                configurable: true,
                                enumerable: false,
                                writable: true,
                                value: apply
                            });
                    }
                    catch (e) {
                        const diagnostics = diagnose(templateContent, "content", ["content", "component"], closure);
                        if (!diagnostics || diagnostics.length === 0)
                            throw e;
                        for (const diagnostic of diagnostics) {
                            if (diagnostic.kind === "engine") {
                                console.error("Failed to compile template " + componentName + " due to fatal engine error");
                                throw diagnostic.error;
                            }
                            else if (diagnostic.kind === "attr") {
                                console.error("Failed to compile template " + componentName + " due to error in " + diagnostic.selector + " attribute " + diagnostic.attr);
                                globalThis.prengine.error = diagnostic.element;
                                console.error("Offending Element saved to `globalThis.prengine.error`");
                                throw diagnostic.error;
                            }
                            else {
                                console.error("Failed to compile template " + componentName + " due to error in " + diagnostic.selector);
                                globalThis.prengine.error = diagnostic.characterData;
                                console.error("Offending CharacterData saved to `globalThis.prengine.error`");
                                throw diagnostic.error;
                            }
                        }
                    }
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

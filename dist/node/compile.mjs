import { codegen } from "./codegen.mjs";
export function compile(archetype, reference = "fragment", signature = reference, closure = null, namespace = "_") {
    const body = codegen(archetype, reference, namespace, false);
    if (body === null)
        return null;
    const closureIdentifiers = [];
    const closureValues = [];
    for (let id in closure) {
        closureIdentifiers.push(id);
        closureValues.push(closure[id]);
    }
    const sig = typeof signature === "string" ? signature : signature.join(",");
    try {
        return closureValues.length === 0
            ? new Function(sig, "\"use strict\";" + body)
            : new Function(...closureIdentifiers, "\"use strict\";return function (" + sig + ") {" + body + "}")(...closureValues);
    }
    catch (e) {
        if (e instanceof SyntaxError) {
            throw new Error("Failed to compile", { cause: e });
        }
        /* c8 ignore next */
        else {
            throw e;
        }
    }
}
import { compile as stringCompile } from "../string/compile.mjs";
export function diagnose(archetype, reference = "fragment", signature = reference, closure = null, namespace = "_") {
    const errors = [];
    const diagnosticClosure = { [reference]: null, ...closure };
    const body = codegen(archetype, reference, namespace, false, diagnostic);
    if (errors.length === 0 && body === null)
        return null;
    function diagnostic(...[node, attr]) {
        if (attr !== undefined) {
            const value = node.getAttribute(attr);
            /* c8 ignore start */
            if (value === null)
                return errors.push({
                    kind: "engine",
                    error: new Error("Attempted to compile null at" + selectorOf(node, archetype)),
                });
            /* c8 ignore end */
            try {
                stringCompile(value, signature, diagnosticClosure, namespace);
            }
            catch (e) {
                return errors.push({
                    kind: "attr",
                    selector: selectorOf(node, archetype),
                    element: node,
                    attr,
                    error: e,
                });
            }
        }
        else {
            try {
                stringCompile(node.data, signature, diagnosticClosure, namespace);
            }
            catch (e) {
                return errors.push({
                    kind: "data",
                    selector: selectorOf(node, archetype),
                    characterData: node,
                    error: e,
                });
            }
        }
    }
    if (errors.length > 0)
        return errors;
    const closureIdentifiers = [];
    const closureValues = [];
    for (let id in closure) {
        closureIdentifiers.push(id);
        closureValues.push(closure[id]);
    }
    const sig = typeof signature === "string" ? signature : signature.join(",");
    try {
        closureValues.length === 0
            ? new Function(sig, "\"use strict\";" + body)
            : new Function(...closureIdentifiers, "\"use strict\";return function (" + sig + ") {" + body + "}")(...closureValues);
    }
    catch (e) {
        errors.push({
            kind: "engine",
            error: e
        });
    }
    return errors;
}
function selectorOf(child, root) {
    let selector = "";
    let cursor = child;
    while (cursor !== root) {
        const parent = cursor.parentNode;
        if (parent === null)
            break;
        selector = (cursor instanceof Element
            ? cursor.tagName.toLowerCase() + ":nth-child(" + Array.prototype.indexOf.call(parent.children, cursor) + ")"
            : cursor.constructor.name + "[" + Array.prototype.indexOf.call(parent.childNodes, cursor) + "]") + " > " + selector;
        cursor = parent;
    }
    return (cursor instanceof Element
        ? cursor.tagName.toLowerCase() + ":root > " + selector
        : cursor.constructor.name + ":root > " + selector).slice(0, -3);
}

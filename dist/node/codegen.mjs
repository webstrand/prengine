import { codegen as stringCodegen } from "../string/codegen.mjs";
function noDiagnostics(archetype, attr) { }
/**
 * Walk the provided {@link archetype} tree and generate code that will execute
 * all of the string templates found on it on another identical tree.
 *
 * @param archetype Read-only tree of DOM `Node`s to search for templates.
 * @param reference Valid ECMAScript identifier or expression pointing to the
 * root of the instance tree.
 * @param mayAlias When `true` the generated code will generate an alias for the
 * {@link reference} if it is referenced multiple times. Useful when the
 * {@link reference} is a compound expression.
 * @param namespace Valid and unused ECMAScript identifier that will be prefixed
 * to all generated constants and variables. Must be usable without any suffix.
 * @returns ECMAScript
 */
export function codegen(archetype, reference = "fragment", namespace = "_", mayAlias = false, diagnostic = noDiagnostics) {
    const body = visitNode(archetype, reference, mayAlias, namespace, 0);
    return body && body.join("");
    function visitNode(archetype, reference, mayAlias, prefix, depth) {
        /**
         * Count of the number of time the {@link reference} is used in the
         * compiled output. We use this value both to determine if anything was
         * compiled at all, and to determine if we should alias the reference.
         */
        let usedReferenceCount = 0;
        /**
         * An object that will resolve to either an aliased reference or the
         * reference itself.
         */
        const deferredAlias = { toString() {
                switch (usedReferenceCount) {
                    default: if (mayAlias)
                        return prefix;
                    case 1: return reference.toString();
                }
            } };
        /**
         * Array containing code fragments to be concatenated.
         */
        let body = [];
        if (archetype instanceof CharacterData) {
            const textFn = prefix + "text";
            const tmpl = stringCodegen(archetype.data, textFn + "_");
            if (tmpl) {
                diagnostic(archetype);
                body.push(tmpl.decl, "const ", textFn, " = (target) => ", tmpl.expr, ";\n");
                body.push(deferredAlias, ".data = ", textFn, "(", deferredAlias, ");\n");
                usedReferenceCount += 1;
            }
        }
        else if (archetype instanceof Element) {
            const attrs = archetype.getAttributeNames();
            for (let i = 0; i < attrs.length; i++) {
                const attr = attrs[i];
                const attrFn = prefix + "attr" + i;
                const tmpl = stringCodegen(archetype.getAttribute(attr), attrFn + "_");
                if (tmpl) {
                    diagnostic(archetype, attr);
                    body.push(tmpl.decl, "const ", attrFn, " = (target) => ", tmpl.expr, ";\n");
                    body.push(deferredAlias, ".setAttribute(", JSON.stringify(attr), "," + attrFn, "(", deferredAlias, "));\n");
                    usedReferenceCount += 1;
                }
            }
        }
        // Recursively descend into any available child nodes unless it's a
        // script element.
        if (!(archetype instanceof HTMLScriptElement)) {
            const childNodes = archetype.childNodes;
            for (let i = 0; i < childNodes.length; i++) {
                const childNodeName = { i, toString() { return deferredAlias + ".childNodes[" + this.i + "]"; } };
                const op = visitNode(childNodes[i], childNodeName, true, namespace + "child" + i + "of" + depth, depth + 1);
                if (op) {
                    body.push(...op);
                    usedReferenceCount += 1;
                }
            }
        }
        switch (usedReferenceCount) {
            case 0: return null;
            default: if (mayAlias)
                return ["{\nconst ", prefix, " = ", reference, ";\n", ...body, "}\n"];
            case 1: return body;
        }
    }
}

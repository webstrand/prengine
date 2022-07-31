import { codegen } from "./codegen.mjs";
export function compile(str, signature = "", closure = null, namespace = "_") {
    const code = codegen(str, namespace);
    if (code === null)
        return null;
    const { decl, expr } = code;
    const closureIdentifiers = [];
    const closureValues = [];
    for (let id in closure) {
        closureIdentifiers.push(id);
        closureValues.push(closure[id]);
    }
    const sig = typeof signature === "string" ? signature : signature.join(",");
    return closureValues.length === 0
        ? new Function(sig, "\"use strict\";" + decl + "return (" + expr + ")")
        : new Function(...closureIdentifiers, "\"use strict\";return function (" + sig + ") {" + decl + "return (" + expr + ")}")(...closureValues);
}

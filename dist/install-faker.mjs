import { install } from "./install.mjs";
import { faker } from "https://cdn.skypack.dev/@faker-js/faker";
faker.seed(new DataView(await crypto.subtle.digest("SHA-512", (new TextEncoder()).encode(document.title ?? ""))).getUint32());
install({
	faker,
	placeholder(...args) {
		return faker.image.business(...args) + "?lock=" + faker.datatype.number()
	}
});

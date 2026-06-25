import { expect, test } from "vitest";
import {
	bindTransition,
	ensureTransitionPlaceholder,
	wrapTransition,
} from "../../src/navigator/placeholder.ts";

test("placeholder helpers bind and reuse the same placeholder node", () => {
	const placeholders = new Map<string, any>();
	const target = {
		style: {
			setProperty() {},
			getPropertyValue() {
				return "";
			},
			removeProperty() {},
		},
		prepend(node: any) {
			placeholders.set(
				node.getAttribute("data-transition-placeholder-name"),
				node,
			);
		},
		querySelector() {
			return null;
		},
		setAttribute() {},
		removeAttribute() {},
		getAttribute() {
			return null;
		},
	} as any;
	const doc = {
		createElement() {
			return {
				setAttribute() {},
				getAttribute(name: string) {
					return name === "data-transition-placeholder-name" ? "card" : null;
				},
				removeAttribute() {},
				style: {
					setProperty() {},
					getPropertyValue() {
						return "";
					},
					removeProperty() {},
				},
			};
		},
		createDocumentFragment() {
			return { append() {} };
		},
		querySelectorAll() {
			return [];
		},
		head: { append() {} },
		documentElement: { append() {} },
	} as any;
	const previousDocument = globalThis.document;
	(globalThis as any).document = doc;

	try {
		const binding = bindTransition("card", "start", "end", { duration: 120 });
		expect(binding.name).toBe("card");
		expect(binding.startIds).toEqual(["start"]);
		expect(binding.endId).toBe("end");

		const element = ensureTransitionPlaceholder(target as any, "card");
		expect(element.getAttribute("data-transition-placeholder-name")).toBe(
			"card",
		);
		expect(placeholders.get("card")).toBe(element);

		const wrapped = wrapTransition({
			name: "card",
			start: target as any,
			end: target as any,
			condition: false,
			config: { fromPlaceholder: true },
		});
		expect(wrapped).toBe(target);
	} finally {
		(globalThis as any).document = previousDocument;
	}
});

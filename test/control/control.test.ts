import { expect, test, vi } from "vitest";
import { appendChildValue } from "../../src/core/factories.ts";
import {
	Case,
	Default,
	Each,
	If,
	Lazy,
	Portal,
	Repeat,
	Show,
	Switch,
	Unless,
	When,
} from "../../src/control/index.ts";

test("When, If, Unless and Show choose the expected branch", () => {
	expect(When(true, "then", "else")).toBe("then");
	expect(If(false, "then", "else")).toBe("else");
	expect(Unless(true, "then", "else")).toBe("else");
	expect(Show(false, "shown", "fallback")).toBe("fallback");
});

test("Switch selects the first matching case or default", () => {
	expect(
		Switch(
			"b",
			Case("a", () => "A"),
			Case("b", "B"),
			Default("D"),
		),
	).toBe("B");
	expect(
		Switch(
			"z",
			Case("a", "A"),
			Default(() => "D"),
		),
	).toBe("D");
	expect(Switch("x", Case("x", "X"))).toBe("X");
});

test("Each and Repeat expand into ordered child values", () => {
	expect(Each([1, 2, 3], (item) => item * 2)).toEqual([2, 4, 6]);
	expect(Repeat(3, (index) => `#${index}`)).toEqual(["#0", "#1", "#2"]);
});

test("Lazy immediate resolves right away and timeout defers", () => {
	let calls = 0;
	expect(
		Lazy(() => {
			calls += 1;
			return "now";
		}),
	).toBe("now");
	expect(calls).toBe(1);

	vi.useFakeTimers();
	try {
		const token = Lazy(() => "later", { mode: "timeout", delayMs: 25 });
		expect(calls).toBe(1);

		const target = {
			values: [] as unknown[],
			append(...items: unknown[]) {
				this.values.push(...items);
			},
		} as ParentNode & { values: unknown[] };

		appendChildValue(target, token);
		expect(target.values).toEqual([]);

		vi.advanceTimersByTime(25);
		expect(target.values).toEqual(["later"]);
	} finally {
		vi.useRealTimers();
	}
});

test("Lazy action and toggle modes gate rendering", () => {
	const target = {
		values: [] as unknown[],
		append(...items: unknown[]) {
			this.values.push(...items);
		},
	} as ParentNode & { values: unknown[] };

	appendChildValue(
		target,
		Lazy(() => "action", { mode: "action", when: () => true }),
	);
	appendChildValue(
		target,
		Lazy(() => "toggle", { mode: "toggle", when: () => false }),
	);

	expect(target.values).toEqual(["action"]);
});

test("Portal can resolve targets by id or node", () => {
	const target = {
		id: "portal-target",
		values: [] as unknown[],
		replaceChildren() {
			this.values = [];
		},
		append(...items: unknown[]) {
			this.values.push(...items);
		},
	} as ParentNode & { id: string; values: unknown[] };
	const parent = {
		append() {
			throw new Error("portal should not append to the current parent");
		},
	} as unknown as ParentNode;
	const originalDocument = globalThis.document;
	globalThis.document = {
		getElementById(id: string) {
			return id === "portal-target" ? (target as unknown as HTMLElement) : null;
		},
	} as Document;

	try {
		appendChildValue(parent, Portal("portal-target", ["a", "b"]));
		expect(target.values).toEqual(["a", "b"]);
	} finally {
		globalThis.document = originalDocument;
	}
});

import { expect, test } from "vitest";
import { Ref } from "../../src/core/index.ts";
import {
	Attribute,
	Events,
	InlineStyle,
	Style,
} from "../../src/modifiers/index.ts";
import { Button } from "../../src/html/index.ts";
import { Css, Time, Unit } from "../../src/unit/index.ts";

test("unit helpers serialize CSS values", () => {
	expect(String(Unit.px(12))).toBe("12px");
	expect(String(Unit.rem(2))).toBe("2rem");
	expect(String(Unit.em(1.5))).toBe("1.5em");
	expect(String(Unit.percent(50))).toBe("50%");
	expect(String(Unit.vh(100))).toBe("100vh");
	expect(String(Unit.vw(80))).toBe("80vw");
});

test("namespaced css and time helpers compose", () => {
	const px = Css.Unit.px(12);
	expect(String(px)).toBe("12px");
	expect(String(px.toRem())).toBe("0.75rem");
	expect(String(px.toEm())).toBe("0.75em");
	expect(String(Css.Unit.px(80).toVh(1000))).toBe("8vh");
	expect(String(Css.Unit.px(120).toVw(1500))).toBe("8vw");
	expect(String(Css.Unit.cm(2))).toBe("2cm");
	expect(String(Css.Angle.deg(90))).toBe("90deg");
	expect(String(Css.min(Css.Unit.px(12), Css.Unit.rem(2)))).toBe(
		"min(12px, 2rem)",
	);
	expect(
		String(Css.clamp(Css.Unit.rem(1), Css.Unit.vw(2), Css.Unit.rem(3))),
	).toBe("clamp(1rem, 2vw, 3rem)");
	expect(Time.Millisecond(3_600_000).toHour()).toBe(1);
	expect(Time.Hour().toMs()).toBe(3_600_000);
	expect(Time.Day(2).toMs()).toBe(172_800_000);
	expect(Time.Week(2).toDay()).toBe(14);
});

test("style builder emits a reusable class", () => {
	const previousDocument = globalThis.document;
	const previousNode = globalThis.Node;
	const stylesheetData = {
		appended: [] as unknown[],
		ownerDocument: null as unknown,
		append: (...nodes: unknown[]) => {
			stylesheetData.appended.push(...nodes);
		},
		setAttribute() {},
	};
	const stylesheet = stylesheetData as unknown as HTMLStyleElement;
	const headData = {
		appended: [] as unknown[],
		append: (...nodes: unknown[]) => {
			headData.appended.push(...nodes);
		},
	};
	const head = headData as unknown as HTMLElement;
	const button = {
		ownerDocument: null as unknown,
		classList: {
			values: [] as string[],
			add(...classes: string[]) {
				this.values.push(...classes);
			},
		},
		style: {
			setProperty() {},
		},
		getAttribute() {
			return null;
		},
		setAttribute() {},
		append() {},
	} as unknown as HTMLButtonElement;
	const createdTextNodes: string[] = [];
	const doc = {
		head,
		documentElement: head,
		createElement(tagName: string) {
			if (tagName === "style") {
				return stylesheet;
			}

			return button;
		},
		createTextNode(value: string) {
			createdTextNodes.push(value);
			return { nodeValue: value } as unknown as Text;
		},
		querySelector() {
			return null;
		},
	} as unknown as Document;

	class TestNode {}

	try {
		Object.defineProperty(globalThis, "Node", {
			configurable: true,
			value: TestNode,
			writable: true,
		});
		Object.defineProperty(globalThis, "document", {
			configurable: true,
			value: doc,
			writable: true,
		});
		(button as unknown as { ownerDocument: Document }).ownerDocument = doc;
		(stylesheet as unknown as { ownerDocument: Document }).ownerDocument = doc;

		const element = Button(
			Style.display("flex")
				.flexDirection("column")
				.gap(Css.Unit.px(16))
				.radius(Unit.px(12))
				.hover((style) => {
					style.color("red");
				})
				.supports("(display: grid)", (style) => {
					style.gap(Css.Unit.px(8));
				})
				.media("(max-width: 640px)", (style) => {
					style.padding(Css.Unit.px(8));
				}),
		) as HTMLButtonElement;

		const className =
			(button.classList as unknown as { values: string[] }).values[0] ?? "";
		expect(className.length).toBeGreaterThan(0);
		expect(createdTextNodes.join("")).toContain(`.${className}`);
		expect(createdTextNodes.join("")).toContain(":hover");
		expect(createdTextNodes.join("")).toContain("@supports (display: grid)");
		expect(createdTextNodes.join("")).toContain("@media (max-width: 640px)");
		expect(element).toBe(button);
	} finally {
		Object.defineProperty(globalThis, "document", {
			configurable: true,
			value: previousDocument,
			writable: true,
		});
		Object.defineProperty(globalThis, "Node", {
			configurable: true,
			value: previousNode,
			writable: true,
		});
	}
});

test("inline style helper stays inline", () => {
	const previousDocument = globalThis.document;
	const element = {
		style: {
			values: {} as Record<string, string>,
			setProperty(name: string, value: string) {
				this.values[name] = value;
			},
		},
		append() {},
	} as unknown as HTMLElement;

	try {
		Object.defineProperty(globalThis, "document", {
			configurable: true,
			value: {
				createElement: () => element,
			} as unknown as Document,
			writable: true,
		});

		const button = Button(
			InlineStyle.padding(Css.Unit.px(8)),
		) as HTMLButtonElement;

		expect(
			(button.style as unknown as { values: Record<string, string> }).values,
		).toEqual({ padding: "8px" });
	} finally {
		Object.defineProperty(globalThis, "document", {
			configurable: true,
			value: previousDocument,
			writable: true,
		});
	}
});

test("attribute and event helpers chain", () => {
	const attributes = Attribute.class("primary")
		.id("example")
		.aria("label", "Save")
		.data("testid", "save-btn");

	expect(attributes.kind).toBe("modifier");
	expect(attributes.attributes).toEqual({
		class: "primary",
		id: "example",
		"aria-label": "Save",
		"data-testid": "save-btn",
	});

	const click = Events.click(() => undefined).input(() => undefined);
	expect(click.kind).toBe("event");
	expect(Object.keys(click.listeners)).toEqual(["click", "input"]);
});

test("attribute helper merges class names at runtime", () => {
	const previousDocument = globalThis.document;
	const button = {
		classList: {
			values: [] as string[],
			add(...classes: string[]) {
				this.values.push(...classes);
			},
		},
		style: {
			setProperty() {},
		},
		getAttribute() {
			return null;
		},
		setAttribute() {},
		removeAttribute() {},
		append() {},
	} as unknown as HTMLButtonElement;

	try {
		Object.defineProperty(globalThis, "document", {
			configurable: true,
			value: {
				createElement: () => button,
			} as unknown as Document,
			writable: true,
		});

		const element = Button(
			Attribute.class("primary"),
			Attribute.class("secondary"),
		) as HTMLButtonElement;

		expect(
			(button.classList as unknown as { values: string[] }).values,
		).toEqual(["primary", "secondary"]);
		expect(element).toBe(button);
	} finally {
		Object.defineProperty(globalThis, "document", {
			configurable: true,
			value: previousDocument,
			writable: true,
		});
	}
});

test("attribute helper covers common svg attributes", () => {
	const attributes = Attribute.viewBox("0 0 24 24")
		.fill("none")
		.stroke("currentColor")
		.strokeWidth(2)
		.cx(12)
		.cy(12)
		.r(10);

	expect(attributes.attributes).toEqual({
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		"stroke-width": 2,
		cx: 12,
		cy: 12,
		r: 10,
	});
});

test("ref helper captures the created element", () => {
	const ref = Ref<HTMLButtonElement>();
	const previousDocument = globalThis.document;
	const previousNode = globalThis.Node;

	class TestNode {}
	const element = new TestNode() as unknown as HTMLButtonElement;

	try {
		Object.defineProperty(globalThis, "Node", {
			configurable: true,
			value: TestNode,
			writable: true,
		});
		Object.defineProperty(globalThis, "document", {
			configurable: true,
			value: {
				createElement: () => element,
			} as unknown as Document,
			writable: true,
		});

		const button = Button(ref) as HTMLButtonElement;

		expect(ref.current).toBe(button);
	} finally {
		Object.defineProperty(globalThis, "document", {
			configurable: true,
			value: previousDocument,
			writable: true,
		});
		Object.defineProperty(globalThis, "Node", {
			configurable: true,
			value: previousNode,
			writable: true,
		});
	}
});

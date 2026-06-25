import { expect, test, vi } from "vitest";
import {
	applyRealClass,
	applyStyleProperty,
	applyTransitionTokensToElement,
	clearTransitionTokensFromElement,
	collectTransitionTargetIds,
	createTransitionWrapElement,
	cssEscape,
	ensureTransitionRootStyles,
	isRenderableDocument,
	readStyleValue,
	resolveTransitionCondition,
	resolveTransitionRunConfig,
	storeTransitionRunConfig,
	transitionRootStyles,
	transitionRunConfigs,
} from "../../src/navigator/shared.ts";

function createElement() {
	const attrs = new Map<string, string>();
	const classes = new Set<string>();
	const styles = new Map<string, string>();
	return {
		attrs,
		classList: {
			add(...names: string[]) {
				names.forEach((name) => classes.add(name));
			},
			remove(...names: string[]) {
				names.forEach((name) => classes.delete(name));
			},
			contains(name: string) {
				return classes.has(name);
			},
		},
		style: {
			setProperty(name: string, value: string) {
				styles.set(name, value);
			},
			removeProperty(name: string) {
				styles.delete(name);
			},
			getPropertyValue(name: string) {
				return styles.get(name) ?? "";
			},
		},
		getAttribute(name: string) {
			return attrs.get(name) ?? null;
		},
		setAttribute(name: string, value: string) {
			attrs.set(name, value);
		},
		removeAttribute(name: string) {
			attrs.delete(name);
		},
		get classes() {
			return classes;
		},
		get styles() {
			return styles;
		},
	} as unknown as HTMLElement & {
		attrs: Map<string, string>;
		classes: Set<string>;
		styles: Map<string, string>;
	};
}

test("transition helpers normalize names and conditions", () => {
	expect(isRenderableDocument(undefined)).toBe(false);
	expect(
		isRenderableDocument({ querySelectorAll() {} } as unknown as Document),
	).toBe(true);
	expect(resolveTransitionCondition(true)).toBe(true);
	expect(resolveTransitionCondition(() => false)).toBe(false);
	expect(cssEscape("card / 1")).toBe("card\\ \\/\\ 1");
	expect(collectTransitionTargetIds(["a", "a", "b"])).toEqual(["a", "b"]);
	expect(
		collectTransitionTargetIds([
			{ getAttribute: () => "card" } as unknown as Element,
			{ getAttribute: () => "card" } as unknown as Element,
		]),
	).toEqual(["card"]);
});

test("style and class helpers apply and restore previous values", () => {
	const element = createElement();

	const restoreStyle = applyStyleProperty(element, "opacity", "0.5");
	expect(readStyleValue(element.style, "opacity")).toBe("0.5");
	restoreStyle();
	expect(readStyleValue(element.style, "opacity")).toBeNull();

	const restoreClass = applyRealClass(element, "active");
	expect(element.classList.contains("active")).toBe(true);
	restoreClass();
	expect(element.classList.contains("active")).toBe(false);
});

test("transition tokens write and clear the marker state", () => {
	const element = createElement();

	applyTransitionTokensToElement(element, "card");
	expect(element.style.getPropertyValue("view-transition-name")).toBe("card");
	expect(element.getAttribute("data-transition-name")).toBe("card");

	clearTransitionTokensFromElement(element);
	expect(element.style.getPropertyValue("view-transition-name")).toBe("");
	expect(element.getAttribute("data-transition-name")).toBeNull();
});

test("transition config storage merges persisted values", () => {
	transitionRunConfigs.clear();
	storeTransitionRunConfig("card", {
		duration: 100,
		fromPlaceholder: true,
		sharedClassName: "shared",
	});

	expect(transitionRunConfigs.get("card")).toEqual({
		duration: 100,
		sharedClassName: "shared",
	});
	expect(
		resolveTransitionRunConfig(["card"], {
			easing: "ease-out",
			fallback: true,
		}),
	).toEqual({
		duration: 100,
		sharedClassName: "shared",
		easing: "ease-out",
		fallback: true,
	});

	transitionRunConfigs.clear();
});

test("transition root styles are installed only once", () => {
	const head = {
		append: vi.fn(),
	};
	const doc = {
		head,
		documentElement: head,
		createElement(tagName: string) {
			return {
				tagName,
				style: {
					setProperty() {},
				},
				setAttribute() {},
				textContent: "",
			} as unknown as HTMLStyleElement;
		},
	} as unknown as Document;

	ensureTransitionRootStyles(doc);
	ensureTransitionRootStyles(doc);

	expect(transitionRootStyles.has(doc)).toBe(true);
	expect(head.append).toHaveBeenCalledTimes(1);
});

test("transition wrap element is created with display contents", () => {
	const previousDocument = globalThis.document;
	const element = createElement();
	const doc = {
		createElement: () => element,
	} as unknown as Document;

	try {
		(globalThis as typeof globalThis & { document: Document }).document = doc;
		const wrap = createTransitionWrapElement();

		expect(wrap).toBe(element);
		expect(element.style.getPropertyValue("display")).toBe("contents");
	} finally {
		(globalThis as typeof globalThis & { document: Document }).document =
			previousDocument as Document;
	}
});

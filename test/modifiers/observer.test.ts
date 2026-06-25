import { expect, test } from "vitest";
import { Div } from "../../src/html/index.ts";
import { Observer } from "../../src/modifiers/index.ts";

test("observer modifier fires visible and directional callbacks", () => {
	const previousDocument = globalThis.document;
	const previousElement = globalThis.Element;
	const previousIntersectionObserver = globalThis.IntersectionObserver;
	interface MockObserverInstance {
		callback: IntersectionObserverCallback;
		options?: IntersectionObserverInit;
		observe: (target: Element) => void;
		disconnect: () => void;
		observed: Element[];
	}

	const instances: MockObserverInstance[] = [];

	class TestElement {
		append() {}
		appendChild() {}
		setAttribute() {}
	}

	class TestIntersectionObserver {
		readonly callback: IntersectionObserverCallback;
		readonly options: IntersectionObserverInit | undefined;
		observed: Element[] = [];

		constructor(
			callback: IntersectionObserverCallback,
			options?: IntersectionObserverInit,
		) {
			this.callback = callback;
			this.options = options;
			instances.push(this as unknown as (typeof instances)[number]);
		}

		observe(target: Element) {
			this.observed.push(target);
		}

		disconnect() {}
	}

	(
		globalThis as typeof globalThis & {
			Element: typeof TestElement;
			IntersectionObserver: typeof TestIntersectionObserver;
		}
	).Element = TestElement as never;
	(
		globalThis as typeof globalThis & {
			IntersectionObserver: typeof TestIntersectionObserver;
		}
	).IntersectionObserver = TestIntersectionObserver as never;
	(globalThis as typeof globalThis & { document: Document }).document = {
		createElement() {
			return new TestElement() as unknown as HTMLElement;
		},
		createDocumentFragment() {
			return {
				append() {},
			} as unknown as DocumentFragment;
		},
		createTextNode(value: string) {
			return { nodeValue: value } as unknown as Text;
		},
	} as unknown as Document;

	const visibleCalls: IntersectionObserverEntry[] = [];
	const topCalls: IntersectionObserverEntry[] = [];

	try {
		const element = Div(
			Observer.visible((entry) => visibleCalls.push(entry)).enterTop(
				(entry) => topCalls.push(entry),
				{ margin: "24px" },
			),
		) as unknown as TestElement;

		expect(instances).toHaveLength(1);
		const observer = instances[0]!;
		expect(observer.observed).toContain(element as never);
		expect(observer.options?.rootMargin).toBe("0px");

		const entry = {
			isIntersecting: false,
			intersectionRatio: 0,
			rootBounds: {
				top: 0,
				bottom: 100,
				left: 0,
				right: 100,
				width: 100,
				height: 100,
				toJSON() {
					return {};
				},
			} as DOMRectReadOnly,
			boundingClientRect: {
				top: -20,
				bottom: -5,
				left: 20,
				right: 80,
				width: 60,
				height: 15,
				toJSON() {
					return {};
				},
			} as DOMRectReadOnly,
			intersectionRect: {
				top: 0,
				bottom: 0,
				left: 0,
				right: 0,
				width: 0,
				height: 0,
				toJSON() {
					return {};
				},
			} as DOMRectReadOnly,
			time: 0,
			target: element as unknown as Element,
		} satisfies IntersectionObserverEntry;

		observer.callback([entry], observer as never);

		expect(visibleCalls).toHaveLength(0);
		expect(topCalls).toHaveLength(1);
	} finally {
		(globalThis as typeof globalThis & { document: Document }).document =
			previousDocument as Document;
		(globalThis as typeof globalThis & { Element: typeof Element }).Element =
			previousElement as typeof Element;
		(
			globalThis as typeof globalThis & {
				IntersectionObserver?: typeof IntersectionObserver;
			}
		).IntersectionObserver = previousIntersectionObserver;
	}
});

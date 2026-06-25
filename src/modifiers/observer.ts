import { ensureObserverRuntime } from "./observer-runtime.ts";
import type {
	ObserverCallbacks,
	ObserverInvocationConfig,
} from "../core/factories.ts";
import { FacadeBase } from "./shared.ts";

export interface ObserverFacade {
	readonly kind: "observer";
	readonly callbacks: Readonly<ObserverCallbacks>;
	readonly options: Readonly<IntersectionObserverInit>;
	readonly isOnce: boolean;
	visible(
		handler: (entry: IntersectionObserverEntry) => void,
		config?: ObserverInvocationConfig,
	): this;
	hidden(
		handler: (entry: IntersectionObserverEntry) => void,
		config?: ObserverInvocationConfig,
	): this;
	enterTop(
		handler: (entry: IntersectionObserverEntry) => void,
		config?: ObserverInvocationConfig,
	): this;
	enterBottom(
		handler: (entry: IntersectionObserverEntry) => void,
		config?: ObserverInvocationConfig,
	): this;
	enterLeft(
		handler: (entry: IntersectionObserverEntry) => void,
		config?: ObserverInvocationConfig,
	): this;
	enterRight(
		handler: (entry: IntersectionObserverEntry) => void,
		config?: ObserverInvocationConfig,
	): this;
	exitTop(
		handler: (entry: IntersectionObserverEntry) => void,
		config?: ObserverInvocationConfig,
	): this;
	exitBottom(
		handler: (entry: IntersectionObserverEntry) => void,
		config?: ObserverInvocationConfig,
	): this;
	exitLeft(
		handler: (entry: IntersectionObserverEntry) => void,
		config?: ObserverInvocationConfig,
	): this;
	exitRight(
		handler: (entry: IntersectionObserverEntry) => void,
		config?: ObserverInvocationConfig,
	): this;
	root(element: Element | Document | null): this;
	rootMargin(value: string): this;
	threshold(value: number | number[]): this;
	once(value?: boolean): this;
}

class ObserverBuilder extends FacadeBase {
	readonly kind = "observer" as const;
	#callbacks: ObserverCallbacks = {};
	#options: IntersectionObserverInit = {};
	#once = false;

	constructor() {
		super();
		ensureObserverRuntime();
	}

	get callbacks() {
		return { ...this.#callbacks } as const;
	}

	get options() {
		return { ...this.#options } as const;
	}

	get isOnce() {
		return this.#once;
	}

	visible(
		handler: (entry: IntersectionObserverEntry) => void,
		config?: ObserverInvocationConfig,
	): this {
		this.#callbacks.visible = { kind: "visible", handler, config };
		return this;
	}

	hidden(
		handler: (entry: IntersectionObserverEntry) => void,
		config?: ObserverInvocationConfig,
	): this {
		this.#callbacks.hidden = { kind: "hidden", handler, config };
		return this;
	}

	enterTop(
		handler: (entry: IntersectionObserverEntry) => void,
		config?: ObserverInvocationConfig,
	): this {
		this.#callbacks.enterTop = { kind: "enterTop", handler, config };
		return this;
	}

	enterBottom(
		handler: (entry: IntersectionObserverEntry) => void,
		config?: ObserverInvocationConfig,
	): this {
		this.#callbacks.enterBottom = { kind: "enterBottom", handler, config };
		return this;
	}

	enterLeft(
		handler: (entry: IntersectionObserverEntry) => void,
		config?: ObserverInvocationConfig,
	): this {
		this.#callbacks.enterLeft = { kind: "enterLeft", handler, config };
		return this;
	}

	enterRight(
		handler: (entry: IntersectionObserverEntry) => void,
		config?: ObserverInvocationConfig,
	): this {
		this.#callbacks.enterRight = { kind: "enterRight", handler, config };
		return this;
	}

	exitTop(
		handler: (entry: IntersectionObserverEntry) => void,
		config?: ObserverInvocationConfig,
	): this {
		this.#callbacks.exitTop = { kind: "exitTop", handler, config };
		return this;
	}

	exitBottom(
		handler: (entry: IntersectionObserverEntry) => void,
		config?: ObserverInvocationConfig,
	): this {
		this.#callbacks.exitBottom = { kind: "exitBottom", handler, config };
		return this;
	}

	exitLeft(
		handler: (entry: IntersectionObserverEntry) => void,
		config?: ObserverInvocationConfig,
	): this {
		this.#callbacks.exitLeft = { kind: "exitLeft", handler, config };
		return this;
	}

	exitRight(
		handler: (entry: IntersectionObserverEntry) => void,
		config?: ObserverInvocationConfig,
	): this {
		this.#callbacks.exitRight = { kind: "exitRight", handler, config };
		return this;
	}

	root(element: Element | Document | null): this {
		this.#options.root = element;
		return this;
	}

	rootMargin(value: string): this {
		this.#options.rootMargin = value;
		return this;
	}

	threshold(value: number | number[]): this {
		this.#options.threshold = value;
		return this;
	}

	once(value = true): this {
		this.#once = value;
		return this;
	}
}

function createObserverStateFacade(builder: ObserverBuilder): ObserverFacade {
	return new Proxy(builder, {
		get(target, property, receiver) {
			if (
				property === "kind" ||
				property === "callbacks" ||
				property === "options" ||
				property === "isOnce"
			) {
				return Reflect.get(target, property, target);
			}

			if (typeof property !== "string") {
				return Reflect.get(target, property, receiver);
			}

			const direct = Reflect.get(target, property, target);
			if (typeof direct === "function") {
				return (...args: unknown[]) => {
					const result = (
						direct as (...methodArgs: unknown[]) => unknown
					).apply(target, args);
					return result === target ? receiver : result;
				};
			}

			return receiver;
		},
	}) as unknown as ObserverFacade;
}

function createObserverFacade<
	T extends abstract new (
		...args: any[]
	) => object,
>(ctor: T): ObserverFacade {
	return new Proxy(ctor, {
		get(_target, property, receiver) {
			if (typeof property !== "string") {
				return Reflect.get(_target, property, receiver);
			}

			return (...args: unknown[]) => {
				const facade = createObserverStateFacade(new ObserverBuilder());
				const method = Reflect.get(facade, property, facade);

				if (typeof method === "function") {
					return method(...args);
				}

				return facade;
			};
		},
	}) as unknown as ObserverFacade;
}

export const Observer = createObserverFacade(ObserverBuilder);

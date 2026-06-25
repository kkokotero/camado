import type { BaseComponent } from "./base-component.ts";
import { scheduleConcurrentBackgroundJob } from "./background.ts";
import { Channel } from "./channel.ts";

export interface BinderContext {
	component: BaseComponent;
	host: HTMLElement;
}

export type BinderConstructor<
	TEvents extends Record<string, unknown> = Record<string, unknown>,
	TBinder extends BaseBinder<TEvents> = BaseBinder<TEvents>,
> = new () => TBinder;

const binderInstances = new WeakMap<BinderConstructor<any>, BaseBinder<any>>();

export function getBinderInstance<
	TEvents extends Record<string, unknown> = Record<string, unknown>,
	TBinder extends BaseBinder<TEvents> = BaseBinder<TEvents>,
>(binder: BinderConstructor<TEvents, TBinder>): TBinder {
	let instance = binderInstances.get(binder);
	if (!instance) {
		instance = new binder();
		binderInstances.set(binder, instance);
	}

	return instance as TBinder;
}

export function ensureBinderInstanceProperty(
	binder: BinderConstructor<any>,
): void {
	if (Object.hasOwn(binder, "instance")) {
		return;
	}

	Object.defineProperty(binder, "instance", {
		configurable: true,
		enumerable: false,
		get() {
			return getBinderInstance(binder);
		},
	});
}

export abstract class BaseBinder<
	TEvents extends Record<string, unknown> = Record<string, unknown>,
> {
	readonly channel = new Channel<TEvents>();
	#contexts = new Map<BaseComponent, BinderContext>();
	#invalidateQueued = false;

	static get instance(): BaseBinder<any> {
		return getBinderInstance(BaseBinder as unknown as BinderConstructor<any>);
	}

	connect(context: BinderContext): void {
		if (this.#contexts.has(context.component)) {
			return;
		}

		const wasEmpty = this.#contexts.size === 0;
		this.#contexts.set(context.component, context);
		if (wasEmpty) {
			this.onConnect(context);
		}
	}

	disconnect(context: BinderContext): void {
		if (!this.#contexts.has(context.component)) {
			return;
		}

		const wasLast = this.#contexts.size === 1;
		this.#contexts.delete(context.component);
		if (wasLast) {
			this.onDisconnect(context);
		}
	}

	protected invalidate(): void {
		if (this.#invalidateQueued) {
			return;
		}

		const contexts = [...this.#contexts.values()];
		if (contexts.length === 0) {
			return;
		}

		this.#invalidateQueued = true;
		for (const context of contexts) {
			scheduleConcurrentBackgroundJob(() => {
				context.component.__requestUpdate();
			});
		}
		this.#invalidateQueued = false;
	}

	protected onConnect(_context: BinderContext): void {}

	protected onDisconnect(_context: BinderContext): void {}
}

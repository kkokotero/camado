import { scheduleConcurrentBackgroundJob } from "./background.ts";

type ChannelEventName<TEvents> = keyof TEvents & string;

type ChannelHandler<TDetail> = (detail: TDetail) => void;

export class Channel<
	TEvents extends Record<string, unknown> = Record<string, unknown>,
> {
	#listeners = new Map<
		ChannelEventName<TEvents>,
		Set<ChannelHandler<unknown>>
	>();

	on<K extends ChannelEventName<TEvents>>(
		name: K,
		handler: ChannelHandler<TEvents[K]>,
	): () => void {
		const listeners =
			this.#listeners.get(name) ?? new Set<ChannelHandler<unknown>>();
		listeners.add(handler as ChannelHandler<unknown>);
		this.#listeners.set(name, listeners);

		return () => {
			this.off(name, handler);
		};
	}

	off<K extends ChannelEventName<TEvents>>(
		name: K,
		handler: ChannelHandler<TEvents[K]>,
	): void {
		const listeners = this.#listeners.get(name);
		if (!listeners) {
			return;
		}

		listeners.delete(handler as ChannelHandler<unknown>);
		if (listeners.size === 0) {
			this.#listeners.delete(name);
		}
	}

	once<K extends ChannelEventName<TEvents>>(
		name: K,
		handler: ChannelHandler<TEvents[K]>,
	): () => void {
		const off = this.on(name, (detail) => {
			off();
			handler(detail);
		});

		return off;
	}

	emit<K extends ChannelEventName<TEvents>>(
		name: K,
		detail: TEvents[K],
	): boolean {
		const listeners = this.#listeners.get(name);
		if (!listeners || listeners.size === 0) {
			return false;
		}

		for (const listener of listeners) {
			scheduleConcurrentBackgroundJob(() => {
				(listener as ChannelHandler<TEvents[K]>)(detail);
			});
		}

		return true;
	}

	clear(): void {
		this.#listeners.clear();
	}
}

import { markEvent } from "../core/metadata.ts";

export function Event<TDetail = unknown>(eventName: string): MethodDecorator {
	return (target, key, descriptor) => {
		markEvent(target, key, eventName);

		const mutableDescriptor = descriptor as PropertyDescriptor | undefined;

		if (!mutableDescriptor || typeof mutableDescriptor.value !== "function") {
			return descriptor;
		}

		const original = mutableDescriptor.value as (...args: unknown[]) => unknown;

		mutableDescriptor.value = function (this: unknown, ...args: unknown[]) {
			const result = original.apply(this, args);
			const emitter = this as unknown as {
				emit?: <TEvent = unknown>(name: string, detail?: TEvent) => boolean;
				dispatchEvent?: (event: Event) => boolean;
			};

			if (typeof emitter.emit === "function") {
				emitter.emit<TDetail>(eventName, result as TDetail);
			} else if (typeof emitter.dispatchEvent === "function") {
				const event =
					typeof globalThis.CustomEvent === "function"
						? new globalThis.CustomEvent<TDetail>(eventName, {
								bubbles: true,
								composed: true,
								detail: result as TDetail,
							})
						: ({ type: eventName, detail: result } as unknown as Event);

				emitter.dispatchEvent(event);
			}

			return result;
		};

		return mutableDescriptor;
	};
}

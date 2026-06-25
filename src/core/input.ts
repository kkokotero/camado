import {
	markEvent,
	markInputField,
	type InputFieldOptions,
} from "./metadata.ts";

export function Output(options?: InputFieldOptions): PropertyDecorator;
export function Output<TDetail = unknown>(eventName: string): MethodDecorator;
export function Output(
	arg: string | InputFieldOptions = {},
): PropertyDecorator | MethodDecorator {
	return (
		target: object,
		key: string | symbol,
		descriptor?: PropertyDescriptor,
	) => {
		if (descriptor && typeof descriptor.value === "function") {
			const eventName = typeof arg === "string" ? arg : String(key);
			markEvent(target, key, eventName);

			const original = descriptor.value as (...args: unknown[]) => unknown;
			descriptor.value = function (this: unknown, ...args: unknown[]) {
				const result = original.apply(this, args);
				const emitter = this as unknown as {
					emit?: (name: string, detail?: unknown) => boolean;
					dispatchEvent?: (event: Event) => boolean;
				};

				if (typeof emitter.emit === "function") {
					emitter.emit(eventName, result);
				} else if (typeof emitter.dispatchEvent === "function") {
					const event =
						typeof globalThis.CustomEvent === "function"
							? new globalThis.CustomEvent(eventName, {
									bubbles: true,
									composed: true,
									detail: result,
								})
							: ({ type: eventName, detail: result } as unknown as Event);

					emitter.dispatchEvent(event);
				}

				return result;
			};

			return descriptor;
		}

		markInputField(
			target,
			key,
			typeof arg === "object" && arg !== null ? arg : {},
		);
	};
}

import { registerChildHandler } from "../core/child-handlers.ts";
import { setEventListeners } from "../core/factories.ts";

let installed = false;

export function ensureEventRuntime(): void {
	if (installed) {
		return;
	}

	installed = true;
	registerChildHandler({
		test: (
			value,
		): value is {
			kind: "event";
			listeners: Record<string, EventListenerOrEventListenerObject>;
		} =>
			typeof value === "object" &&
			value !== null &&
			(value as { kind?: string }).kind === "event",
		handle(target, value) {
			const element = target as ParentNode & {
				addEventListener?: (
					type: string,
					listener: EventListenerOrEventListenerObject,
				) => void;
			};
			if (typeof element.addEventListener !== "function") return;
			const listeners = (
				value as {
					listeners: Record<string, EventListenerOrEventListenerObject>;
				}
			).listeners;
			for (const [name, listener] of Object.entries(listeners)) {
				element.addEventListener(name, listener);
			}
			setEventListeners(target as Node, listeners);
		},
	});
}

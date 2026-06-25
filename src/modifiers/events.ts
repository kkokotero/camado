import { ensureEventRuntime } from "./event-runtime.ts";

type DOMEventName = keyof GlobalEventHandlersEventMap & string;
type EventAliasName =
	| "pointerDown"
	| "pointerMove"
	| "pointerUp"
	| "keyDown"
	| "keyUp";
type EventMethodName = DOMEventName | EventAliasName;

type EventListenerMap = Record<string, EventListenerOrEventListenerObject>;

const eventAliases: Record<EventAliasName, string> = {
	pointerDown: "pointerdown",
	pointerMove: "pointermove",
	pointerUp: "pointerup",
	keyDown: "keydown",
	keyUp: "keyup",
};

export interface EventFacade {
	readonly kind: "event";
	readonly listeners: Readonly<EventListenerMap>;
	on(
		eventName: EventMethodName,
		handler: EventListenerOrEventListenerObject,
	): EventsFacade;
}

export type EventsFacade = EventFacade & {
	[K in EventMethodName]: (
		handler: EventListenerOrEventListenerObject,
	) => EventsFacade;
};

class EventsBuilder {
	readonly kind = "event" as const;
	#listeners: EventListenerMap = {};

	get listeners() {
		return { ...this.#listeners } as const;
	}

	on(
		eventName: EventMethodName,
		handler: EventListenerOrEventListenerObject,
	): this {
		ensureEventRuntime();
		const resolvedName = eventAliases[eventName as EventAliasName] ?? eventName;
		this.#listeners[resolvedName] = handler;
		return this;
	}
}

function createEventsStateFacade(builder: EventsBuilder): EventsFacade {
	return new Proxy(builder, {
		get(target, property, receiver) {
			if (property === "kind" || property === "listeners") {
				return Reflect.get(target, property, target);
			}

			if (typeof property !== "string") {
				return Reflect.get(target, property, receiver);
			}

			if (property === "on") {
				return (
					eventName: EventMethodName,
					handler: EventListenerOrEventListenerObject,
				) => {
					target.on(eventName, handler);
					return receiver;
				};
			}

			const eventName = (eventAliases[property as EventAliasName] ??
				property) as EventMethodName;

			return (handler: EventListenerOrEventListenerObject) => {
				target.on(eventName, handler);
				return receiver;
			};
		},
	}) as unknown as EventsFacade;
}

function createEventsFacade<T extends abstract new (...args: any[]) => object>(
	ctor: T,
): EventsFacade {
	return new Proxy(ctor, {
		get(_target, property, receiver) {
			if (typeof property !== "string") {
				return Reflect.get(_target, property, receiver);
			}

			return (...args: unknown[]) => {
				const facade = createEventsStateFacade(new EventsBuilder());
				const method = Reflect.get(facade, property, facade);

				if (typeof method === "function") {
					return method(...args);
				}

				if (args.length === 1) {
					facade.on(
						property as EventMethodName,
						args[0] as EventListenerOrEventListenerObject,
					);
				}

				return facade;
			};
		},
	}) as unknown as EventsFacade;
}

export const Events = createEventsFacade(EventsBuilder);
export const Event = Events;

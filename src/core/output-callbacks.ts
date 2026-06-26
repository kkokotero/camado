const componentOutputCallbacksSymbol = Symbol(
	"camado.componentOutputCallbacks",
);

export type ComponentOutputCallback = (detail: unknown) => unknown;
export type ComponentOutputCallbackMap = Readonly<
	Record<string, ComponentOutputCallback>
>;

export function setComponentOutputCallbacks(
	target: object,
	callbacks: Readonly<Record<string, ComponentOutputCallback>>,
): void {
	if (Object.keys(callbacks).length === 0) {
		Reflect.deleteProperty(target, componentOutputCallbacksSymbol);
		return;
	}

	Object.defineProperty(target, componentOutputCallbacksSymbol, {
		configurable: true,
		enumerable: false,
		value: callbacks,
		writable: true,
	});
}

export function getComponentOutputCallbacks(
	target: object | undefined,
): ComponentOutputCallbackMap | undefined {
	if (!target) {
		return undefined;
	}

	return Reflect.get(target, componentOutputCallbacksSymbol) as
		| ComponentOutputCallbackMap
		| undefined;
}

import {
	markDelayHook,
	markDestroyHook,
	markIntervalHook,
	markMountHook,
} from "./metadata.ts";

function asMethodDecorator(
	apply: (target: object, key: string | symbol) => void,
): MethodDecorator {
	return (target, key) => {
		apply(target, key);
	};
}

export function OnMount(): MethodDecorator {
	return asMethodDecorator(markMountHook);
}

export function OnDestroy(): MethodDecorator {
	return asMethodDecorator(markDestroyHook);
}

export function Delay(delayMs = 0): MethodDecorator {
	return asMethodDecorator((target, key) =>
		markDelayHook(target, key, delayMs),
	);
}

export function Interval(intervalMs = 1000): MethodDecorator {
	return asMethodDecorator((target, key) =>
		markIntervalHook(target, key, intervalMs),
	);
}

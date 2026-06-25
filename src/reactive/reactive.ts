import { markReactiveField, type ReactiveFieldOptions } from "../core/metadata.ts";

export function Reactive(options: ReactiveFieldOptions = {}): PropertyDecorator {
	return (target, key) => {
		markReactiveField(target, key, options);
	};
}

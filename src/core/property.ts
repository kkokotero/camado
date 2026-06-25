import { markPropertyField, type PropertyFieldOptions } from "./metadata.ts";

export function Property(options: PropertyFieldOptions = {}): PropertyDecorator {
	return (target, key) => {
		markPropertyField(target, key, options);
	};
}

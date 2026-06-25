import { markChildrenField, type ChildrenFieldOptions } from "./metadata.ts";

export type ChildrenNodes = DocumentFragment;

export function Children(
	options: ChildrenFieldOptions = {},
): PropertyDecorator {
	return (target, key) => {
		markChildrenField(target, key, options);
	};
}

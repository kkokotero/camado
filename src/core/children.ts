import { markChildrenField, type ChildrenFieldOptions } from "./metadata.ts";
import type { ChildValue } from "./factories.ts";
import type { ComponentInvocationChildrenToken } from "./component-types.ts";

export type ChildrenNodes = DocumentFragment;

export function Children(options?: ChildrenFieldOptions): PropertyDecorator;
export function Children(
	...children: readonly ChildValue[]
): ComponentInvocationChildrenToken;
export function Children(
	...args: [ChildrenFieldOptions?] | readonly ChildValue[]
): PropertyDecorator | ComponentInvocationChildrenToken {
	if (isChildrenFieldOptions(args[0]) && args.length <= 1) {
		const options = args[0] ?? {};
		return (target, key) => {
			markChildrenField(target, key, options);
		};
	}

	return {
		kind: "component-children",
		children: [...args].filter(
			(value): value is ChildValue => value !== undefined,
		) as readonly ChildValue[],
	};
}

function isChildrenFieldOptions(value: unknown): value is ChildrenFieldOptions {
	return typeof value === "object" && value !== null && "optional" in value;
}

import { markSlotField, type SlotFieldOptions } from "./metadata.ts";
import type { ChildValue } from "./factories.ts";
import type { ComponentInvocationSlotToken } from "./component-types.ts";

export function Slot(
	name: string,
	options?: SlotFieldOptions,
): PropertyDecorator;
export function Slot(
	name: string,
	...children: readonly ChildValue[]
): ComponentInvocationSlotToken;
export function Slot(
	name: string,
	...args: [SlotFieldOptions?] | readonly ChildValue[]
): PropertyDecorator | ComponentInvocationSlotToken {
	if (isSlotFieldOptions(args[0]) && args.length <= 1) {
		const options = args[0] ?? {};
		return (target, key) => {
			markSlotField(target, key, name, options);
		};
	}

	return {
		kind: "component-slot",
		name,
		children: [...args].filter(
			(value): value is ChildValue => value !== undefined,
		) as readonly ChildValue[],
	};
}

function isSlotFieldOptions(value: unknown): value is SlotFieldOptions {
	return typeof value === "object" && value !== null && "optional" in value;
}

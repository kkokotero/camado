import { markSlotField, type SlotFieldOptions } from "./metadata.ts";

export function Slot(name: string, options: SlotFieldOptions = {}): PropertyDecorator {
	return (target, key) => {
		markSlotField(target, key, name, options);
	};
}

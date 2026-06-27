import { markHostField } from "./metadata.ts";

export function Host(): PropertyDecorator {
	return (target, key) => {
		markHostField(target, key);
	};
}

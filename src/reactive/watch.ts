import { markWatch } from "../core/metadata.ts";

export function Watch(sourceKey: string): MethodDecorator {
	return (target, key) => {
		markWatch(target, sourceKey, key);
	};
}

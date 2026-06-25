import {
	getOrCreateComponentMetadata,
	setComponentSelector,
} from "./metadata.ts";
import { defineComponentHost } from "./component-host.ts";

export interface ComponentOptions {
	selector: string;
}

export function Component(options: ComponentOptions): ClassDecorator {
	return (target) => {
		if (typeof target !== "function") {
			return;
		}

		getOrCreateComponentMetadata(target);
		setComponentSelector(target, options.selector);

		defineComponentHost(target as never, options.selector);
	};
}

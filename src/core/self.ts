import { appendChildValue, type ChildValue } from "./factories.ts";
import { isComponentHostElement } from "./component-host.ts";
import { registerChildHandler } from "./child-handlers.ts";

export interface SelfToken {
	readonly kind: "self";
	readonly children: readonly ChildValue[];
}

let installed = false;

export function ensureSelfRuntime(): void {
	if (installed) {
		return;
	}

	installed = true;
	registerChildHandler({
		test: (value): value is SelfToken =>
			typeof value === "object" &&
			value !== null &&
			(value as { kind?: string }).kind === "self",
		handle(target, value) {
			if (!isComponentHostElement(target)) {
				throw new Error(
					"Camado Self(...) must be the first render value and can only target the component host.",
				);
			}

			const token = value as SelfToken;
			for (const child of token.children) {
				appendChildValue(target, child);
			}
		},
	});
}

export function Self(...children: readonly ChildValue[]): SelfToken {
	ensureSelfRuntime();
	return {
		kind: "self",
		children,
	};
}

export function isSelfToken(value: unknown): value is SelfToken {
	return (
		typeof value === "object" &&
		value !== null &&
		(value as { kind?: string }).kind === "self"
	);
}

import { registerChildHandler } from "../core/child-handlers.ts";

let installed = false;

export function ensureAttributeRuntime(): void {
	if (installed) {
		return;
	}

	installed = true;
	registerChildHandler({
		test: (
			value,
		): value is { kind: "modifier"; attributes: Record<string, unknown> } =>
			typeof value === "object" &&
			value !== null &&
			(value as { kind?: string }).kind === "modifier",
		handle(target, value) {
			const element = target as ParentNode & {
				setAttribute?: (name: string, value: string) => void;
				removeAttribute?: (name: string) => void;
			};
			if (typeof element.setAttribute !== "function") return;
			const attributes = (value as { attributes: Record<string, unknown> })
				.attributes;
			for (const [name, raw] of Object.entries(attributes)) {
				if (raw === null || raw === undefined || raw === false) {
					element.removeAttribute?.(name);
					continue;
				}
				if (raw === true) {
					element.setAttribute(name, "");
					continue;
				}
				element.setAttribute(name, String(raw));
			}
		},
	});
}

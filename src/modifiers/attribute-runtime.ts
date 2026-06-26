import { registerChildHandler } from "../core/child-handlers.ts";

let installed = false;

function splitClassNames(value: string): string[] {
	return value.split(/\s+/).filter(Boolean);
}

function mergeClassNames(...values: string[]): string {
	return [...new Set(values.flatMap(splitClassNames))].join(" ");
}

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
				classList?: { add?: (...classes: string[]) => void };
				getAttribute?: (name: string) => string | null;
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
				if (name === "class") {
					const classNames = splitClassNames(String(raw));
					const current = element.getAttribute?.("class") ?? "";
					const merged = mergeClassNames(current, ...classNames);

					if (typeof element.classList?.add === "function") {
						element.classList.add(...classNames);
					}

					if (merged) {
						element.setAttribute("class", merged);
					} else {
						element.removeAttribute?.("class");
					}
					continue;
				}
				element.setAttribute(name, String(raw));
			}
		},
	});
}

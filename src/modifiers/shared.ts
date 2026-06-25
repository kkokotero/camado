export abstract class FacadeBase {}

export function toKebabCase(value: string): string {
	return value
		.replace(/([a-z0-9])([A-Z])/g, "$1-$2")
		.replace(/([A-Z]+)([A-Z][a-z0-9]+)/g, "$1-$2")
		.toLowerCase();
}

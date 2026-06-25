export type PrimitiveChild =
	| string
	| number
	| bigint
	| boolean
	| null
	| undefined;

export function isPrimitiveChild(value: unknown): value is PrimitiveChild {
	switch (typeof value) {
		case "string":
		case "number":
		case "bigint":
		case "boolean":
			return true;
		case "undefined":
			return true;
		case "object":
			return value === null;
		default:
			return false;
	}
}

export function toTextValue(
	value: Exclude<PrimitiveChild, null | undefined>,
): string {
	return String(value);
}

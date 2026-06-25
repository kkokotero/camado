export type ValidationPath = readonly (string | number)[];

export interface ValidationIssue {
	readonly code: string;
	readonly message: string;
	readonly path: ValidationPath;
	readonly expected?: string;
	readonly received?: string;
}

export class ValidationError extends Error {
	readonly issues: readonly ValidationIssue[];

	constructor(issues: readonly ValidationIssue[]) {
		super(issues[0]?.message ?? "Validation failed");
		this.name = "ValidationError";
		this.issues = issues;
	}
}

export type SafeParseResult<T> =
	| { readonly success: true; readonly data: T }
	| { readonly success: false; readonly error: ValidationError };

export type ValidatorParser<T> = (input: unknown, path?: ValidationPath) => T;

export function prefixValidationError(
	error: unknown,
	path: ValidationPath,
	key: string | number,
): ValidationError {
	if (error instanceof ValidationError) {
		return new ValidationError(
			error.issues.map((issue) => ({
				...issue,
				path: [...path, key, ...issue.path],
			})),
		);
	}

	throw error;
}

export function describeValue(value: unknown): string {
	if (typeof value === "string") {
		return JSON.stringify(value);
	}

	if (
		typeof value === "number" ||
		typeof value === "boolean" ||
		typeof value === "bigint"
	) {
		return String(value);
	}

	if (value === null) {
		return "null";
	}

	if (value === undefined) {
		return "undefined";
	}

	if (value instanceof Date) {
		return value.toISOString();
	}

	return Object.prototype.toString.call(value);
}

export function isEmptyValue(value: unknown): boolean {
	return value === "" || value === undefined || value === null;
}

import {
	describeValue,
	prefixValidationError,
	type SafeParseResult,
	ValidationError,
	type ValidationIssue,
	type ValidationPath,
	type ValidatorParser,
} from "./shared.ts";

abstract class Schema<T> {
	#compiled?: ValidatorParser<T>;
	#optional = false;
	#nullable = false;
	#defaultValue?: T | (() => T);
	#refinements: Array<{
		code: string;
		message: string;
		predicate: (value: T) => boolean;
	}> = [];
	#transforms: Array<(value: T) => T> = [];

	optional(): this {
		this.#optional = true;
		this.#compiled = undefined;
		return this;
	}

	nullable(): this {
		this.#nullable = true;
		this.#compiled = undefined;
		return this;
	}

	default(value: T | (() => T)): this {
		this.#defaultValue = value;
		this.#compiled = undefined;
		return this;
	}

	refine(
		predicate: (value: T) => boolean,
		message = "Invalid value",
		code = "custom",
	): this {
		this.#refinements.push({ predicate, message, code });
		this.#compiled = undefined;
		return this;
	}

	transform(mapper: (value: T) => T): this {
		this.#transforms.push(mapper);
		this.#compiled = undefined;
		return this;
	}

	compile(): ValidatorParser<T> {
		if (!this.#compiled) {
			this.#compiled = (input, path = []) => {
				if (input === undefined) {
					if (this.#defaultValue !== undefined) {
						return typeof this.#defaultValue === "function"
							? (this.#defaultValue as () => T)()
							: this.#defaultValue;
					}

					if (this.#optional) {
						return undefined as T;
					}

					throw new ValidationError([
						{
							code: "required",
							message: "Required",
							path,
						},
					]);
				}

				if (input === null) {
					if (this.#nullable) {
						return null as T;
					}

					throw new ValidationError([
						{
							code: "null",
							message: "Expected a value",
							path,
							received: "null",
						},
					]);
				}

				let value = this.validate(input, path);

				for (const refinement of this.#refinements) {
					if (refinement.predicate(value)) {
						continue;
					}

					throw new ValidationError([
						{
							code: refinement.code,
							message: refinement.message,
							path,
						},
					]);
				}

				for (const transform of this.#transforms) {
					value = transform(value);
				}

				return value;
			};
		}

		return this.#compiled;
	}

	parse(input: unknown): T {
		return this.compile()(input);
	}

	safeParse(input: unknown): SafeParseResult<T> {
		try {
			return { success: true, data: this.parse(input) };
		} catch (error) {
			if (error instanceof ValidationError) {
				return { success: false, error };
			}

			throw error;
		}
	}

	is(input: unknown): input is T {
		return this.safeParse(input).success;
	}

	protected abstract validate(input: unknown, path: ValidationPath): T;
}

class StringSchema extends Schema<string> {
	#min?: number;
	#max?: number;
	#email = false;
	#url = false;
	#uuid = false;
	#pattern?: RegExp;
	#trim = false;
	#lowercase = false;
	#uppercase = false;
	#startsWith?: string;
	#endsWith?: string;
	#includes?: string;
	#oneOf?: readonly string[];

	trim(): this {
		this.#trim = true;
		return this;
	}

	lowercase(): this {
		this.#lowercase = true;
		return this;
	}

	uppercase(): this {
		this.#uppercase = true;
		return this;
	}

	min(length: number): this {
		this.#min = length;
		return this;
	}

	max(length: number): this {
		this.#max = length;
		return this;
	}

	length(length: number): this {
		return this.min(length).max(length);
	}

	nonempty(): this {
		return this.min(1);
	}

	email(): this {
		this.#email = true;
		return this;
	}

	url(): this {
		this.#url = true;
		return this;
	}

	uuid(): this {
		this.#uuid = true;
		return this;
	}

	regex(pattern: RegExp): this {
		this.#pattern = pattern;
		return this;
	}

	startsWith(prefix: string): this {
		this.#startsWith = prefix;
		return this;
	}

	endsWith(suffix: string): this {
		this.#endsWith = suffix;
		return this;
	}

	includes(part: string): this {
		this.#includes = part;
		return this;
	}

	oneOf(values: readonly string[]): this {
		this.#oneOf = values;
		return this;
	}

	protected validate(input: unknown, path: ValidationPath): string {
		if (typeof input !== "string") {
			throw new ValidationError([
				{
					code: "string",
					message: "Expected string",
					path,
					received: describeValue(input),
				},
			]);
		}

		let value = input;
		if (this.#trim) {
			value = value.trim();
		}
		if (this.#lowercase) {
			value = value.toLowerCase();
		}
		if (this.#uppercase) {
			value = value.toUpperCase();
		}

		if (this.#min !== undefined && value.length < this.#min) {
			throw new ValidationError([
				{
					code: "min_length",
					message: `Expected at least ${this.#min} characters`,
					path,
				},
			]);
		}

		if (this.#max !== undefined && value.length > this.#max) {
			throw new ValidationError([
				{
					code: "max_length",
					message: `Expected at most ${this.#max} characters`,
					path,
				},
			]);
		}

		if (this.#email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
			throw new ValidationError([
				{
					code: "email",
					message: "Expected a valid email address",
					path,
				},
			]);
		}

		if (this.#url) {
			try {
				new URL(value);
			} catch {
				throw new ValidationError([
					{
						code: "url",
						message: "Expected a valid URL",
						path,
					},
				]);
			}
		}

		if (
			this.#uuid &&
			!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
				value,
			)
		) {
			throw new ValidationError([
				{
					code: "uuid",
					message: "Expected a valid UUID",
					path,
				},
			]);
		}

		if (this.#pattern && !this.#pattern.test(value)) {
			throw new ValidationError([
				{
					code: "pattern",
					message: "Value does not match the expected pattern",
					path,
				},
			]);
		}

		if (this.#startsWith !== undefined && !value.startsWith(this.#startsWith)) {
			throw new ValidationError([
				{
					code: "starts_with",
					message: `Expected to start with ${this.#startsWith}`,
					path,
				},
			]);
		}

		if (this.#endsWith !== undefined && !value.endsWith(this.#endsWith)) {
			throw new ValidationError([
				{
					code: "ends_with",
					message: `Expected to end with ${this.#endsWith}`,
					path,
				},
			]);
		}

		if (this.#includes !== undefined && !value.includes(this.#includes)) {
			throw new ValidationError([
				{
					code: "includes",
					message: `Expected to include ${this.#includes}`,
					path,
				},
			]);
		}

		if (this.#oneOf && !this.#oneOf.includes(value)) {
			throw new ValidationError([
				{
					code: "one_of",
					message: `Expected one of ${this.#oneOf.map((item) => JSON.stringify(item)).join(", ")}`,
					path,
					received: describeValue(value),
				},
			]);
		}

		return value;
	}
}

class NumberSchema extends Schema<number> {
	#min?: number;
	#max?: number;
	#integer = false;
	#finite = false;
	#multipleOf?: number;

	min(value: number): this {
		this.#min = value;
		return this;
	}

	max(value: number): this {
		this.#max = value;
		return this;
	}

	between(min: number, max: number): this {
		return this.min(min).max(max);
	}

	int(): this {
		this.#integer = true;
		return this;
	}

	finite(): this {
		this.#finite = true;
		return this;
	}

	positive(): this {
		return this.min(Number.EPSILON);
	}

	nonnegative(): this {
		return this.min(0);
	}

	multipleOf(step: number): this {
		this.#multipleOf = step;
		return this;
	}

	protected validate(input: unknown, path: ValidationPath): number {
		if (typeof input !== "number" || Number.isNaN(input)) {
			throw new ValidationError([
				{
					code: "number",
					message: "Expected number",
					path,
					received: describeValue(input),
				},
			]);
		}

		if (this.#finite && !Number.isFinite(input)) {
			throw new ValidationError([
				{
					code: "finite",
					message: "Expected a finite number",
					path,
				},
			]);
		}

		if (this.#integer && !Number.isInteger(input)) {
			throw new ValidationError([
				{
					code: "integer",
					message: "Expected an integer",
					path,
				},
			]);
		}

		if (this.#min !== undefined && input < this.#min) {
			throw new ValidationError([
				{
					code: "min",
					message: `Expected at least ${this.#min}`,
					path,
				},
			]);
		}

		if (this.#max !== undefined && input > this.#max) {
			throw new ValidationError([
				{
					code: "max",
					message: `Expected at most ${this.#max}`,
					path,
				},
			]);
		}

		if (this.#multipleOf !== undefined && input % this.#multipleOf !== 0) {
			throw new ValidationError([
				{
					code: "multiple_of",
					message: `Expected a multiple of ${this.#multipleOf}`,
					path,
				},
			]);
		}

		return input;
	}
}

class BooleanSchema extends Schema<boolean> {
	truthy(): this {
		return this.refine((value) => value === true, "Expected true", "truthy");
	}

	falsy(): this {
		return this.refine((value) => value === false, "Expected false", "falsy");
	}

	protected validate(input: unknown, path: ValidationPath): boolean {
		if (typeof input !== "boolean") {
			throw new ValidationError([
				{
					code: "boolean",
					message: "Expected boolean",
					path,
					received: describeValue(input),
				},
			]);
		}

		return input;
	}
}

class DateSchema extends Schema<Date> {
	#before?: Date;
	#after?: Date;

	before(date: Date): this {
		this.#before = date;
		return this;
	}

	after(date: Date): this {
		this.#after = date;
		return this;
	}

	between(start: Date, end: Date): this {
		return this.after(start).before(end);
	}

	past(): this {
		return this.before(new Date());
	}

	future(): this {
		return this.after(new Date());
	}

	protected validate(input: unknown, path: ValidationPath): Date {
		const value =
			input instanceof Date
				? input
				: typeof input === "string" && input.length > 0
					? new Date(input)
					: null;

		if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
			throw new ValidationError([
				{
					code: "date",
					message: "Expected date",
					path,
					received: describeValue(input),
				},
			]);
		}

		if (this.#before !== undefined && !(value < this.#before)) {
			throw new ValidationError([
				{
					code: "before",
					message: `Expected before ${this.#before.toISOString()}`,
					path,
				},
			]);
		}

		if (this.#after !== undefined && !(value > this.#after)) {
			throw new ValidationError([
				{
					code: "after",
					message: `Expected after ${this.#after.toISOString()}`,
					path,
				},
			]);
		}

		return value;
	}
}

class LiteralSchema<TLiteral> extends Schema<TLiteral> {
	constructor(readonly value: TLiteral) {
		super();
	}

	protected validate(input: unknown, path: ValidationPath): TLiteral {
		if (!Object.is(input, this.value)) {
			throw new ValidationError([
				{
					code: "literal",
					message: `Expected ${JSON.stringify(this.value)}`,
					path,
					expected: JSON.stringify(this.value),
					received: describeValue(input),
				},
			]);
		}

		return this.value;
	}
}

class EnumSchema<
	TValue extends string | number | symbol,
> extends Schema<TValue> {
	constructor(readonly values: readonly TValue[]) {
		super();
	}

	protected validate(input: unknown, path: ValidationPath): TValue {
		if (!this.values.some((value) => Object.is(value, input))) {
			throw new ValidationError([
				{
					code: "enum",
					message: `Expected one of ${this.values.map((value) => JSON.stringify(value)).join(", ")}`,
					path,
					received: describeValue(input),
				},
			]);
		}

		return input as TValue;
	}
}

type SchemaOutput<TSchema> =
	TSchema extends Schema<infer TOutput> ? TOutput : never;

type ObjectShape = Record<string, Schema<any>>;

type ObjectOutput<TShape extends ObjectShape> = {
	[K in keyof TShape]: SchemaOutput<TShape[K]>;
};

class ArraySchema<TItem> extends Schema<TItem[]> {
	#min?: number;
	#max?: number;

	constructor(readonly item: Schema<TItem>) {
		super();
	}

	min(length: number): this {
		this.#min = length;
		return this;
	}

	max(length: number): this {
		this.#max = length;
		return this;
	}

	nonempty(): this {
		return this.min(1);
	}

	protected validate(input: unknown, path: ValidationPath): TItem[] {
		if (!Array.isArray(input)) {
			throw new ValidationError([
				{
					code: "array",
					message: "Expected array",
					path,
					received: describeValue(input),
				},
			]);
		}

		if (this.#min !== undefined && input.length < this.#min) {
			throw new ValidationError([
				{
					code: "min_items",
					message: `Expected at least ${this.#min} items`,
					path,
				},
			]);
		}

		if (this.#max !== undefined && input.length > this.#max) {
			throw new ValidationError([
				{
					code: "max_items",
					message: `Expected at most ${this.#max} items`,
					path,
				},
			]);
		}

		const parseItem = this.item.compile();
		return input.map((value, index) => {
			try {
				return parseItem(value, [...path, index]);
			} catch (error) {
				throw prefixValidationError(error, path, index);
			}
		});
	}
}

class ObjectSchema<TShape extends ObjectShape> extends Schema<
	ObjectOutput<TShape>
> {
	constructor(readonly shape: TShape) {
		super();
	}

	protected validate(
		input: unknown,
		path: ValidationPath,
	): ObjectOutput<TShape> {
		if (typeof input !== "object" || input === null || Array.isArray(input)) {
			throw new ValidationError([
				{
					code: "object",
					message: "Expected object",
					path,
					received: describeValue(input),
				},
			]);
		}

		const source = input as Record<string, unknown>;
		const out = {} as ObjectOutput<TShape>;

		for (const [key, schema] of Object.entries(this.shape) as Array<
			[keyof TShape & string, TShape[keyof TShape]]
		>) {
			const parseChild = schema.compile();
			try {
				out[key] = parseChild(source[key], [
					...path,
					key,
				]) as ObjectOutput<TShape>[typeof key];
			} catch (error) {
				throw prefixValidationError(error, path, key);
			}
		}

		return out;
	}
}

class UnionSchema<TSchemas extends readonly Schema<any>[]> extends Schema<
	SchemaOutput<TSchemas[number]>
> {
	constructor(readonly schemas: TSchemas) {
		super();
	}

	protected validate(
		input: unknown,
		path: ValidationPath,
	): SchemaOutput<TSchemas[number]> {
		const errors: ValidationIssue[] = [];

		for (const schema of this.schemas) {
			try {
				return schema.compile()(input, path);
			} catch (error) {
				if (error instanceof ValidationError) {
					errors.push(...error.issues);
					continue;
				}

				throw error;
			}
		}

		throw new ValidationError(
			errors.length > 0
				? errors
				: [
						{
							code: "union",
							message: "No union variant matched",
							path,
						},
					],
		);
	}
}

export const Validator = {
	string: () => new StringSchema(),
	number: () => new NumberSchema(),
	boolean: () => new BooleanSchema(),
	date: () => new DateSchema(),
	literal: <TLiteral>(value: TLiteral) => new LiteralSchema(value),
	enum: <
		const TValue extends readonly [
			string | number | symbol,
			...Array<string | number | symbol>,
		],
	>(
		values: TValue,
	) => new EnumSchema(values),
	array: <TItem>(item: Schema<TItem>) => new ArraySchema(item),
	object: <TShape extends ObjectShape>(shape: TShape) =>
		new ObjectSchema(shape),
	union: <const TSchemas extends readonly [Schema<any>, ...Schema<any>[]]>(
		...schemas: TSchemas
	) => new UnionSchema(schemas),
};

export const V = Validator;

export type Infer<TSchema extends Schema<any>> = SchemaOutput<TSchema>;

export type { Schema };

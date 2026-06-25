import { registerChildHandler } from "../core/child-handlers.ts";
import { getCurrentRenderTarget } from "../core/render-context.ts";
import {
	ValidationError,
	type ValidationIssue,
	type ValidatorParser,
	isEmptyValue,
} from "./shared.ts";

export interface FormFieldState<TValue> {
	readonly kind: "form-field";
	readonly name: string;
	readonly type:
		| "text"
		| "email"
		| "url"
		| "uuid"
		| "number"
		| "boolean"
		| "date"
		| "custom";
	value: TValue;
	touched: boolean;
	dirty: boolean;
	valid: boolean;
	message: string | null;
	readonly errors: readonly ValidationIssue[];
	verify(): boolean;
	clear(): void;
	reset(value?: TValue): void;
	set(value: TValue): void;
	subscribe(listener: (field: FormFieldState<TValue>) => void): () => void;
	bindElement(element: Element): void;
}

type FieldRule<TValue> = {
	readonly code: string;
	readonly check: (value: TValue) => boolean;
	readonly message?: string;
};

abstract class FieldBlueprint<TValue> {
	readonly kind:
		| "text"
		| "email"
		| "url"
		| "uuid"
		| "number"
		| "boolean"
		| "date"
		| "custom";
	#defaultMessage: string | undefined;
	#rules: FieldRule<TValue>[] = [];
	#initialValue?: TValue | (() => TValue);

	constructor(kind: FormFieldState<TValue>["type"]) {
		this.kind = kind;
	}

	message(message: string): this {
		this.#defaultMessage = message;
		return this;
	}

	custom(
		check: (value: TValue) => boolean,
		message = "Invalid value",
		code = "custom",
	): this {
		this.#rules.push({ check, message, code });
		return this;
	}

	required(message = "Required"): this {
		return this.custom((value) => !isEmptyValue(value), message, "required");
	}

	optional(): this {
		return this.custom(
			(value) => value === undefined || value === null || !isEmptyValue(value),
			"",
			"optional",
		);
	}

	default(value: TValue | (() => TValue)): this {
		this.#initialValue = value;
		return this;
	}

	compile(): ValidatorParser<TValue> {
		return (input) => this.parseValue(input);
	}

	create(name: string, initialValue?: TValue): FormFieldState<TValue> {
		return new FormFieldController(name, this, initialValue);
	}

	protected abstract coerce(input: unknown): TValue;

	parseValue(input: unknown): TValue {
		if (input === undefined || input === null) {
			if (this.#initialValue !== undefined) {
				return typeof this.#initialValue === "function"
					? (this.#initialValue as () => TValue)()
					: this.#initialValue;
			}
		}

		const value = this.coerce(input);
		const issues = this.validateValue(value);
		if (issues.length > 0) {
			throw new ValidationError(issues);
		}

		return value;
	}

	validateValue(value: TValue): ValidationIssue[] {
		const issues: ValidationIssue[] = [];
		for (const rule of this.#rules) {
			if (rule.check(value)) {
				continue;
			}

			issues.push({
				code: rule.code,
				message: rule.message ?? this.messageFallback("Invalid value"),
				path: [],
			});
			break;
		}

		return issues;
	}

	messageFallback(fallback: string): string {
		return this.#defaultMessage ?? fallback;
	}

	initialValue(): TValue {
		if (this.#initialValue !== undefined) {
			return typeof this.#initialValue === "function"
				? (this.#initialValue as () => TValue)()
				: this.#initialValue;
		}

		return this.defaultState();
	}

	protected abstract defaultState(): TValue;
}

class TextFieldBlueprint extends FieldBlueprint<string> {
	#trim = false;
	#lowercase = false;
	#uppercase = false;

	constructor(kind: "text" | "email" | "url" | "uuid" = "text") {
		super(kind);
	}

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

	min(length: number, message?: string): this {
		return this.custom(
			(value) => value.length >= length,
			message ?? `Minimum ${length} characters`,
			"min_length",
		);
	}

	max(length: number, message?: string): this {
		return this.custom(
			(value) => value.length <= length,
			message ?? `Maximum ${length} characters`,
			"max_length",
		);
	}

	length(length: number, message?: string): this {
		return this.custom(
			(value) => value.length === length,
			message ?? `Must be exactly ${length} characters`,
			"length",
		);
	}

	nonempty(message?: string): this {
		return this.required(message ?? "Required").min(1, message);
	}

	email(message?: string): this {
		return this.custom(
			(value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
			message ?? "Invalid email",
			"email",
		);
	}

	url(message?: string): this {
		return this.custom(
			(value) => {
				try {
					new URL(value);
					return true;
				} catch {
					return false;
				}
			},
			message ?? "Invalid URL",
			"url",
		);
	}

	uuid(message?: string): this {
		return this.custom(
			(value) =>
				/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
					value,
				),
			message ?? "Invalid UUID",
			"uuid",
		);
	}

	pattern(pattern: RegExp, message?: string): this {
		return this.custom(
			(value) => pattern.test(value),
			message ?? "Invalid format",
			"pattern",
		);
	}

	startsWith(prefix: string, message?: string): this {
		return this.custom(
			(value) => value.startsWith(prefix),
			message ?? `Must start with ${prefix}`,
			"starts_with",
		);
	}

	endsWith(suffix: string, message?: string): this {
		return this.custom(
			(value) => value.endsWith(suffix),
			message ?? `Must end with ${suffix}`,
			"ends_with",
		);
	}

	includes(part: string, message?: string): this {
		return this.custom(
			(value) => value.includes(part),
			message ?? `Must include ${part}`,
			"includes",
		);
	}

	oneOf(values: readonly string[], message?: string): this {
		return this.custom(
			(value) => values.includes(value),
			message ?? "Unexpected value",
			"one_of",
		);
	}

	protected coerce(input: unknown): string {
		let value = String(input ?? "");
		if (this.#trim) {
			value = value.trim();
		}
		if (this.#lowercase) {
			value = value.toLowerCase();
		}
		if (this.#uppercase) {
			value = value.toUpperCase();
		}
		return value;
	}

	override validateValue(value: string): ValidationIssue[] {
		const issues = super.validateValue(value);
		if (issues.length > 0) {
			return issues;
		}
		if (this.kind === "email") {
			return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
				? issues
				: [
						{
							code: "email",
							message: this.messageFallback("Invalid email"),
							path: [],
						},
					];
		}
		if (this.kind === "url") {
			try {
				new URL(value);
				return issues;
			} catch {
				return [
					{
						code: "url",
						message: this.messageFallback("Invalid URL"),
						path: [],
					},
				];
			}
		}
		if (this.kind === "uuid") {
			return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
				value,
			)
				? issues
				: [
						{
							code: "uuid",
							message: this.messageFallback("Invalid UUID"),
							path: [],
						},
					];
		}
		return issues;
	}

	protected defaultState(): string {
		return "";
	}
}

class NumberFieldBlueprint extends FieldBlueprint<number | undefined> {
	constructor() {
		super("number");
	}

	min(value: number, message?: string): this {
		return this.custom(
			(next) => next === undefined || next >= value,
			message ?? `Minimum ${value}`,
			"min",
		);
	}

	max(value: number, message?: string): this {
		return this.custom(
			(next) => next === undefined || next <= value,
			message ?? `Maximum ${value}`,
			"max",
		);
	}

	between(min: number, max: number, message?: string): this {
		return this.custom(
			(next) => next === undefined || (next >= min && next <= max),
			message ?? `Must be between ${min} and ${max}`,
			"between",
		);
	}

	int(message?: string): this {
		return this.custom(
			(next) => next === undefined || Number.isInteger(next),
			message ?? "Must be an integer",
			"int",
		);
	}

	finite(message?: string): this {
		return this.custom(
			(next) => next === undefined || Number.isFinite(next),
			message ?? "Must be finite",
			"finite",
		);
	}

	positive(message?: string): this {
		return this.custom(
			(next) => next === undefined || next > 0,
			message ?? "Must be positive",
			"positive",
		);
	}

	nonnegative(message?: string): this {
		return this.custom(
			(next) => next === undefined || next >= 0,
			message ?? "Must be nonnegative",
			"nonnegative",
		);
	}

	multipleOf(step: number, message?: string): this {
		return this.custom(
			(next) => next === undefined || next % step === 0,
			message ?? `Must be a multiple of ${step}`,
			"multiple_of",
		);
	}

	protected coerce(input: unknown): number | undefined {
		if (input === "" || input === undefined || input === null) {
			return undefined;
		}
		const value = typeof input === "number" ? input : Number(input);
		return Number.isNaN(value) ? undefined : value;
	}

	protected defaultState(): number | undefined {
		return undefined;
	}
}

class BooleanFieldBlueprint extends FieldBlueprint<boolean> {
	constructor() {
		super("boolean");
	}

	truthy(message?: string): this {
		return this.custom(
			(value) => value === true,
			message ?? "Must be true",
			"truthy",
		);
	}

	falsy(message?: string): this {
		return this.custom(
			(value) => value === false,
			message ?? "Must be false",
			"falsy",
		);
	}

	protected coerce(input: unknown): boolean {
		return input === true || input === "true" || input === 1 || input === "1";
	}

	protected defaultState(): boolean {
		return false;
	}
}

class DateFieldBlueprint extends FieldBlueprint<Date | undefined> {
	constructor() {
		super("date");
	}

	before(date: Date, message?: string): this {
		return this.custom(
			(value) => value === undefined || value < date,
			message ?? `Must be before ${date.toISOString()}`,
			"before",
		);
	}

	after(date: Date, message?: string): this {
		return this.custom(
			(value) => value === undefined || value > date,
			message ?? `Must be after ${date.toISOString()}`,
			"after",
		);
	}

	between(start: Date, end: Date, message?: string): this {
		return this.custom(
			(value) => value === undefined || (value >= start && value <= end),
			message ?? "Out of range",
			"between",
		);
	}

	past(message?: string): this {
		return this.custom(
			(value) => value === undefined || value < new Date(),
			message ?? "Must be in the past",
			"past",
		);
	}

	future(message?: string): this {
		return this.custom(
			(value) => value === undefined || value > new Date(),
			message ?? "Must be in the future",
			"future",
		);
	}

	protected coerce(input: unknown): Date | undefined {
		if (input instanceof Date) {
			return input;
		}
		if (typeof input === "string" && input.length > 0) {
			const next = new Date(input);
			return Number.isNaN(next.getTime()) ? undefined : next;
		}
		return undefined;
	}

	protected defaultState(): Date | undefined {
		return undefined;
	}
}

export type FieldValue<TField> =
	TField extends FieldBlueprint<infer TValue> ? TValue : never;

export interface FormSnapshot<
	TShape extends Record<string, FieldBlueprint<any>>,
> {
	readonly values: { [K in keyof TShape]: FieldValue<TShape[K]> };
	readonly valid: boolean;
	readonly invalid: boolean;
	readonly touched: boolean;
	readonly untouched: boolean;
	readonly dirty: boolean;
	readonly pristine: boolean;
	readonly hasErrors: boolean;
	readonly errors: ValidationIssue[];
}

export interface FormController<
	TShape extends Record<string, FieldBlueprint<any>>,
> {
	readonly field: {
		[K in keyof TShape]: FormFieldState<FieldValue<TShape[K]>>;
	};
	readonly values: { [K in keyof TShape]: FieldValue<TShape[K]> };
	readonly valid: boolean;
	readonly invalid: boolean;
	readonly touched: boolean;
	readonly untouched: boolean;
	readonly dirty: boolean;
	readonly pristine: boolean;
	readonly hasErrors: boolean;
	readonly errors: ValidationIssue[];
	readonly state: FormSnapshot<TShape>;
	verify(): boolean;
	touch(): void;
	clear(): void;
	reset(values?: Partial<{ [K in keyof TShape]: FieldValue<TShape[K]> }>): void;
	set(values: Partial<{ [K in keyof TShape]: FieldValue<TShape[K]> }>): void;
	submit(): FormSnapshot<TShape> | null;
	subscribe(listener: (form: FormController<TShape>) => void): () => void;
}

class FormFieldController<TValue> implements FormFieldState<TValue> {
	readonly kind = "form-field" as const;
	readonly type: FormFieldState<TValue>["type"];
	readonly #listeners = new Set<(field: FormFieldState<TValue>) => void>();
	readonly #bound = new Set<Element>();
	#value: TValue;
	#initialValue: TValue;
	#touched = false;
	#dirty = false;
	#valid = true;
	#message: string | null = null;
	#errors: readonly ValidationIssue[] = [];

	constructor(
		readonly name: string,
		readonly blueprint: FieldBlueprint<TValue>,
		initialValue?: TValue,
	) {
		this.type = blueprint.kind;
		this.#initialValue = initialValue ?? blueprint.initialValue();
		this.#value = this.#initialValue;
		this.#revalidate();
	}

	get value(): TValue {
		return this.#value;
	}

	set value(next: TValue) {
		this.set(next);
	}

	get touched(): boolean {
		return this.#touched;
	}

	set touched(next: boolean) {
		this.#touched = next;
		this.#emit();
	}

	get dirty(): boolean {
		return this.#dirty;
	}

	get valid(): boolean {
		return this.#valid;
	}

	get message(): string | null {
		return this.#message;
	}

	get errors(): readonly ValidationIssue[] {
		return this.#errors;
	}

	verify(): boolean {
		this.#touched = true;
		this.#revalidate();
		this.#emit();
		return this.#valid;
	}

	clear(): void {
		this.#value = this.#initialValue;
		this.#touched = false;
		this.#dirty = false;
		this.#revalidate();
		this.#syncBindings();
		this.#emit();
	}

	reset(value?: TValue): void {
		this.#initialValue = value ?? this.#initialValue;
		this.clear();
	}

	set(next: TValue): void {
		this.#dirty = !Object.is(this.#value, next) || this.#dirty;
		this.#value = next;
		this.#revalidate();
		this.#syncBindings();
		this.#emit();
	}

	subscribe(listener: (field: FormFieldState<TValue>) => void): () => void {
		this.#listeners.add(listener);
		return () => this.#listeners.delete(listener);
	}

	bindElement(element: Element): void {
		if (this.#bound.has(element)) {
			return;
		}

		this.#bound.add(element);
		this.#syncElement(element);

		const blur = () => {
			this.#touched = true;
			this.#syncElement(element);
			this.#emit();
		};

		const update = () => {
			this.set(readElementValue(element, this.type) as TValue);
		};

		const eventName = this.type === "boolean" ? "change" : "input";
		element.addEventListener?.(eventName, update);
		element.addEventListener?.("change", update);
		element.addEventListener?.("blur", blur);
	}

	#emit(): void {
		for (const listener of this.#listeners) {
			listener(this);
		}
	}

	#revalidate(): void {
		try {
			this.blueprint.compile()(this.#value);
			this.#valid = true;
			this.#message = null;
			this.#errors = [];
		} catch (error) {
			if (error instanceof ValidationError) {
				this.#valid = false;
				this.#errors = error.issues;
				this.#message = error.issues[0]?.message ?? null;
				return;
			}

			throw error;
		}
	}

	#syncBindings(): void {
		for (const element of this.#bound) {
			this.#syncElement(element);
		}
	}

	#syncElement(element: Element): void {
		writeElementValue(element, this.#value, this.type);
		if (typeof element.setAttribute === "function") {
			element.setAttribute(
				"aria-invalid",
				String(!this.#valid && this.#touched),
			);
		}
	}
}

function isFieldController(value: unknown): value is FormFieldState<unknown> {
	return (
		typeof value === "object" &&
		value !== null &&
		"kind" in value &&
		(value as { kind?: string }).kind === "form-field"
	);
}

function readElementValue(
	element: Element,
	kind: FormFieldState<unknown>["type"],
): unknown {
	const input = element as HTMLInputElement & {
		valueAsNumber?: number;
		valueAsDate?: Date | null;
	};
	if (kind === "boolean") {
		return Boolean((input as HTMLInputElement).checked);
	}
	if (kind === "number") {
		const raw = (input as HTMLInputElement).value;
		if (raw === "") {
			return undefined;
		}
		const number = input.valueAsNumber ?? Number(raw);
		return Number.isNaN(number) ? undefined : number;
	}
	if (kind === "date") {
		if (input.valueAsDate instanceof Date) {
			return input.valueAsDate;
		}
		const raw = (input as HTMLInputElement).value;
		return raw ? new Date(raw) : undefined;
	}
	return (input as HTMLInputElement).value ?? "";
}

function writeElementValue(
	element: Element,
	value: unknown,
	kind: FormFieldState<unknown>["type"],
): void {
	const input = element as HTMLInputElement & { valueAsDate?: Date | null };
	if (kind === "boolean") {
		input.checked = Boolean(value);
		return;
	}
	if (kind === "number") {
		input.value = value === undefined || value === null ? "" : String(value);
		return;
	}
	if (kind === "date") {
		input.value = value instanceof Date ? value.toISOString().slice(0, 10) : "";
		return;
	}
	input.value = value === undefined || value === null ? "" : String(value);
}

function bindField(target: ParentNode, field: FormFieldState<unknown>): void {
	if (
		typeof target !== "object" ||
		target === null ||
		!("addEventListener" in target)
	) {
		return;
	}

	field.bindElement(target as Element);
}

export function isFieldBinding(
	value: unknown,
): value is FormFieldState<unknown> {
	return isFieldController(value);
}

registerChildHandler({
	test: isFieldBinding,
	handle(target, value) {
		bindField(target, value as FormFieldState<unknown>);
	},
});

export const Field = {
	text: () => new TextFieldBlueprint("text"),
	email: () => new TextFieldBlueprint("email"),
	url: () => new TextFieldBlueprint("url"),
	uuid: () => new TextFieldBlueprint("uuid"),
	number: () => new NumberFieldBlueprint(),
	boolean: () => new BooleanFieldBlueprint(),
	date: () => new DateFieldBlueprint(),
};

export const Forms = {
	create<const TShape extends Record<string, FieldBlueprint<any>>>(
		shape: TShape,
	): FormController<TShape> {
		const listeners = new Set<(form: FormController<TShape>) => void>();
		const fields = Object.fromEntries(
			Object.entries(shape).map(([name, blueprint]) => [
				name,
				blueprint.create(name),
			]),
		) as FormController<TShape>["field"];

		const renderTargets = new WeakSet<{ requestUpdate(): void }>();
		const trackRenderTarget = () => {
			const target = getCurrentRenderTarget();
			if (!target || renderTargets.has(target)) {
				return;
			}

			renderTargets.add(target);
			listeners.add(() => target.requestUpdate());
		};

		const notify = () => {
			for (const listener of listeners) {
				listener(form);
			}
		};

		for (const field of Object.values(fields)) {
			field.subscribe(() => notify());
		}

		const snapshot = (): FormSnapshot<TShape> => {
			const values = Object.fromEntries(
				Object.entries(fields).map(([name, field]) => [name, field.value]),
			) as FormSnapshot<TShape>["values"];
			const valid = Object.values(fields).every((field) => field.valid);
			const touched = Object.values(fields).some((field) => field.touched);
			const dirty = Object.values(fields).some((field) => field.dirty);
			const errors = Object.values(fields).flatMap((field) => field.errors);

			return {
				values,
				valid,
				invalid: !valid,
				touched,
				untouched: !touched,
				dirty,
				pristine: !dirty,
				hasErrors: errors.length > 0,
				errors,
			};
		};

		const form: FormController<TShape> = {
			get field() {
				trackRenderTarget();
				return fields;
			},
			get values() {
				trackRenderTarget();
				return snapshot().values;
			},
			get valid() {
				trackRenderTarget();
				return snapshot().valid;
			},
			get invalid() {
				trackRenderTarget();
				return snapshot().invalid;
			},
			get touched() {
				trackRenderTarget();
				return snapshot().touched;
			},
			get untouched() {
				trackRenderTarget();
				return snapshot().untouched;
			},
			get dirty() {
				trackRenderTarget();
				return snapshot().dirty;
			},
			get pristine() {
				trackRenderTarget();
				return snapshot().pristine;
			},
			get hasErrors() {
				trackRenderTarget();
				return snapshot().hasErrors;
			},
			get errors() {
				trackRenderTarget();
				return snapshot().errors;
			},
			get state() {
				trackRenderTarget();
				return snapshot();
			},
			verify() {
				return Object.values(fields).every((field) => field.verify());
			},
			touch() {
				for (const field of Object.values(fields)) {
					field.touched = true;
				}
			},
			clear() {
				for (const field of Object.values(fields)) {
					field.clear();
				}
			},
			reset(values) {
				for (const [name, field] of Object.entries(fields)) {
					field.reset(values?.[name as keyof typeof values] as never);
				}
			},
			set(values) {
				for (const [name, value] of Object.entries(values)) {
					const field = fields[name as keyof TShape];
					if (!field || value === undefined) {
						continue;
					}
					field.set(value as never);
				}
			},
			submit() {
				return form.verify() ? snapshot() : null;
			},
			subscribe(listener) {
				listeners.add(listener);
				return () => listeners.delete(listener);
			},
		};

		return form;
	},
};

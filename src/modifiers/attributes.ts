import { ensureAttributeRuntime } from "./attribute-runtime.ts";
import { FacadeBase, toKebabCase } from "./shared.ts";

type AttributeValue = string | number | bigint | boolean | null | undefined;

function splitClassNames(value: string): string[] {
	return value.split(/\s+/).filter(Boolean);
}

function mergeClassNames(...values: string[]): string {
	return [...new Set(values.flatMap(splitClassNames))].join(" ");
}

export interface AttributeFacade {
	readonly kind: "modifier";
	readonly attributes: Readonly<
		Record<string, string | boolean | number | bigint | null | undefined>
	>;
	attr(name: string, value: AttributeValue): this;
	attribute(name: string, value: AttributeValue): this;
	class(...values: string[]): this;
	viewBox(value: string): this;
	fill(value: string): this;
	stroke(value: string): this;
	strokeWidth(value: string | number): this;
	cx(value: string | number): this;
	cy(value: string | number): this;
	r(value: string | number): this;
	x(value: string | number): this;
	y(value: string | number): this;
	d(value: string): this;
	points(value: string): this;
	rx(value: string | number): this;
	ry(value: string | number): this;
	x1(value: string | number): this;
	x2(value: string | number): this;
	y1(value: string | number): this;
	y2(value: string | number): this;
	transform(value: string): this;
	preserveAspectRatio(value: string): this;
	id(value: string): this;
	role(value: string): this;
	title(value: string): this;
	tabIndex(value: number): this;
	disabled(value?: boolean): this;
	hidden(value?: boolean): this;
	width(value: string | number): this;
	height(value: string | number): this;
	name(value: string): this;
	type(value: string): this;
	value(value: AttributeValue): this;
	placeholder(value: string): this;
	href(value: string): this;
	src(value: string): this;
	alt(value: string): this;
	rel(value: string): this;
	target(value: string): this;
	autocomplete(value: string): this;
	required(value?: boolean): this;
	readOnly(value?: boolean): this;
	checked(value?: boolean): this;
	multiple(value?: boolean): this;
	min(value: string | number): this;
	max(value: string | number): this;
	step(value: string | number): this;
	pattern(value: string): this;
	aria(name: string, value: AttributeValue): this;
	data(name: string, value: AttributeValue): this;
}

export type AttributesFacade = AttributeFacade;

class AttributeBuilder extends FacadeBase implements AttributeFacade {
	readonly kind = "modifier" as const;
	#attributes: Record<string, AttributeValue> = {};

	get attributes() {
		return { ...this.#attributes } as const;
	}

	attr(name: string, value: AttributeValue): this {
		ensureAttributeRuntime();
		this.#attributes[name] = value;
		return this;
	}

	attribute(name: string, value: AttributeValue): this {
		return this.attr(name, value);
	}

	class(...values: string[]): this {
		if (values.length === 0) {
			return this;
		}

		const current = typeof this.#attributes.class === "string"
			? this.#attributes.class
			: "";
		return this.attr("class", mergeClassNames(current, ...values));
	}

	viewBox(value: string): this {
		return this.attr("viewBox", value);
	}

	fill(value: string): this {
		return this.attr("fill", value);
	}

	stroke(value: string): this {
		return this.attr("stroke", value);
	}

	strokeWidth(value: string | number): this {
		return this.attr("stroke-width", value);
	}

	cx(value: string | number): this {
		return this.attr("cx", value);
	}

	cy(value: string | number): this {
		return this.attr("cy", value);
	}

	r(value: string | number): this {
		return this.attr("r", value);
	}

	x(value: string | number): this {
		return this.attr("x", value);
	}

	y(value: string | number): this {
		return this.attr("y", value);
	}

	d(value: string): this {
		return this.attr("d", value);
	}

	points(value: string): this {
		return this.attr("points", value);
	}

	rx(value: string | number): this {
		return this.attr("rx", value);
	}

	ry(value: string | number): this {
		return this.attr("ry", value);
	}

	x1(value: string | number): this {
		return this.attr("x1", value);
	}

	x2(value: string | number): this {
		return this.attr("x2", value);
	}

	y1(value: string | number): this {
		return this.attr("y1", value);
	}

	y2(value: string | number): this {
		return this.attr("y2", value);
	}

	transform(value: string): this {
		return this.attr("transform", value);
	}

	preserveAspectRatio(value: string): this {
		return this.attr("preserveAspectRatio", value);
	}

	id(value: string): this {
		return this.attr("id", value);
	}

	role(value: string): this {
		return this.attr("role", value);
	}

	title(value: string): this {
		return this.attr("title", value);
	}

	tabIndex(value: number): this {
		return this.attr("tabindex", value);
	}

	disabled(value = true): this {
		return this.attr("disabled", value);
	}

	hidden(value = true): this {
		return this.attr("hidden", value);
	}

	width(value: string | number): this {
		return this.attr("width", value);
	}

	height(value: string | number): this {
		return this.attr("height", value);
	}

	name(value: string): this {
		return this.attr("name", value);
	}

	type(value: string): this {
		return this.attr("type", value);
	}

	value(value: AttributeValue): this {
		return this.attr("value", value);
	}

	placeholder(value: string): this {
		return this.attr("placeholder", value);
	}

	href(value: string): this {
		return this.attr("href", value);
	}

	src(value: string): this {
		return this.attr("src", value);
	}

	alt(value: string): this {
		return this.attr("alt", value);
	}

	rel(value: string): this {
		return this.attr("rel", value);
	}

	target(value: string): this {
		return this.attr("target", value);
	}

	autocomplete(value: string): this {
		return this.attr("autocomplete", value);
	}

	required(value = true): this {
		return this.attr("required", value);
	}

	readOnly(value = true): this {
		return this.attr("readOnly", value);
	}

	checked(value = true): this {
		return this.attr("checked", value);
	}

	multiple(value = true): this {
		return this.attr("multiple", value);
	}

	min(value: string | number): this {
		return this.attr("min", value);
	}

	max(value: string | number): this {
		return this.attr("max", value);
	}

	step(value: string | number): this {
		return this.attr("step", value);
	}

	pattern(value: string): this {
		return this.attr("pattern", value);
	}

	aria(name: string, value: AttributeValue): this {
		return this.attr(`aria-${toKebabCase(name)}`, value);
	}

	data(name: string, value: AttributeValue): this {
		return this.attr(`data-${toKebabCase(name)}`, value);
	}
}

function createAttributeStateFacade(
	builder: AttributeBuilder,
): AttributesFacade {
	return new Proxy(builder, {
		get(target, property, receiver) {
			if (property === "kind" || property === "attributes") {
				return Reflect.get(target, property, target);
			}

			if (typeof property !== "string") {
				return Reflect.get(target, property, receiver);
			}

			const direct = Reflect.get(target, property, target);
			if (typeof direct === "function") {
				return (...args: unknown[]) => {
					const result = (
						direct as (...methodArgs: unknown[]) => unknown
					).apply(target, args);
					return result === target ? receiver : result;
				};
			}

			if (property === "attr" || property === "attribute") {
				return (name: string, value: AttributeValue) => {
					target.attr(name, value);
					return receiver;
				};
			}

			if (property === "aria" || property === "data") {
				return (name: string, value: AttributeValue) => {
					target.attr(`${property}-${toKebabCase(name)}`, value);
					return receiver;
				};
			}

			if (property.startsWith("aria") && property !== "aria") {
				return (value: AttributeValue) => {
					target.attr(`aria-${toKebabCase(property.slice(4))}`, value);
					return receiver;
				};
			}

			if (property.startsWith("data") && property !== "data") {
				return (value: AttributeValue) => {
					target.attr(`data-${toKebabCase(property.slice(4))}`, value);
					return receiver;
				};
			}

			return (value: AttributeValue) => {
				target.attr(property, value);
				return receiver;
			};
		},
	}) as unknown as AttributesFacade;
}

function createAttributeFacade<
	T extends abstract new (
		...args: any[]
	) => object,
>(ctor: T): AttributesFacade {
	return new Proxy(ctor, {
		get(_target, property, receiver) {
			if (typeof property !== "string") {
				return Reflect.get(_target, property, receiver);
			}

			return (...args: unknown[]) => {
				const facade = createAttributeStateFacade(new AttributeBuilder());
				const method = Reflect.get(facade, property, facade);

				if (typeof method === "function") {
					return method(...args);
				}

				if (args.length === 1) {
					facade.attr(property, args[0] as AttributeValue);
				}

				return facade;
			};
		},
	}) as unknown as AttributesFacade;
}

export const Attributes = createAttributeFacade(AttributeBuilder);
export const Attribute = Attributes;

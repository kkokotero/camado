import {
	createStyleBuilder,
	ensureStyleRuntime,
	type StyleBuilder,
} from "./style-builder.ts";
import { FacadeBase } from "./shared.ts";

type CSSStylePropertyName = {
	[K in keyof CSSStyleDeclaration]-?: CSSStyleDeclaration[K] extends string
		? K
		: never;
}[keyof CSSStyleDeclaration] &
	string;

type StyleValue = string | number | { toString(): string };

type StylePropertyMethods = {
	[K in CSSStylePropertyName]: (value: StyleValue) => StyleBuilder;
};

export interface StyleFacade extends StylePropertyMethods {
	radius(value: StyleValue): StyleBuilder;
	set(name: string, value: StyleValue): StyleBuilder;
	pseudo(selector: string, apply: (style: StyleBuilder) => void): StyleBuilder;
	hover(apply: (style: StyleBuilder) => void): StyleBuilder;
	focus(apply: (style: StyleBuilder) => void): StyleBuilder;
	active(apply: (style: StyleBuilder) => void): StyleBuilder;
	before(apply: (style: StyleBuilder) => void): StyleBuilder;
	after(apply: (style: StyleBuilder) => void): StyleBuilder;
	media(query: string, apply: (style: StyleBuilder) => void): StyleBuilder;
	supports(query: string, apply: (style: StyleBuilder) => void): StyleBuilder;
}

export type InlineStyleFacade = StyleFacade;

class StyleBuilderFacade extends FacadeBase {}
class InlineStyleBuilderFacade extends FacadeBase {}

function createStyleFacade<T extends abstract new (...args: any[]) => object>(
	ctor: T,
	mode: "class" | "inline",
): StyleFacade {
	return new Proxy(ctor, {
		get(target, property, receiver) {
			if (typeof property !== "string") {
				return Reflect.get(target, property, receiver);
			}

			return (...args: unknown[]) => {
				ensureStyleRuntime();
				const builder = createStyleBuilder(mode);
				const method = Reflect.get(builder, property, builder);

				if (typeof method === "function") {
					return (method as (...methodArgs: unknown[]) => StyleBuilder).apply(
						builder,
						args,
					);
				}

				if (args.length === 1) {
					return builder.set(property, args[0] as StyleValue);
				}

				return builder;
			};
		},
	}) as unknown as StyleFacade;
}

export const Style = createStyleFacade(StyleBuilderFacade, "class");
export const InlineStyle = createStyleFacade(
	InlineStyleBuilderFacade,
	"inline",
);

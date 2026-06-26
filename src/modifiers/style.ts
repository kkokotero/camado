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

export type StyleToken = StyleFacade &
	Pick<StyleBuilder, "mode" | "toRecord" | "toSnapshot">;

type StylePropertyMethods = {
	[K in CSSStylePropertyName]: (value: StyleValue) => StyleToken;
};

export interface StyleFacade extends StylePropertyMethods {
	radius(value: StyleValue): StyleToken;
	set(name: string, value: StyleValue): StyleToken;
	pseudo(selector: string, apply: (style: StyleToken) => void): StyleToken;
	hover(apply: (style: StyleToken) => void): StyleToken;
	focus(apply: (style: StyleToken) => void): StyleToken;
	active(apply: (style: StyleToken) => void): StyleToken;
	before(apply: (style: StyleToken) => void): StyleToken;
	after(apply: (style: StyleToken) => void): StyleToken;
	media(query: string, apply: (style: StyleToken) => void): StyleToken;
	supports(query: string, apply: (style: StyleToken) => void): StyleToken;
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
					return (method as (...methodArgs: unknown[]) => StyleToken).apply(
						builder,
						args,
					) as StyleToken;
				}

				if (args.length === 1) {
					return builder.set(
						property,
						args[0] as StyleValue,
					) as unknown as StyleToken;
				}

				return builder as unknown as StyleToken;
			};
		},
	}) as unknown as StyleFacade;
}

export const Style = createStyleFacade(StyleBuilderFacade, "class");
export const InlineStyle = createStyleFacade(
	InlineStyleBuilderFacade,
	"inline",
);

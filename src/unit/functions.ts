import { CssFunction, CssText, type CssValueLike } from "./shared.ts";

export const Functions = {
	min(...values: readonly CssValueLike[]): CssFunction {
		return new CssFunction("min", values);
	},
	max(...values: readonly CssValueLike[]): CssFunction {
		return new CssFunction("max", values);
	},
	clamp(
		min: CssValueLike,
		preferred: CssValueLike,
		max: CssValueLike,
	): CssFunction {
		return new CssFunction("clamp", [min, preferred, max]);
	},
	rgb(red: CssValueLike, green: CssValueLike, blue: CssValueLike): CssFunction {
		return new CssFunction("rgb", [red, green, blue]);
	},
	rgba(
		red: CssValueLike,
		green: CssValueLike,
		blue: CssValueLike,
		alpha: CssValueLike,
	): CssFunction {
		return new CssFunction("rgba", [red, green, blue, alpha]);
	},
	hsl(
		hue: CssValueLike,
		saturation: CssValueLike,
		lightness: CssValueLike,
	): CssFunction {
		return new CssFunction("hsl", [hue, saturation, lightness]);
	},
	hsla(
		hue: CssValueLike,
		saturation: CssValueLike,
		lightness: CssValueLike,
		alpha: CssValueLike,
	): CssFunction {
		return new CssFunction("hsla", [hue, saturation, lightness, alpha]);
	},
	cubicBezier(
		x1: CssValueLike,
		y1: CssValueLike,
		x2: CssValueLike,
		y2: CssValueLike,
	): CssFunction {
		return new CssFunction("cubic-bezier", [x1, y1, x2, y2]);
	},
	translateZ(value: CssValueLike): CssFunction {
		return new CssFunction("translateZ", [value]);
	},
	calc(value: CssValueLike): CssFunction {
		return new CssFunction("calc", [value]);
	},
	fn(name: string, ...values: readonly CssValueLike[]): CssFunction {
		return new CssFunction(name, values);
	},
	boxShadow(
		offsetX: CssValueLike,
		offsetY: CssValueLike,
		blur: CssValueLike,
		color: CssValueLike,
		spread?: CssValueLike,
	): CssText {
		const parts = [offsetX, offsetY, blur];
		if (spread !== undefined) {
			parts.push(spread);
		}
		parts.push(color);
		return new CssText(parts.map(String).join(" "));
	},
} as const;

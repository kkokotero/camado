import { Functions } from "./functions.ts";
import { CssText, type CssValueLike } from "./shared.ts";

function normalizeHex(value: string): string {
	const trimmed = value.trim();
	return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
}

export const Color = {
	hex(value: string): CssText {
		return new CssText(normalizeHex(value));
	},
	named(value: string): CssText {
		return new CssText(value.trim());
	},
	rgb(red: CssValueLike, green: CssValueLike, blue: CssValueLike): CssText {
		return Functions.rgb(red, green, blue);
	},
	rgba(
		red: CssValueLike,
		green: CssValueLike,
		blue: CssValueLike,
		alpha: CssValueLike,
	): CssText {
		return Functions.rgba(red, green, blue, alpha);
	},
	hsl(
		hue: CssValueLike,
		saturation: CssValueLike,
		lightness: CssValueLike,
	): CssText {
		return Functions.hsl(hue, saturation, lightness);
	},
	hsla(
		hue: CssValueLike,
		saturation: CssValueLike,
		lightness: CssValueLike,
		alpha: CssValueLike,
	): CssText {
		return Functions.hsla(hue, saturation, lightness, alpha);
	},
} as const;

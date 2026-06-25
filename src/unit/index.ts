import { Angle } from "./angle.ts";
import { Color } from "./color.ts";
import { Functions } from "./functions.ts";
import { Length } from "./length.ts";

export type { CssValueLike } from "./shared.ts";
export { CssText, CssFunction } from "./shared.ts";
export { Angle, CssAngle } from "./angle.ts";
export { Color } from "./color.ts";
export { Functions } from "./functions.ts";
export { Length, CssLength, Unit } from "./length.ts";
export { Time, TimeValue } from "./time.ts";

export const Css = {
	Unit: Length,
	Angle,
	min: Functions.min,
	max: Functions.max,
	clamp: Functions.clamp,
	rgb: Functions.rgb,
	rgba: Functions.rgba,
	hsl: Functions.hsl,
	hsla: Functions.hsla,
	cubicBezier: Functions.cubicBezier,
	translateZ: Functions.translateZ,
	calc: Functions.calc,
	fn: Functions.fn,
	boxShadow: Functions.boxShadow,
	Color,
} as const;

import { CssText } from "./shared.ts";

export class CssAngle extends CssText {
	readonly value: number;
	readonly unit: string;

	constructor(value: number, unit: string) {
		super(`${value}${unit}`);
		this.value = value;
		this.unit = unit;
	}
}

function unit(value = 1, suffix: string): CssAngle {
	return new CssAngle(value, suffix);
}

export const Angle = {
	deg(value = 1): CssAngle {
		return unit(value, "deg");
	},
	rad(value = 1): CssAngle {
		return unit(value, "rad");
	},
	turn(value = 1): CssAngle {
		return unit(value, "turn");
	},
	grad(value = 1): CssAngle {
		return unit(value, "grad");
	},
} as const;

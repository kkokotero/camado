import { CssText } from "./shared.ts";

export class CssLength extends CssText {
	readonly value: number;
	readonly unit: string;

	constructor(value: number, unit: string) {
		super(`${value}${unit}`);
		this.value = value;
		this.unit = unit;
	}

	toPx(base = 16): CssLength {
		if (this.unit === "px") {
			return this;
		}

		return new CssLength(this.value * base, "px");
	}

	toRem(base = 16): CssLength {
		if (this.unit === "rem") {
			return this;
		}

		return new CssLength(this.toPx(base).value / base, "rem");
	}

	toEm(base = 16): CssLength {
		if (this.unit === "em") {
			return this;
		}

		return new CssLength(this.toPx(base).value / base, "em");
	}

	toVh(viewportHeight = 100, base = 16): CssLength {
		if (this.unit === "vh") {
			return this;
		}

		return new CssLength((this.toPx(base).value / viewportHeight) * 100, "vh");
	}

	toVw(viewportWidth = 100, base = 16): CssLength {
		if (this.unit === "vw") {
			return this;
		}

		return new CssLength((this.toPx(base).value / viewportWidth) * 100, "vw");
	}

	toVmin(viewportMin = 100, base = 16): CssLength {
		if (this.unit === "vmin") {
			return this;
		}

		return new CssLength((this.toPx(base).value / viewportMin) * 100, "vmin");
	}

	toVmax(viewportMax = 100, base = 16): CssLength {
		if (this.unit === "vmax") {
			return this;
		}

		return new CssLength((this.toPx(base).value / viewportMax) * 100, "vmax");
	}
}

function unit(value = 1, suffix: string): CssLength {
	return new CssLength(value, suffix);
}

export const Length = {
	px(value = 1): CssLength {
		return unit(value, "px");
	},
	rem(value = 1): CssLength {
		return unit(value, "rem");
	},
	em(value = 1): CssLength {
		return unit(value, "em");
	},
	percent(value = 1): CssLength {
		return unit(value, "%");
	},
	vh(value = 1): CssLength {
		return unit(value, "vh");
	},
	vw(value = 1): CssLength {
		return unit(value, "vw");
	},
	vmin(value = 1): CssLength {
		return unit(value, "vmin");
	},
	vmax(value = 1): CssLength {
		return unit(value, "vmax");
	},
	ch(value = 1): CssLength {
		return unit(value, "ch");
	},
	ex(value = 1): CssLength {
		return unit(value, "ex");
	},
	cm(value = 1): CssLength {
		return unit(value, "cm");
	},
	mm(value = 1): CssLength {
		return unit(value, "mm");
	},
	in(value = 1): CssLength {
		return unit(value, "in");
	},
	pt(value = 1): CssLength {
		return unit(value, "pt");
	},
	pc(value = 1): CssLength {
		return unit(value, "pc");
	},
	fr(value = 1): CssLength {
		return unit(value, "fr");
	},
} as const;

export const Unit = Length;

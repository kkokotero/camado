import { CssText } from "./shared.ts";

export class TimeValue extends CssText {
	readonly value: number;
	readonly unit: "ms" | "s" | "m" | "h" | "d" | "w";

	constructor(value: number, unit: "ms" | "s" | "m" | "h" | "d" | "w") {
		super(`${value}${unit}`);
		this.value = value;
		this.unit = unit;
	}

	toMs(): number {
		switch (this.unit) {
			case "w":
				return this.value * 7 * 24 * 60 * 60 * 1000;
			case "d":
				return this.value * 24 * 60 * 60 * 1000;
			case "h":
				return this.value * 60 * 60 * 1000;
			case "m":
				return this.value * 60 * 1000;
			case "s":
				return this.value * 1000;
			case "ms":
			default:
				return this.value;
		}
	}

	toSecond(): number {
		return this.toMs() / 1000;
	}

	toMinute(): number {
		return this.toMs() / (60 * 1000);
	}

	toHour(): number {
		return this.toMs() / (60 * 60 * 1000);
	}

	toDay(): number {
		return this.toMs() / (24 * 60 * 60 * 1000);
	}

	toWeek(): number {
		return this.toMs() / (7 * 24 * 60 * 60 * 1000);
	}
}

function unit(
	value = 1,
	suffix: "ms" | "s" | "m" | "h" | "d" | "w",
): TimeValue {
	return new TimeValue(value, suffix);
}

export const Time = {
	Millisecond(value = 1): TimeValue {
		return unit(value, "ms");
	},
	Second(value = 1): TimeValue {
		return unit(value, "s");
	},
	Minute(value = 1): TimeValue {
		return unit(value, "m");
	},
	Hour(value = 1): TimeValue {
		return unit(value, "h");
	},
	Day(value = 1): TimeValue {
		return unit(value, "d");
	},
	Week(value = 1): TimeValue {
		return unit(value, "w");
	},
} as const;

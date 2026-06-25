import { expect, test } from "vitest";
import {
	Angle,
	Css,
	CssFunction,
	CssText,
	Functions,
	Length,
	Time,
} from "../../src/unit/index.ts";

test("CSS primitives stringify without surprises", () => {
	const text = new CssText("12px");
	const fn = new CssFunction("calc", ["100% - 2rem"]);

	expect(String(text)).toBe("12px");
	expect(text.valueOf()).toBe("12px");
	expect(`${text}`).toBe("12px");
	expect(String(fn)).toBe("calc(100% - 2rem)");
	expect(`${fn}`).toBe("calc(100% - 2rem)");
});

test("length helpers preserve units and convert lazily", () => {
	const px = Length.px(24);

	expect(px.value).toBe(24);
	expect(px.unit).toBe("px");
	expect(px.toPx()).toBe(px);
	expect(String(px.toRem())).toBe("1.5rem");
	expect(String(px.toEm())).toBe("1.5em");
	expect(String(px.toVh(120))).toBe("20vh");
	expect(String(px.toVw(300))).toBe("8vw");
	expect(String(px.toVmin(200))).toBe("12vmin");
	expect(String(px.toVmax(400))).toBe("6vmax");
});

test("angle helpers return the expected primitive values", () => {
	expect(String(Angle.deg(90))).toBe("90deg");
	expect(String(Angle.rad(1))).toBe("1rad");
	expect(String(Angle.turn(0.5))).toBe("0.5turn");
	expect(String(Angle.grad(100))).toBe("100grad");
});

test("time helpers convert across calendar units", () => {
	expect(Time.Millisecond(500).toMs()).toBe(500);
	expect(Time.Second(2).toSecond()).toBe(2);
	expect(Time.Minute(3).toMinute()).toBe(3);
	expect(Time.Hour(4).toHour()).toBe(4);
	expect(Time.Day(2).toDay()).toBe(2);
	expect(Time.Week(2).toWeek()).toBe(2);
	expect(Time.Week(1).toMs()).toBe(604800000);
});

test("css function helpers compose the right strings", () => {
	expect(String(Functions.min(Length.px(12), Length.rem(2)))).toBe(
		"min(12px, 2rem)",
	);
	expect(String(Functions.max(Length.px(12), Length.rem(2)))).toBe(
		"max(12px, 2rem)",
	);
	expect(
		String(Functions.clamp(Length.rem(1), Length.vw(2), Length.rem(3))),
	).toBe("clamp(1rem, 2vw, 3rem)");
	expect(String(Functions.rgb(255, 0, 128))).toBe("rgb(255, 0, 128)");
	expect(String(Functions.rgba(255, 0, 128, 0.5))).toBe(
		"rgba(255, 0, 128, 0.5)",
	);
	expect(String(Functions.hsl(300, "50%", "25%"))).toBe("hsl(300, 50%, 25%)");
	expect(String(Functions.hsla(300, "50%", "25%", 0.25))).toBe(
		"hsla(300, 50%, 25%, 0.25)",
	);
	expect(String(Functions.cubicBezier(0.25, 0.1, 0.25, 1))).toBe(
		"cubic-bezier(0.25, 0.1, 0.25, 1)",
	);
	expect(String(Functions.fn("linear-gradient", "red", "blue"))).toBe(
		"linear-gradient(red, blue)",
	);
	expect(String(Functions.boxShadow("0", "2px", "8px", "black"))).toBe(
		"0 2px 8px black",
	);
	expect(String(Functions.boxShadow("0", "2px", "8px", "black", "1px"))).toBe(
		"0 2px 8px 1px black",
	);
	expect(String(Css.calc("100% - 1rem"))).toBe("calc(100% - 1rem)");
	expect(String(Css.Unit.cm(2))).toBe("2cm");
	expect(String(Css.Angle.deg(15))).toBe("15deg");
});

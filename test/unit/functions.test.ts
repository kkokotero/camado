import { expect, test } from "vitest";
import { Functions, Css } from "../../src/unit/index.ts";

test("function helpers accept raw values and nested CSS objects", () => {
	expect(String(Functions.calc("100% - 1rem"))).toBe("calc(100% - 1rem)");
	expect(String(Functions.fn("translate", Css.Unit.px(10)))).toBe(
		"translate(10px)",
	);
	expect(String(Functions.boxShadow(0, 2, 8, "black"))).toBe("0 2 8 black");
});

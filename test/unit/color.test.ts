import { expect, test } from "vitest";
import { Color } from "../../src/unit/color.ts";

test("color helper builds color strings", () => {
	expect(String(Color.hex("fff"))).toBe("#fff");
	expect(String(Color.hex("#112233"))).toBe("#112233");
	expect(String(Color.rgb(255, 0, 128))).toBe("rgb(255, 0, 128)");
	expect(String(Color.rgba(255, 0, 128, 0.5))).toBe("rgba(255, 0, 128, 0.5)");
	expect(String(Color.hsl(300, "50%", "25%"))).toBe("hsl(300, 50%, 25%)");
	expect(String(Color.hsla(300, "50%", "25%", 0.25))).toBe(
		"hsla(300, 50%, 25%, 0.25)",
	);
});

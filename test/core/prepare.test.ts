import { expect, test } from "vitest";
import { BaseComponent, Component, prepare } from "../../src/core/index.ts";

@Component({ selector: "neptune-prepare-a" })
class PrepareA extends BaseComponent {
	protected override render() {
		return document.createTextNode("a");
	}
}

@Component({ selector: "neptune-prepare-b" })
class PrepareB extends BaseComponent {
	protected override render() {
		return document.createTextNode("b");
	}
}

test("prepare returns a manifest for constructors and factories", () => {
	const manifest = prepare(PrepareA, PrepareB.component());

	expect(manifest.components.map((entry) => entry.selector)).toEqual([
		"neptune-prepare-a",
		"neptune-prepare-b",
	]);
	expect(manifest.selectors["neptune-prepare-a"]).toBe(PrepareA);
	expect(manifest.selectors["neptune-prepare-b"]).toBe(PrepareB);
});

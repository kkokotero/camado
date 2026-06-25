import { expect, test } from "vitest";
import { BaseComponent, Component, prepare } from "../../src/core/index.ts";

@Component({ selector: "miora-prepare-a" })
class PrepareA extends BaseComponent {
	protected override render() {
		return document.createTextNode("a");
	}
}

@Component({ selector: "miora-prepare-b" })
class PrepareB extends BaseComponent {
	protected override render() {
		return document.createTextNode("b");
	}
}

test("prepare returns a manifest for constructors and factories", () => {
	const manifest = prepare(PrepareA, PrepareB.component());

	expect(manifest.components.map((entry) => entry.selector)).toEqual([
		"miora-prepare-a",
		"miora-prepare-b",
	]);
	expect(manifest.selectors["miora-prepare-a"]).toBe(PrepareA);
	expect(manifest.selectors["miora-prepare-b"]).toBe(PrepareB);
});

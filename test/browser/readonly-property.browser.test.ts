import { expect, test } from "vitest";
import { BaseComponent, Component, Property } from "../../src/core/index.ts";

@Component({ selector: "camado-browser-readonly-prop" })
class BrowserReadonlyProp extends BaseComponent {
	@Property()
	get theme() {
		return "light";
	}

	protected override render() {
		return null;
	}
}

test("readonly property assignment does not throw in a real browser", async () => {
	const element = BrowserReadonlyProp.create({ theme: "dark" } as any);

	expect(() => document.body.append(element)).not.toThrow();
	await Promise.resolve();

	expect(element.theme).toBe("light");
	element.remove();
});

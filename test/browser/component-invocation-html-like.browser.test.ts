import { expect, test } from "vitest";
import {
	BaseComponent,
	Children,
	Component,
	Property,
	Slot,
	type ComponentChildren,
} from "../../src/core/index.ts";
import { Attribute } from "../../src/modifiers/index.ts";
import { Text } from "../../src/html/index.ts";

@Component({ selector: "camado-html-like-invoke" })
class HtmlLikeInvoke extends BaseComponent {
	@Property()
	label = "default";

	@Children({ optional: false })
	content?: ComponentChildren;

	@Slot("footer", { optional: false })
	footer?: ComponentChildren;

	protected override render() {
		return null;
	}
}

void HtmlLikeInvoke;

test("component factories accept props, modifiers, raw children, and Slot(...) in any order", () => {
	const element = HtmlLikeInvoke.create(
		Attribute.class("alpha"),
		Text("from-tail"),
		Slot("footer", Text("slot")),
		{ label: "hello", children: Text("from-options") },
	);

	expect(element.label).toBe("hello");
	expect(element.getAttribute("class")).toContain("alpha");
	expect(element.footer).toBeDefined();
	expect(element.content).toBeDefined();
	const content = element.content as DocumentFragment;
	expect(content.textContent).toBe("from-tailfrom-options");
	expect((element.footer as DocumentFragment).textContent).toBe("slot");
	expect(element.textContent).toBe("");
});

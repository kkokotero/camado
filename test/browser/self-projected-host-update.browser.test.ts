import { expect, test } from "vitest";
import {
	BaseComponent,
	Children,
	Component,
	OnMount,
	Property,
	Self,
	type ComponentChildren,
} from "../../src/core/index.ts";
import { Button, Fragment, Span, Text } from "../../src/html/index.ts";
import { Attribute } from "../../src/modifiers/index.ts";

@Component({ selector: "camado-self-regression-icon" })
class RegressionIcon extends BaseComponent {
	@Property() name = "percent";
	protected override render() {
		return Span(Span(this.name));
	}
}

@Component({ selector: "camado-self-regression-button" })
class RegressionButton extends BaseComponent {
	@Property({ optional: true }) level = "primary";
	@Property({ optional: true }) size = "md";
	@Property({ optional: true }) radius = "md";
	@Children({ optional: true }) children?: ComponentChildren;
	protected override render() {
		return Button(
			Attribute.class(this.level, this.size, this.radius),
			this.children,
		);
	}
}

@Component({ selector: "camado-self-regression-wrapper" })
class RegressionWrapper extends BaseComponent {
	@Children({ optional: true }) children?: ComponentChildren;
	@Property({ optional: true }) mounted = false;
	@OnMount() protected flipMounted() {
		setTimeout(() => {
			this.mounted = true;
		}, 0);
	}
	protected override render() {
		return Self(
			Attribute.class(this.mounted ? "mounted" : "idle"),
			this.children,
		);
	}
}

void RegressionIcon;
void RegressionButton;
void RegressionWrapper;

async function settle() {
	await Promise.resolve();
	await Promise.resolve();
	await new Promise((resolve) => setTimeout(resolve, 0));
}

test("self wrapper keeps projected component hosts visible across mount updates", async () => {
	const wrapper = RegressionWrapper.create({
		children: RegressionButton.create({
			children: Fragment(RegressionIcon.create(), Text("Hoa")),
		}),
	} as any);

	document.body.append(wrapper);
	await settle();
	await settle();

	const button = document.querySelector("camado-self-regression-button");
	expect(wrapper.getAttribute("class")).toContain("mounted");
	expect(button?.querySelectorAll("camado-self-regression-icon").length).toBe(
		1,
	);
	expect(button?.innerHTML).toContain("camado-self-regression-icon");
	expect(button?.textContent).toContain("percent");
	expect(button?.textContent).toContain("Hoa");

	wrapper.remove();
});

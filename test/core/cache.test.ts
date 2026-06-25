import { expect, test, vi } from "vitest";
import { Static } from "../../src/core/index.ts";
import { Reactive } from "../../src/reactive/index.ts";

class StaticRenderer {
	calls = 0;

	@Static()
	render(): string {
		this.calls += 1;
		return `render:${this.calls}`;
	}
}

test("Static memoizes per instance", () => {
	const first = new StaticRenderer();
	expect(first.render()).toBe("render:1");
	expect(first.render()).toBe("render:1");
	expect(first.calls).toBe(1);

	const second = new StaticRenderer();
	expect(second.render()).toBe("render:1");
	expect(second.calls).toBe(1);
});

class ReactiveStaticRenderer {
	@Reactive()
	count = 0;

	@Static()
	render(): string {
		return `count:${this.count}`;
	}
}

test("Static warns when it touches reactive state", () => {
	const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
	try {
		const instance = new ReactiveStaticRenderer();
		expect(instance.render()).toBe("count:0");
		expect(warn).toHaveBeenCalledTimes(1);
		expect(String(warn.mock.calls[0]?.[0] ?? "")).toContain("@Static(render)");
	} finally {
		warn.mockRestore();
	}
});

import { expect, test } from "vitest";
import {
	back,
	forward,
	go,
	navigate,
	reload,
} from "../../src/navigator/navigation.ts";

test("navigation helpers call the right location/history methods", () => {
	const previousLocation = Object.getOwnPropertyDescriptor(
		globalThis,
		"location",
	);
	const previousHistory = Object.getOwnPropertyDescriptor(
		globalThis,
		"history",
	);
	const calls = {
		reload: [] as boolean[],
		assign: [] as string[],
		replace: [] as string[],
		back: 0,
		forward: 0,
		go: [] as number[],
	};

	Object.defineProperty(globalThis, "location", {
		configurable: true,
		value: {
			reload(force?: boolean) {
				calls.reload.push(Boolean(force));
			},
			assign(url: string) {
				calls.assign.push(url);
			},
			replace(url: string) {
				calls.replace.push(url);
			},
		},
	});
	Object.defineProperty(globalThis, "history", {
		configurable: true,
		value: {
			back() {
				calls.back += 1;
			},
			forward() {
				calls.forward += 1;
			},
			go(delta?: number) {
				calls.go.push(delta ?? 0);
			},
		},
	});

	try {
		reload(true);
		expect(navigate("/path")).toBe("/path");
		expect(
			navigate(new URL("https://example.com/next"), { replace: true }),
		).toBe("https://example.com/next");
		back();
		forward();
		go(-2);

		expect(calls.reload).toEqual([false]);
		expect(calls.assign).toEqual(["/path"]);
		expect(calls.replace).toEqual(["https://example.com/next"]);
		expect(calls.back).toBe(1);
		expect(calls.forward).toBe(1);
		expect(calls.go).toEqual([-2]);
	} finally {
		if (previousLocation) {
			Object.defineProperty(globalThis, "location", previousLocation);
		}
		if (previousHistory) {
			Object.defineProperty(globalThis, "history", previousHistory);
		}
	}
});

import { expect, test } from "vitest";
import { Navigator } from "../../src/navigator/index.ts";

test("Navigator wraps browser navigation helpers", async () => {
	const previousLocation = Object.getOwnPropertyDescriptor(
		globalThis,
		"location",
	);
	const previousHistory = Object.getOwnPropertyDescriptor(
		globalThis,
		"history",
	);
	const previousNavigator = Object.getOwnPropertyDescriptor(
		globalThis,
		"navigator",
	);
	const previousDocument = Object.getOwnPropertyDescriptor(
		globalThis,
		"document",
	);
	const previousNotification = Object.getOwnPropertyDescriptor(
		globalThis,
		"Notification",
	);

	const calls = {
		reload: [] as boolean[],
		assign: [] as string[],
		replace: [] as string[],
		back: 0,
		forward: 0,
		go: [] as number[],
		fullscreen: 0,
		exitFullscreen: 0,
		notify: [] as Array<{ title: string; options?: unknown }>,
	};

	Object.defineProperty(globalThis, "location", {
		configurable: true,
		value: {
			href: "https://example.com",
			reload(force?: boolean) {
				calls.reload.push(Boolean(force));
			},
			assign(url: string) {
				calls.assign.push(url);
			},
			replace(url: string) {
				calls.replace.push(url);
			},
		} as Location,
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
		} as History,
	});
	Object.defineProperty(globalThis, "navigator", {
		configurable: true,
		value: {
			permissions: {
				query: async (descriptor: PermissionDescriptor) =>
					({
						name: descriptor.name,
						state: "granted",
						onchange: null,
						addEventListener() {},
						removeEventListener() {},
						dispatchEvent() {
							return true;
						},
					}) as PermissionStatus,
			},
		} as Navigator,
	});
	Object.defineProperty(globalThis, "document", {
		configurable: true,
		value: {
			documentElement: {
				requestFullscreen: async () => {
					calls.fullscreen += 1;
				},
			} as unknown as Element,
			exitFullscreen: async () => {
				calls.exitFullscreen += 1;
			},
			fullscreenElement: null,
		} as Document,
	});
	Object.defineProperty(globalThis, "Notification", {
		configurable: true,
		value: class Notification {
			static permission: NotificationPermission = "granted";
			static async requestPermission() {
				return "granted" as NotificationPermission;
			}

			constructor(title: string, options?: NotificationOptions) {
				calls.notify.push({ title, options });
			}
		} as typeof Notification,
	});

	try {
		Navigator.reload();
		Navigator.navigate("/path");
		Navigator.navigate(new URL("https://example.com/next"), { replace: true });
		Navigator.back();
		Navigator.forward();
		Navigator.go(-2);

		expect(calls.reload).toEqual([false]);
		expect(calls.assign).toEqual(["/path"]);
		expect(calls.replace).toEqual(["https://example.com/next"]);
		expect(calls.back).toBe(1);
		expect(calls.forward).toBe(1);
		expect(calls.go).toEqual([-2]);

		const permission = await Navigator.permission("notifications");
		expect(permission?.state).toBe("granted");

		await Navigator.fullScreen();
		await Navigator.exitFullScreen();
		expect(calls.fullscreen).toBe(1);
		expect(calls.exitFullscreen).toBe(1);

		expect(Navigator.isFullScreen()).toBe(false);
		expect(await Navigator.notificationPermission()).toBe("granted");
		Navigator.notify("Hello", { body: "World" });
		expect(calls.notify).toEqual([
			{ title: "Hello", options: { body: "World" } },
		]);
		expect(Navigator.email("hello@example.com", { subject: "Hi" })).toBe(
			"mailto:hello@example.com?subject=Hi",
		);
	} finally {
		if (previousLocation) {
			Object.defineProperty(globalThis, "location", previousLocation);
		} else {
			delete (globalThis as any).location;
		}
		if (previousHistory) {
			Object.defineProperty(globalThis, "history", previousHistory);
		} else {
			delete (globalThis as any).history;
		}
		if (previousNavigator) {
			Object.defineProperty(globalThis, "navigator", previousNavigator);
		} else {
			delete (globalThis as any).navigator;
		}
		if (previousDocument) {
			Object.defineProperty(globalThis, "document", previousDocument);
		} else {
			delete (globalThis as any).document;
		}
		if (previousNotification) {
			Object.defineProperty(globalThis, "Notification", previousNotification);
		} else {
			delete (globalThis as any).Notification;
		}
	}
});

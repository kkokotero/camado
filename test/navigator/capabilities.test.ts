import { expect, test } from "vitest";
import { email } from "../../src/navigator/email.ts";
import {
	exitFullScreen,
	fullScreen,
	isFullScreen,
} from "../../src/navigator/fullscreen.ts";
import {
	notificationPermission,
	notify,
} from "../../src/navigator/notification.ts";
import { permission } from "../../src/navigator/permissions.ts";

test("navigator capability helpers handle absent browser APIs", async () => {
	const previousDocument = Object.getOwnPropertyDescriptor(
		globalThis,
		"document",
	);
	const previousNavigator = Object.getOwnPropertyDescriptor(
		globalThis,
		"navigator",
	);
	const previousNotification = Object.getOwnPropertyDescriptor(
		globalThis,
		"Notification",
	);
	const previousLocation = Object.getOwnPropertyDescriptor(
		globalThis,
		"location",
	);

	Object.defineProperty(globalThis, "document", {
		configurable: true,
		value: undefined,
	});
	Object.defineProperty(globalThis, "navigator", {
		configurable: true,
		value: {},
	});
	Object.defineProperty(globalThis, "Notification", {
		configurable: true,
		value: undefined,
	});
	Object.defineProperty(globalThis, "location", {
		configurable: true,
		value: { assign: () => undefined },
	});

	try {
		await expect(fullScreen()).resolves.toBeUndefined();
		await expect(exitFullScreen()).resolves.toBeUndefined();
		expect(isFullScreen()).toBe(false);
		await expect(permission("notifications")).resolves.toBeUndefined();
		await expect(notificationPermission()).resolves.toBeUndefined();
		expect(notify("Hello")).toBeUndefined();
		expect(email("hello@example.com")).toBe("mailto:hello@example.com");
	} finally {
		if (previousDocument)
			Object.defineProperty(globalThis, "document", previousDocument);
		if (previousNavigator)
			Object.defineProperty(globalThis, "navigator", previousNavigator);
		if (previousNotification)
			Object.defineProperty(globalThis, "Notification", previousNotification);
		if (previousLocation)
			Object.defineProperty(globalThis, "location", previousLocation);
	}
});

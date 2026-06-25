export interface NotificationRequestOptions {
	body?: string;
	icon?: string;
	badge?: string;
	tag?: string;
	renotify?: boolean;
	requireInteraction?: boolean;
	silent?: boolean;
	data?: unknown;
}

export function notificationPermission(): Promise<
	NotificationPermission | undefined
> {
	if (typeof globalThis.Notification !== "function") {
		return Promise.resolve(undefined);
	}

	return globalThis.Notification.requestPermission?.();
}

export function notify(
	title: string,
	options?: NotificationRequestOptions,
): Notification | undefined {
	if (typeof globalThis.Notification !== "function") {
		return undefined;
	}

	if (globalThis.Notification.permission !== "granted") {
		return undefined;
	}

	return new globalThis.Notification(title, options);
}

import { back, forward, go, navigate, reload } from "./navigation.ts";
import { email } from "./email.ts";
import { exitFullScreen, fullScreen, isFullScreen } from "./fullscreen.ts";
import { notificationPermission, notify } from "./notification.ts";
import { permission } from "./permissions.ts";
import { Seo } from "./seo.ts";

export const Navigator = {
	reload,
	navigate,
	back,
	forward,
	go,
	permission,
	fullScreen,
	exitFullScreen,
	isFullScreen,
	notificationPermission,
	notify,
	email,
	seo: Seo,
} as const;

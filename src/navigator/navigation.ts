export interface NavigateOptions {
	replace?: boolean;
}

function resolveUrl(target: string | URL): string {
	return target instanceof URL ? target.toString() : String(target);
}

export function reload(force = false): void {
	void force;
	globalThis.location?.reload();
}

export function navigate(
	target: string | URL,
	options: NavigateOptions = {},
): string {
	const href = resolveUrl(target);
	if (options.replace) {
		globalThis.location?.replace(href);
		return href;
	}

	globalThis.location?.assign(href);
	return href;
}

export function back(): void {
	globalThis.history?.back();
}

export function forward(): void {
	globalThis.history?.forward();
}

export function go(delta = 0): void {
	globalThis.history?.go(delta);
}

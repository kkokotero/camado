function getDocument(): Document | undefined {
	return globalThis.document;
}

export async function fullScreen(element?: Element): Promise<void> {
	const doc = getDocument();
	if (!doc) {
		return;
	}

	const target =
		element ??
		(doc.documentElement as Element & {
			requestFullscreen?: () => Promise<void>;
		});
	await target.requestFullscreen?.();
}

export async function exitFullScreen(): Promise<void> {
	await getDocument()?.exitFullscreen?.();
}

export function isFullScreen(): boolean {
	return Boolean(getDocument()?.fullscreenElement);
}

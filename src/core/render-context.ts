export interface RenderTarget {
	requestUpdate(): void;
}

let currentRenderTarget: RenderTarget | null = null;

export function setCurrentRenderTarget(target: RenderTarget | null): void {
	currentRenderTarget = target;
}

export function getCurrentRenderTarget(): RenderTarget | null {
	return currentRenderTarget;
}

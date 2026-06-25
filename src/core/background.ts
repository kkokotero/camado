export type BackgroundJob = () => void;

export function scheduleBackgroundJob(job: BackgroundJob): void {
	if (typeof globalThis.setTimeout === "function") {
		globalThis.setTimeout(job, 0);
		return;
	}

	queueMicrotask(job);
}

export function scheduleConcurrentBackgroundJob(job: BackgroundJob): void {
	scheduleBackgroundJob(job);
}

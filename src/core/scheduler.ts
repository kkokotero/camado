export type SchedulerJob = () => void;

export interface Scheduler {
	schedule(job: SchedulerJob): void;
	flush(): void;
	readonly pending: number;
}

const maxJobsPerTick = 100;

export function createScheduler(): Scheduler {
	const queue: SchedulerJob[] = [];
	let scheduled = false;
	let flushing = false;

	const requestFlush = (background = false): void => {
		if (scheduled) {
			return;
		}

		scheduled = true;
		const run = () => flush(maxJobsPerTick);

		if (background && typeof globalThis.setTimeout === "function") {
			globalThis.setTimeout(run, 0);
			return;
		}

		queueMicrotask(run);
	};

	const flush = (budget: number): void => {
		flushing = true;
		scheduled = false;

		let consumed = 0;
		const batchLimit = Math.min(queue.length, budget);

		try {
			while (consumed < batchLimit) {
				const job = queue[consumed];
				consumed += 1;
				job?.();
			}
		} finally {
			if (consumed > 0) {
				queue.splice(0, consumed);
			}

			flushing = false;

			if (queue.length > 0 && !scheduled) {
				requestFlush(true);
			}
		}
	};

	const schedule = (job: SchedulerJob): void => {
		queue.push(job);

		if (!flushing) {
			requestFlush();
		}
	};

	return {
		schedule,
		flush: () => flush(Number.POSITIVE_INFINITY),
		get pending() {
			return queue.length;
		},
	};
}

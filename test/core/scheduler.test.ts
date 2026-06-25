import { expect, test } from "vitest";
import { createScheduler } from "../../src/core/scheduler.ts";

test("scheduler batches jobs into one microtask", async () => {
	const scheduler = createScheduler();
	const calls: number[] = [];

	scheduler.schedule(() => {
		calls.push(1);
	});

	scheduler.schedule(() => {
		calls.push(2);
	});

	expect(calls).toEqual([]);

	await Promise.resolve();

	expect(calls).toEqual([1, 2]);
	expect(scheduler.pending).toBe(0);
});

test("scheduler flush runs pending work immediately", () => {
	const scheduler = createScheduler();
	let calls = 0;

	scheduler.schedule(() => {
		calls += 1;
	});

	expect(scheduler.pending).toBe(1);

	scheduler.flush();

	expect(calls).toBe(1);
	expect(scheduler.pending).toBe(0);
});

test("scheduler keeps working when jobs enqueue more jobs during flush", async () => {
	const scheduler = createScheduler();
	const calls: number[] = [];

	scheduler.schedule(() => {
		calls.push(1);
		scheduler.schedule(() => {
			calls.push(2);
		});
	});

	scheduler.flush();

	expect(calls).toEqual([1]);
	expect(scheduler.pending).toBe(1);

	await new Promise((resolve) => setTimeout(resolve, 0));

	expect(calls).toEqual([1, 2]);
	expect(scheduler.pending).toBe(0);

	scheduler.schedule(() => {
		calls.push(3);
	});

	await Promise.resolve();

	expect(calls).toEqual([1, 2, 3]);
});

test("scheduler yields large batches without losing work", async () => {
	const scheduler = createScheduler();
	const calls: number[] = [];
	const timers: Array<() => void> = [];
	const previousSetTimeout = globalThis.setTimeout;

	Object.defineProperty(globalThis, "setTimeout", {
		configurable: true,
		value: (job: () => void) => {
			timers.push(job);
			return 1;
		},
	});

	try {
		for (let index = 0; index < 101; index += 1) {
			scheduler.schedule(() => {
				calls.push(index);
			});
		}

		await Promise.resolve();

		expect(calls).toHaveLength(100);
		expect(scheduler.pending).toBe(1);
		expect(timers).toHaveLength(1);

		timers.shift()?.();

		expect(calls).toHaveLength(101);
		expect(scheduler.pending).toBe(0);
	} finally {
		Object.defineProperty(globalThis, "setTimeout", {
			configurable: true,
			value: previousSetTimeout,
		});
	}
});

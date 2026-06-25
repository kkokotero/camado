import type { Scheduler } from "./scheduler.ts";
import { createScheduler } from "./scheduler.ts";

export interface LifecycleHooks {
	onMount?(): void;
	onUpdate?(): void;
	onUnmount?(): void;
}

export interface RuntimeContext {
	readonly scheduler: Scheduler;
	readonly hooks: LifecycleHooks;
}

export function createRuntimeContext(
	hooks: LifecycleHooks = {},
): RuntimeContext {
	return {
		scheduler: createScheduler(),
		hooks,
	};
}

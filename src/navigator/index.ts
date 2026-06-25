import {
	createTransitionTokens,
	ensureTransitionRootStyles,
	isRenderableDocument,
	type TransitionBinding,
	type TransitionRunConfig,
	type TransitionRunNodes,
	type TransitionStyle,
	type TransitionTarget,
	type TransitionTargetInput,
	type TransitionWrapOptions,
} from "./shared.ts";
import { bindTransition, wrapTransition } from "./placeholder.ts";
import { launchTransition, runTransition } from "./run.ts";

export type {
	TransitionBinding,
	TransitionPseudoStyle,
	TransitionPseudoTarget,
	TransitionRunConfig,
	TransitionRunItem,
	TransitionRunNodes,
	TransitionStyle,
	TransitionTarget,
	TransitionTargetInput,
	TransitionWrapConfig,
	TransitionWrapOptions,
} from "./shared.ts";
export { Navigator } from "./browser.ts";
export { Seo } from "./seo.ts";
export type { NavigateOptions } from "./navigation.ts";
export type { EmailOptions } from "./email.ts";
export type { NotificationRequestOptions } from "./notification.ts";

export const ViewTransition = {
	name(name: string): TransitionStyle {
		const doc = globalThis.document;
		if (isRenderableDocument(doc)) {
			ensureTransitionRootStyles(doc);
		}

		return createTransitionTokens(name);
	},

	wrap(options: TransitionWrapOptions): Node {
		return wrapTransition(options);
	},

	bind(
		name: string,
		start: TransitionTargetInput,
		end: TransitionTarget,
		condition: boolean | (() => boolean),
		config?: TransitionRunConfig,
	): TransitionBinding {
		void condition;
		const doc = globalThis.document;
		if (isRenderableDocument(doc)) {
			ensureTransitionRootStyles(doc);
		}

		return bindTransition(name, start, end, config);
	},

	launch(
		name: string,
		startId: string,
		endId: string,
		update: (nodes: TransitionRunNodes) => void | Promise<void>,
		config: TransitionRunConfig = {},
	): ViewTransition | undefined {
		return launchTransition(name, startId, endId, update, config);
	},

	run(
		name: string | string[],
		update: (nodes: TransitionRunNodes) => void | Promise<void>,
		config: TransitionRunConfig = {},
	): ViewTransition | undefined {
		return runTransition(name, update, config);
	},
} as const;

export const Transition = ViewTransition;

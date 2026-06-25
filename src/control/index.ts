import { registerChildHandler } from "../core/child-handlers.ts";
import { appendChildValue, type ChildValue } from "../core/factories.ts";

export type ControlBranchValue = ChildValue | (() => ChildValue);

export interface CaseBranch<T = unknown> {
	readonly kind: "case";
	readonly value: T;
	readonly render: ControlBranchValue;
}

export interface DefaultBranch {
	readonly kind: "default";
	readonly render: ControlBranchValue;
}

export interface LazyModeImmediate {
	readonly mode?: "immediate";
}

export interface LazyModeTimeout {
	readonly mode: "timeout";
	readonly delayMs: number;
}

export interface LazyModeAction {
	readonly mode: "action";
	readonly when: () => boolean;
}

export interface LazyModeToggle {
	readonly mode: "toggle";
	readonly when: boolean | (() => boolean);
}

export type LazyMode =
	| LazyModeImmediate
	| LazyModeTimeout
	| LazyModeAction
	| LazyModeToggle;

interface LazyToken {
	readonly kind: "lazy";
	readonly resolve: () => ChildValue;
	readonly mode: LazyModeTimeout | LazyModeAction | LazyModeToggle;
}

interface PortalToken {
	readonly kind: "portal";
	readonly target: ParentNode | string | null;
	readonly children: ChildValue;
}

export type ControlToken = LazyToken | PortalToken;

let installed = false;

function ensureControlRuntime(): void {
	if (installed) {
		return;
	}

	installed = true;
	registerChildHandler({
		test: (value): value is ControlToken =>
			typeof value === "object" &&
			value !== null &&
			"kind" in value &&
			((value as { kind?: string }).kind === "lazy" ||
				(value as { kind?: string }).kind === "portal"),
		handle(target, value) {
			const token = value as ControlToken;
			if (token.kind === "lazy") {
				handleLazyValue(target, token);
				return;
			}

			handlePortalValue(token);
		},
	});
}

function handleLazyValue(target: ParentNode, value: LazyToken): void {
	const mode = value.mode;

	if (mode.mode === "timeout") {
		setTimeout(
			() => {
				appendChildValue(target, value.resolve());
			},
			Math.max(0, mode.delayMs),
		);
		return;
	}

	if (mode.mode === "action") {
		if (mode.when()) {
			appendChildValue(target, value.resolve());
		}
		return;
	}

	if (mode.mode === "toggle") {
		const active = typeof mode.when === "function" ? mode.when() : mode.when;
		if (active) {
			appendChildValue(target, value.resolve());
		}
		return;
	}

	appendChildValue(target, value.resolve());
}

function handlePortalValue(value: PortalToken): void {
	const destination = resolvePortalTarget(value.target);
	if (!destination) {
		return;
	}

	// ponytail: this replaces the whole portal target; add diffing only if portal updates need coexist with foreign DOM.
	if (typeof destination.replaceChildren === "function") {
		destination.replaceChildren();
	} else {
		while (destination.firstChild) {
			destination.removeChild(destination.firstChild);
		}
	}

	appendChildValue(destination, value.children);
}

function resolvePortalTarget(
	target: ParentNode | string | null,
): ParentNode | null {
	if (typeof target !== "string") {
		return target;
	}

	const documentRef = globalThis.document;
	if (!documentRef) {
		return null;
	}

	const id = target.startsWith("#") ? target.slice(1) : target;
	return documentRef.getElementById(id);
}

function resolveBranchContent(value: ControlBranchValue): ChildValue {
	return typeof value === "function" ? value() : value;
}

export function When(
	condition: unknown,
	thenValue: ChildValue,
	elseValue: ChildValue = [],
): ChildValue {
	return condition ? thenValue : elseValue;
}

export const If = When;

export function Unless(
	condition: unknown,
	thenValue: ChildValue,
	elseValue: ChildValue = [],
): ChildValue {
	return condition ? elseValue : thenValue;
}

export function Show(
	when: unknown,
	children: ChildValue,
	fallback: ChildValue = [],
): ChildValue {
	return When(when, children, fallback);
}

export function Case<T>(value: T, render: ControlBranchValue): CaseBranch<T> {
	return {
		kind: "case",
		value,
		render,
	};
}

export function Default(render: ControlBranchValue): DefaultBranch {
	return {
		kind: "default",
		render,
	};
}

export function Switch<T>(
	value: T,
	...branches: readonly (CaseBranch<T> | DefaultBranch)[]
): ChildValue {
	for (const branch of branches) {
		if (branch.kind === "case" && Object.is(branch.value, value)) {
			return resolveBranchContent(branch.render);
		}
	}

	for (const branch of branches) {
		if (branch.kind === "default") {
			return resolveBranchContent(branch.render);
		}
	}

	return [];
}

export const Match = Switch;

export function Each<T>(
	items: Iterable<T>,
	renderItem: (item: T, index: number) => ChildValue,
): ChildValue[] {
	const result: ChildValue[] = [];
	let index = 0;

	for (const item of items) {
		result.push(renderItem(item, index));
		index += 1;
	}

	return result;
}

export const For = Each;

export function Repeat(
	count: number,
	renderItem: (index: number) => ChildValue,
): ChildValue[] {
	const result: ChildValue[] = [];
	const total = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;

	for (let index = 0; index < total; index += 1) {
		result.push(renderItem(index));
	}

	return result;
}

export function Lazy(
	factory: () => ChildValue,
	mode: LazyMode = { mode: "immediate" },
): ChildValue {
	if (mode.mode === "immediate" || mode.mode === undefined) {
		return factory();
	}

	ensureControlRuntime();
	const deferredMode = mode as
		| LazyModeTimeout
		| LazyModeAction
		| LazyModeToggle;
	// ponytail: deferred, not memoized; cache outside if stability matters.
	return {
		kind: "lazy",
		resolve: factory,
		mode: deferredMode,
	};
}

export function Portal(
	target: ParentNode | string | null,
	children: ChildValue,
): ChildValue {
	ensureControlRuntime();
	return {
		kind: "portal",
		target,
		children,
	};
}

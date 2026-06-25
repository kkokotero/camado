import { registerChildHandler } from "../core/child-handlers.ts";
import {
	clearObserverBindings,
	getObserverToken,
	setObserverBindings,
} from "../core/factories.ts";

function isObserverToken(value: unknown): value is {
	kind: "observer";
	callbacks: Record<
		string,
		{
			kind: string;
			handler: (entry: IntersectionObserverEntry) => void;
			config?: { margin?: string; rootMargin?: string; once?: boolean };
		}
	>;
	options: IntersectionObserverInit;
	isOnce: boolean;
} {
	return (
		typeof value === "object" &&
		value !== null &&
		(value as { kind?: string }).kind === "observer"
	);
}

function toMargin(value?: string): {
	top: number;
	right: number;
	bottom: number;
	left: number;
} {
	if (!value) return { top: 0, right: 0, bottom: 0, left: 0 };
	const parts = value
		.trim()
		.split(/\s+/)
		.map((part) => Number.parseFloat(part) || 0);
	const top = parts[0] ?? 0;
	const right = parts[1] ?? top;
	return { top, right, bottom: parts[2] ?? top, left: parts[3] ?? right };
}

function expand(root: DOMRectReadOnly, margin?: string) {
	const offset = toMargin(margin);
	return {
		top: root.top - offset.top,
		right: root.right + offset.right,
		bottom: root.bottom + offset.bottom,
		left: root.left - offset.left,
		width: root.width + offset.left + offset.right,
		height: root.height + offset.top + offset.bottom,
	};
}

function intersects(
	a: { top: number; right: number; bottom: number; left: number },
	b: DOMRectReadOnly,
): boolean {
	return !(
		b.left > a.right ||
		b.right < a.left ||
		b.top > a.bottom ||
		b.bottom < a.top
	);
}

function direction(
	root: DOMRectReadOnly,
	box: DOMRectReadOnly,
): "Top" | "Bottom" | "Left" | "Right" | null {
	const edges = [
		{ edge: "Top" as const, value: Math.abs(box.top - root.top) },
		{ edge: "Bottom" as const, value: Math.abs(root.bottom - box.bottom) },
		{ edge: "Left" as const, value: Math.abs(box.left - root.left) },
		{ edge: "Right" as const, value: Math.abs(root.right - box.right) },
	];
	return edges.sort((a, b) => a.value - b.value)[0]?.edge ?? null;
}

const observerState = new WeakMap<
	Element,
	Array<{
		kind: string;
		handler: (entry: IntersectionObserverEntry) => void;
		config?: { margin?: string; rootMargin?: string; once?: boolean };
		active: boolean;
		previousVisible: boolean;
	}>
>();
let sharedObserver: IntersectionObserver | null = null;
let installed = false;

function isActive(
	entry: IntersectionObserverEntry,
	binding: { kind: string; config?: { margin?: string; rootMargin?: string } },
): boolean {
	const root = entry.rootBounds;
	const visible = root
		? intersects(
				expand(root, binding.config?.margin ?? binding.config?.rootMargin),
				entry.boundingClientRect,
			)
		: entry.isIntersecting && entry.intersectionRatio > 0;
	const edge = root ? direction(root, entry.boundingClientRect) : null;

	switch (binding.kind) {
		case "visible":
			return visible;
		case "hidden":
			return !visible;
		case "enterTop":
		case "enterBottom":
		case "enterLeft":
		case "enterRight":
			return visible && edge === binding.kind.slice(5);
		case "exitTop":
		case "exitBottom":
		case "exitLeft":
		case "exitRight":
			return !visible && edge === binding.kind.slice(4);
		default:
			return false;
	}
}

function getObserver(): IntersectionObserver | null {
	if (typeof globalThis.IntersectionObserver !== "function") {
		return null;
	}
	if (!sharedObserver) {
		sharedObserver = new globalThis.IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					const bindings = observerState.get(entry.target as Element);
					if (!bindings) continue;
					for (const binding of bindings) {
						if (!binding.active) continue;
						if (!isActive(entry, binding)) continue;
						binding.handler(entry);
						binding.previousVisible = true;
						if (binding.config?.once) binding.active = false;
					}
				}
			},
			{ root: null, rootMargin: "0px", threshold: 0 },
		);
	}
	return sharedObserver;
}

function buildObserverState(token: {
	callbacks: Record<
		string,
		{
			kind: string;
			handler: (entry: IntersectionObserverEntry) => void;
			config?: { margin?: string; rootMargin?: string; once?: boolean };
		}
	>;
}) {
	return Object.values(token.callbacks)
		.filter(Boolean)
		.map((binding) => ({
			...binding,
			active: true,
			previousVisible: false,
		}));
}

export function installObserverRuntime(element: Element, token: unknown): void {
	if (!token || typeof token !== "object") {
		return;
	}

	const observerToken = token as {
		callbacks: Record<
			string,
			{
				kind: string;
				handler: (entry: IntersectionObserverEntry) => void;
				config?: { margin?: string; rootMargin?: string; once?: boolean };
			}
		>;
		isOnce: boolean;
	};

	observerState.set(element, buildObserverState(observerToken));
	setObserverBindings(element, observerToken as any);
	getObserver()?.observe(element);
}

export function syncObserverRuntime(current: Node, next: Node): void {
	const nextToken = getObserverToken(next);

	if (!getObserverToken(current) && !nextToken) {
		return;
	}

	clearObserverBindings(current);
	observerState.delete(current as Element);
	sharedObserver?.unobserve(current as Element);

	if (!nextToken) {
		return;
	}

	installObserverRuntime(current as Element, nextToken);
}

export function clearObserverRuntime(target: Node): void {
	clearObserverBindings(target);
	observerState.delete(target as Element);
	sharedObserver?.unobserve(target as Element);
}

export function ensureObserverRuntime(): void {
	if (installed) {
		return;
	}

	installed = true;
	registerChildHandler({
		test: isObserverToken,
		handle(target, value) {
			const element = target as Element;
			if (!(element instanceof Element)) return;
			installObserverRuntime(element, value);
		},
	});
}

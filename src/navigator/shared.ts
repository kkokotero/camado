import { Attribute, Style } from "../modifiers/index.ts";

type CssTextLike = string | number | { toString(): string };

export interface TransitionPseudoStyle {
	width?: CssTextLike;
	height?: CssTextLike;
	overflow?: CssTextLike;
	objectPosition?: CssTextLike;
	zIndex?: CssTextLike;
}

export type TransitionPseudoTarget = "group" | "old" | "new" | "image-pair";

export interface TransitionRunConfig {
	className?: string;
	sharedClassName?: string;
	openingClassName?: string;
	closingClassName?: string;
	duration?: number;
	easing?: CssTextLike;
	delay?: number;
	fill?: FillMode;
	pseudo?: TransitionPseudoTarget;
	pseudoStyle?: TransitionPseudoStyle;
	fallback?: boolean;
	debug?: boolean;
	fromPlaceholder?: boolean;
}

export interface TransitionRunItem {
	name: string;
	before: Element[];
	after: Element[];
	firstBefore?: Element | null;
	firstAfter?: Element | null;
}

export interface TransitionRunNodes {
	names: string[];
	items: Record<string, TransitionRunItem>;
}

export interface TransitionWrapConfig extends TransitionRunConfig {
	fromPlaceholder?: boolean;
}

export type TransitionTarget = Element | string;
export type TransitionTargetInput =
	| TransitionTarget
	| readonly TransitionTarget[];

export interface TransitionWrapOptions {
	name: string;
	start: Element;
	end: Element;
	condition: boolean | (() => boolean);
	config?: TransitionWrapConfig;
}

export interface TransitionBinding {
	readonly name: string;
	readonly startIds: readonly string[];
	readonly endId: string;
	readonly config?: TransitionWrapConfig;
}

export type TransitionStyle = readonly [
	ReturnType<typeof Style.set>,
	ReturnType<typeof Attribute.attr>,
];

export type Cleanup = () => void;

export type TransitionClassState = {
	name: string | null;
	className: string | null;
	sharedClassName: string | null;
	viewTransitionClass: string | null;
};

export const transitionMarker = "data-transition-name";
export const transitionStyleSheets = new WeakMap<Document, HTMLStyleElement>();
export const transitionRootStyles = new WeakSet<Document>();
export const transitionWrapStates = new Map<string, boolean>();
export const transitionRunConfigs = new Map<string, TransitionRunConfig>();
export const transitionBindings = new Map<string, TransitionBinding>();

export function uniqueNames(name: string | readonly string[]): string[] {
	return [...new Set(Array.isArray(name) ? name : [name])].filter(Boolean);
}

export function isRenderableDocument(
	doc: Document | undefined,
): doc is Document {
	return !!doc && typeof doc.querySelectorAll === "function";
}

export function readStyleValue(
	style: CSSStyleDeclaration,
	name: string,
): string | null {
	return style.getPropertyValue(name) || null;
}

export function applyStyleProperty(
	element: Element,
	name: string,
	value: string,
): Cleanup {
	const styled = element as Element & { style: CSSStyleDeclaration };
	const previous = readStyleValue(styled.style, name);
	styled.style.setProperty(name, value);
	return () => {
		if (previous === null) {
			styled.style.removeProperty(name);
			return;
		}

		styled.style.setProperty(name, previous);
	};
}

export function applyRealClass(element: Element, className: string): Cleanup {
	const hadClass = element.classList.contains(className);
	if (!hadClass) {
		element.classList.add(className);
	}

	return () => {
		if (!hadClass) {
			element.classList.remove(className);
		}
	};
}

export function cssEscape(value: string): string {
	return typeof CSS !== "undefined" && typeof CSS.escape === "function"
		? CSS.escape(value)
		: value.replace(/[^a-zA-Z0-9_-]/g, "\\$&");
}

export function createTransitionTokens(name: string): TransitionStyle {
	return [
		Style.set("viewTransitionName", name),
		Attribute.attr(transitionMarker, name),
	] as const;
}

export function applyTransitionTokensToElement(
	element: Element,
	name: string,
): void {
	(element as Element & { style?: CSSStyleDeclaration }).style?.setProperty(
		"view-transition-name",
		name,
	);
	element.setAttribute(transitionMarker, name);
}

export function clearTransitionTokensFromElement(element: Element): void {
	(element as Element & { style?: CSSStyleDeclaration }).style?.removeProperty(
		"view-transition-name",
	);
	element.removeAttribute(transitionMarker);
}

export function createTransitionWrapElement(): HTMLElement {
	const doc = globalThis.document;
	const element = doc.createElement("transparent");
	element.style.setProperty("display", "contents");
	return element;
}

export function ensureTransitionRootStyles(doc: Document): void {
	if (transitionRootStyles.has(doc)) {
		return;
	}

	const style = doc.createElement("style");
	style.setAttribute("data-transition-root", "true");
	style.textContent = [
		":root{view-transition-name:none;}",
		"::view-transition{pointer-events:none;}",
	].join("\n");
	(doc.head ?? doc.documentElement)?.append(style);
	transitionRootStyles.add(doc);
}

export function resolveTransitionCondition(
	condition: boolean | (() => boolean),
): boolean {
	return typeof condition === "function" ? condition() : condition;
}

export function storeTransitionRunConfig(
	name: string,
	config?: TransitionWrapConfig,
): void {
	if (!config) {
		return;
	}

	const { fromPlaceholder: _fromPlaceholder, ...runConfig } = config;
	if (Object.keys(runConfig).length > 0) {
		transitionRunConfigs.set(name, runConfig);
	}
}

export function resolveTransitionRunConfig(
	names: readonly string[],
	config: TransitionRunConfig,
): TransitionRunConfig {
	const resolved: TransitionRunConfig = {};
	for (const name of names) {
		const stored = transitionRunConfigs.get(name);
		if (stored) {
			Object.assign(resolved, stored);
		}
	}

	return { ...resolved, ...config };
}

export function collectTransitionTargetIds(
	target: TransitionTargetInput,
): string[] {
	const candidates = Array.isArray(target) ? target : [target];
	const ids = candidates.map((candidate) => {
		if (typeof candidate === "string") {
			return candidate;
		}

		const id = candidate.getAttribute("id");
		if (!id) {
			throw new Error("ViewTransition targets require IDs");
		}

		return id;
	});

	return [...new Set(ids)];
}

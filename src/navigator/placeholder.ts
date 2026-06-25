import {
	applyTransitionTokensToElement,
	clearTransitionTokensFromElement,
	collectTransitionTargetIds,
	createTransitionWrapElement,
	cssEscape,
	ensureTransitionRootStyles,
	resolveTransitionCondition,
	storeTransitionRunConfig,
	transitionBindings,
	transitionWrapStates,
	type TransitionBinding,
	type TransitionTarget,
	type TransitionTargetInput,
	type TransitionWrapConfig,
	type TransitionWrapOptions,
} from "./shared.ts";

function ensureTransitionPlaceholderContainer(target: Element): void {
	const styledTarget = target as Element & { style: CSSStyleDeclaration };
	const position =
		styledTarget.style.getPropertyValue("position") ||
		styledTarget.style.position;
	if (!position || position === "static") {
		styledTarget.style.setProperty("position", "relative");
	}
}

function createTransitionPlaceholderElement(name: string): HTMLElement {
	const doc = globalThis.document;
	const placeholder = doc.createElement("transparent");
	placeholder.setAttribute("data-transition-placeholder", "true");
	placeholder.setAttribute("data-transition-placeholder-name", name);
	placeholder.setAttribute("aria-hidden", "true");
	placeholder.style.setProperty("position", "absolute");
	placeholder.style.setProperty("inset", "0");
	placeholder.style.setProperty("display", "block");
	placeholder.style.setProperty("margin", "0");
	placeholder.style.setProperty("padding", "0");
	placeholder.style.setProperty("opacity", "0");
	placeholder.style.setProperty("pointer-events", "none");
	placeholder.style.setProperty("visibility", "hidden");
	return placeholder;
}

export function ensureTransitionPlaceholder(
	target: Element,
	name: string,
): HTMLElement {
	ensureTransitionPlaceholderContainer(target);
	const element = target as Element & {
		querySelector?: (selector: string) => HTMLElement | null;
		prepend?: (...nodes: Node[]) => void;
		append?: (...nodes: Node[]) => void;
	};
	const existing = element.querySelector?.(
		`[data-transition-placeholder="true"][data-transition-placeholder-name="${cssEscape(name)}"]`,
	);
	if (existing) {
		return existing as HTMLElement;
	}

	const placeholder = createTransitionPlaceholderElement(name);
	if (typeof element.prepend === "function") {
		element.prepend(placeholder);
	} else {
		element.append?.(placeholder);
	}
	return placeholder;
}

export function bindTransition(
	name: string,
	start: TransitionTargetInput,
	end: TransitionTarget,
	config?: TransitionWrapConfig,
): TransitionBinding {
	const startIds = collectTransitionTargetIds(start);
	const [endId] = collectTransitionTargetIds(end);
	if (!endId) {
		throw new Error("ViewTransition end requires an ID");
	}

	const binding: TransitionBinding = {
		name,
		startIds,
		endId,
		config,
	};

	transitionBindings.set(name, binding);
	if (config) {
		storeTransitionRunConfig(name, config);
	}
	return binding;
}

export function wrapTransition(options: TransitionWrapOptions): Node {
	const doc = globalThis.document;
	if (isRenderableDocument(doc)) {
		ensureTransitionRootStyles(doc);
	}

	const active = resolveTransitionCondition(options.condition);
	storeTransitionRunConfig(options.name, options.config);
	if (options.config?.fromPlaceholder) {
		const wasActive = transitionWrapStates.get(options.name) === true;
		transitionWrapStates.set(options.name, active);
		ensureTransitionPlaceholderContainer(options.start);
		clearTransitionTokensFromElement(options.start);
		clearTransitionTokensFromElement(options.end);

		if (active) {
			const wrapper = createTransitionWrapElement();
			const fragment = doc.createDocumentFragment();
			applyTransitionTokensToElement(options.end, options.name);
			wrapper.append(options.start);
			fragment.append(wrapper, options.end);
			return fragment;
		}

		if (wasActive) {
			const placeholder = ensureTransitionPlaceholder(
				options.start,
				options.name,
			);
			applyTransitionTokensToElement(placeholder, options.name);
			return options.start;
		}

		applyTransitionTokensToElement(options.start, options.name);
		return options.start;
	}

	const element = active ? options.end : options.start;
	applyTransitionTokensToElement(element, options.name);
	return element;
}

function isRenderableDocument(doc: Document | undefined): doc is Document {
	return !!doc && typeof doc.querySelectorAll === "function";
}

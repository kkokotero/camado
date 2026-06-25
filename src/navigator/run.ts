import {
	applyRealClass,
	applyStyleProperty,
	applyTransitionTokensToElement,
	clearTransitionTokensFromElement,
	ensureTransitionRootStyles,
	resolveTransitionRunConfig,
	transitionStyleSheets,
	uniqueNames,
	type Cleanup,
	type TransitionClassState,
	type TransitionPseudoStyle,
	type TransitionRunConfig,
	type TransitionRunNodes,
} from "./shared.ts";
import { buildNodes, collectAfterNodes } from "./nodes.ts";
import { ensureTransitionPlaceholder } from "./placeholder.ts";

function appendPseudoStyleDeclarations(
	declarations: string[],
	pseudoStyle?: TransitionPseudoStyle,
): void {
	if (!pseudoStyle) {
		return;
	}

	if (pseudoStyle.width !== undefined) {
		declarations.push(`width:${pseudoStyle.width};`);
	}
	if (pseudoStyle.height !== undefined) {
		declarations.push(`height:${pseudoStyle.height};`);
	}
	if (pseudoStyle.overflow !== undefined) {
		declarations.push(`overflow:${pseudoStyle.overflow};`);
	}
	if (pseudoStyle.objectPosition !== undefined) {
		declarations.push(`object-position:${pseudoStyle.objectPosition};`);
	}
	if (pseudoStyle.zIndex !== undefined) {
		declarations.push(`z-index:${pseudoStyle.zIndex};`);
	}
}

function createPseudoRule(
	pseudo: "group" | "old" | "new" | "image-pair",
	name: string,
	config: TransitionRunConfig,
): string {
	const selector = `::view-transition-${pseudo}(${cssEscape(name)})`;
	const declarations: string[] = [];

	if (config.duration !== undefined) {
		declarations.push(`animation-duration:${config.duration}ms;`);
	}
	if (config.easing !== undefined) {
		declarations.push(`animation-timing-function:${config.easing};`);
	}
	if (config.delay !== undefined) {
		declarations.push(`animation-delay:${config.delay}ms;`);
	}
	if (config.fill !== undefined) {
		declarations.push(`animation-fill-mode:${config.fill};`);
	}
	appendPseudoStyleDeclarations(declarations, config.pseudoStyle);

	return declarations.length > 0 ? `${selector}{${declarations.join("")}}` : "";
}

function cssEscape(value: string): string {
	return typeof CSS !== "undefined" && typeof CSS.escape === "function"
		? CSS.escape(value)
		: value.replace(/[^a-zA-Z0-9_-]/g, "\\$&");
}

function ensureTransitionStyleSheet(doc: Document): HTMLStyleElement {
	const cached = transitionStyleSheets.get(doc);
	if (cached) {
		return cached;
	}

	const style = doc.createElement("style");
	style.setAttribute("data-transition", "true");
	(doc.head ?? doc.documentElement)?.append(style);
	transitionStyleSheets.set(doc, style);
	return style;
}

function applyPseudoAnimation(
	doc: Document,
	nodes: TransitionRunNodes,
	config: TransitionRunConfig,
): Cleanup {
	const pseudo = config.pseudo ?? "group";
	const rules = nodes.names
		.map((name) => createPseudoRule(pseudo, name, config))
		.filter(Boolean);

	if (rules.length === 0) {
		return () => {};
	}

	const style = ensureTransitionStyleSheet(doc);
	const previous = style.textContent ?? "";
	style.textContent = `${previous}\n${rules.join("\n")}`.trim();
	return () => {
		style.textContent = previous;
	};
}

function applyTransitionClasses(
	element: Element,
	state: TransitionClassState,
): Cleanup {
	const cleanup: Cleanup[] = [];

	if (state.name) {
		cleanup.push(
			applyStyleProperty(element, "view-transition-name", state.name),
		);
	}

	if (state.viewTransitionClass) {
		cleanup.push(
			applyStyleProperty(
				element,
				"view-transition-class",
				state.viewTransitionClass,
			),
		);
	}

	if (state.sharedClassName) {
		cleanup.push(applyRealClass(element, state.sharedClassName));
	}

	if (state.className) {
		cleanup.push(applyRealClass(element, state.className));
	}

	return () => {
		for (const step of cleanup.reverse()) {
			step();
		}
	};
}

function applyClassesForNodes(
	nodes: TransitionRunNodes,
	config: TransitionRunConfig,
): Cleanup {
	const cleanups: Cleanup[] = [];
	for (const name of nodes.names) {
		const item = nodes.items[name]!;
		const beforeSet = new Set(item.before);
		const afterSet = new Set(item.after);
		const shared = [...beforeSet].filter((element) => afterSet.has(element));
		const beforeOnly = item.before.filter((element) => !afterSet.has(element));
		const afterOnly = item.after.filter((element) => !beforeSet.has(element));

		for (const element of shared) {
			cleanups.push(
				applyTransitionClasses(element, {
					name,
					className: config.className ?? null,
					sharedClassName: config.sharedClassName ?? null,
					viewTransitionClass: config.className ?? null,
				}),
			);
		}

		for (const element of beforeOnly) {
			const className = config.closingClassName ?? config.className ?? null;
			cleanups.push(
				applyTransitionClasses(element, {
					name,
					className,
					sharedClassName: config.sharedClassName ?? null,
					viewTransitionClass: className,
				}),
			);
		}

		for (const element of afterOnly) {
			const className = config.openingClassName ?? config.className ?? null;
			cleanups.push(
				applyTransitionClasses(element, {
					name,
					className,
					sharedClassName: config.sharedClassName ?? null,
					viewTransitionClass: className,
				}),
			);
		}
	}

	return () => {
		for (const cleanup of cleanups.reverse()) {
			cleanup();
		}
	};
}

function runUpdate(
	update: (nodes: TransitionRunNodes) => void | Promise<void>,
	nodes: TransitionRunNodes,
): Promise<void> {
	return Promise.resolve(update(nodes));
}

export function launchTransition(
	name: string,
	startId: string,
	endId: string,
	update: (nodes: TransitionRunNodes) => void | Promise<void>,
	config: TransitionRunConfig = {},
): ViewTransition | undefined {
	const doc = globalThis.document;
	if (!isRenderableDocument(doc)) {
		return undefined;
	}

	ensureTransitionRootStyles(doc);

	const startElement = doc.getElementById(startId);
	const endElement = doc.getElementById(endId);
	if (!startElement || !endElement) {
		throw new Error("Unable to resolve a ViewTransition target");
	}

	const fromPlaceholder = config.fromPlaceholder === true;
	const startTarget = fromPlaceholder
		? ensureTransitionPlaceholder(startElement, name)
		: startElement;
	const cleanupAnimation = applyPseudoAnimation(
		doc,
		{
			names: [name],
			items: {
				[name]: {
					name,
					before: [startTarget],
					after: [endElement],
					firstBefore: startTarget,
					firstAfter: endElement,
				},
			},
		},
		config,
	);
	const cleanup: Cleanup[] = [
		cleanupAnimation,
		() => clearTransitionPlaceholdersForNames(doc, [name]),
		() => clearTransitionTokensFromElement(startElement),
		() => clearTransitionTokensFromElement(endElement),
	];

	if (fromPlaceholder) {
		clearTransitionTokensFromElement(startElement);
		applyTransitionTokensToElement(startTarget, name);
	} else {
		applyTransitionTokensToElement(startElement, name);
	}
	const execute = async () => {
		await update({
			names: [name],
			items: {
				[name]: {
					name,
					before: [startTarget],
					after: [endElement],
					firstBefore: startTarget,
					firstAfter: endElement,
				},
			},
		});
		applyTransitionTokensToElement(endElement, name);
		await Promise.resolve();
	};

	if (typeof doc.startViewTransition !== "function") {
		void execute().finally(() => {
			for (const step of cleanup.reverse()) {
				step();
			}
		});
		return undefined;
	}

	const transition = doc.startViewTransition(execute);
	void Promise.resolve(transition.finished)
		.catch(() => undefined)
		.finally(() => {
			for (const step of cleanup.reverse()) {
				step();
			}
		});

	return transition;
}

export function runTransition(
	name: string | string[],
	update: (nodes: TransitionRunNodes) => void | Promise<void>,
	config: TransitionRunConfig = {},
): ViewTransition | undefined {
	const doc = globalThis.document;
	if (!isRenderableDocument(doc)) {
		return undefined;
	}

	ensureTransitionRootStyles(doc);
	const names = uniqueNames(name);
	const effectiveConfig = resolveTransitionRunConfig(names, config);
	const nodes = buildNodes(doc, names);
	let cleanupPseudo: Cleanup = () => {};
	let cleanupClasses: Cleanup = () => {};

	const executeUpdate = async () => {
		clearTransitionPlaceholdersForNames(doc, names);
		await runUpdate(update, nodes);
		collectAfterNodes(doc, nodes);
		cleanupClasses = applyClassesForNodes(nodes, effectiveConfig);
		cleanupPseudo = applyPseudoAnimation(doc, nodes, effectiveConfig);
	};

	if (typeof doc.startViewTransition !== "function") {
		void executeUpdate().finally(() => {
			cleanupPseudo();
			cleanupClasses();
		});
		return undefined;
	}

	const transition = doc.startViewTransition(executeUpdate);
	scheduleCleanup(transition, () => {
		cleanupPseudo();
		cleanupClasses();
	});
	return transition;
}

function scheduleCleanup(
	transition: ViewTransition | undefined,
	cleanup: Cleanup,
): void {
	if (!transition) {
		cleanup();
		return;
	}

	void Promise.resolve(transition.finished)
		.catch(() => undefined)
		.finally(cleanup);
}

function isRenderableDocument(doc: Document | undefined): doc is Document {
	return !!doc && typeof doc.querySelectorAll === "function";
}

function clearTransitionPlaceholdersForNames(
	doc: Document,
	names: readonly string[],
): void {
	for (const name of names) {
		const placeholders = doc.querySelectorAll(
			`[data-transition-placeholder="true"][data-transition-placeholder-name="${cssEscape(name)}"]`,
		);
		for (const placeholder of Array.from(placeholders)) {
			placeholder.parentNode?.removeChild(placeholder);
		}
	}
}

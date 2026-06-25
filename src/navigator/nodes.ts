import {
	transitionMarker,
	type TransitionRunItem,
	type TransitionRunNodes,
} from "./shared.ts";

export function collectByTransitionName(
	doc: Document,
	names: readonly string[],
): TransitionRunNodes {
	const items: Record<string, TransitionRunItem> = {};
	for (const name of names) {
		items[name] = {
			name,
			before: [],
			after: [],
		};
	}

	const elements = Array.from(
		doc.querySelectorAll<HTMLElement>(`[${transitionMarker}]`),
	);
	for (const element of elements) {
		const raw = element.getAttribute(transitionMarker);
		if (!raw) {
			continue;
		}

		const elementNames = raw.split(/\s+/).filter(Boolean);
		for (const name of names) {
			if (!elementNames.includes(name)) {
				continue;
			}

			const item = items[name]!;
			item.before.push(element);
			if (!item.firstBefore) {
				item.firstBefore = element;
			}
		}
	}

	return {
		names: [...names],
		items,
	};
}

export function collectAfterNodes(
	doc: Document,
	nodes: TransitionRunNodes,
): void {
	const refreshed = collectByTransitionName(doc, nodes.names);
	for (const name of nodes.names) {
		const target = nodes.items[name]!;
		const source = refreshed.items[name]!;
		target.after = source.before;
		target.firstAfter = source.firstBefore ?? null;
	}
}

export function buildNodes(
	doc: Document,
	names: readonly string[],
): TransitionRunNodes {
	const nodes = collectByTransitionName(doc, names);
	for (const name of nodes.names) {
		const item = nodes.items[name]!;
		item.firstBefore = item.before[0] ?? null;
	}
	return nodes;
}

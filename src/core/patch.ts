import {
	appendChildValue,
	clearNodeRefs,
	getEventListeners,
	getNodeRefs,
	getObserverToken,
	setEventListeners,
	setNodeRefs,
} from "./factories.ts";
import {
	getComponentHostKeys,
	isComponentHostElement,
	isComponentHostHydrated,
	isComponentHostProjected,
} from "./component-host.ts";
import type { RenderValue } from "./base-component.ts";
import { isSelfToken, type SelfToken } from "./self.ts";
import {
	clearObserverRuntime,
	syncObserverRuntime,
} from "../modifiers/observer-runtime.ts";

export function patchRender(
	target: ParentNode | undefined,
	next: RenderValue,
): void {
	if (!target) {
		return;
	}

	const flattened = flattenRenderValue(next);
	const selfIndex = flattened.findIndex(isSelfToken);
	if (selfIndex > 0) {
		throw new Error("Camado Self(...) must be the first render value.");
	}

	if (selfIndex === 0 && flattened.slice(1).some(isSelfToken)) {
		throw new Error(
			"Camado Self(...) can only appear once and must be the first render value.",
		);
	}

	const selfToken = selfIndex === 0 ? (flattened[0] as SelfToken) : undefined;
	const selfNodes = selfToken ? collectSelfNodes(selfToken.children) : [];
	if (selfToken) {
		for (const child of selfToken.children) {
			appendChildValue(target, child);
		}
	}

	const nextNodes = selfToken
		? [
				...selfNodes,
				...flattened
					.slice(1)
					.filter((value): value is Node | string => !isSelfToken(value)),
			]
		: flattened.filter((value): value is Node | string => !isSelfToken(value));

	const childNodes = target.childNodes;
	if (!childNodes || childNodes.length === 0) {
		for (const child of nextNodes) {
			appendChildValue(target, child);
		}
		return;
	}

	const currentNodes = Array.from(childNodes);

	if (shouldForceFullReplace(target)) {
		resetAndAppend(target, nextNodes);
		return;
	}
	const sharedLength = Math.min(currentNodes.length, nextNodes.length);

	for (let index = 0; index < sharedLength; index += 1) {
		const currentNode = currentNodes[index]!;
		const nextNode = nextNodes[index]!;
		const patchedNode = patchNode(currentNode, nextNode);

		if (patchedNode !== currentNode) {
			currentNode.parentNode?.replaceChild(patchedNode, currentNode);
		}
	}

	for (
		let index = currentNodes.length - 1;
		index >= nextNodes.length;
		index -= 1
	) {
		const node = currentNodes[index];
		node?.parentNode?.removeChild(node);
	}

	for (let index = currentNodes.length; index < nextNodes.length; index += 1) {
		appendChildValue(target as ParentNode, nextNodes[index]!);
	}
}

function shouldForceFullReplace(target: ParentNode): boolean {
	return (
		isComponentHostElement(target) &&
		isComponentHostHydrated(target) &&
		isComponentHostProjected(target)
	);
}

function resetAndAppend(
	target: ParentNode,
	nodes: readonly (Node | string)[],
): void {
	const host = target as ParentNode & {
		replaceChildren?: (...items: Array<Node | string>) => void;
	};

	if (typeof host.replaceChildren === "function") {
		host.replaceChildren(...nodes);
	}
}

function patchNode(current: Node, next: Node | string): Node {
	if (typeof next === "string") {
		if (current.nodeType === 3) {
			current.textContent = next;
			return current;
		}

		return document.createTextNode(next);
	}

	if (current.nodeType !== next.nodeType) {
		return next;
	}

	if (isTextNode(current) && isTextNode(next)) {
		current.data = next.data;
		return current;
	}

	if (
		isElementNode(current) &&
		isElementNode(next) &&
		isSameElement(current, next)
	) {
		syncAttributes(current, next);
		syncInlineStyle(current, next);
		syncEventListeners(current, next);
		syncObserverBindings(current, next);
		transferNodeRefs(current, next);

		if (isComponentHostElement(current) && isComponentHostElement(next)) {
			syncComponentHostState(current, next);
			return current;
		}

		patchChildren(current, next);
		return current;
	}

	return next;
}

function patchChildren(
	current: Element | DocumentFragment,
	next: Element | DocumentFragment,
): void {
	const currentChildren = Array.from(current.childNodes);
	const nextChildren = Array.from(next.childNodes);

	if (!hasKeyedChildren(currentChildren) && !hasKeyedChildren(nextChildren)) {
		if (shouldFastReplaceChildren(currentChildren, nextChildren)) {
			resetAndAppend(current, nextChildren);
			return;
		}

		patchUnkeyedChildren(current, currentChildren, nextChildren);
		return;
	}

	const used = new Set<Node>();
	const keyedChildren = new Map<string | number, Node>();
	const plannedChildren: Node[] = [];

	for (const child of currentChildren) {
		const key = getNodeKey(child);
		if (key !== undefined && !keyedChildren.has(key)) {
			keyedChildren.set(key, child);
		}
	}

	for (let index = 0; index < nextChildren.length; index += 1) {
		const nextChild = nextChildren[index]!;
		const nextKey = getNodeKey(nextChild);
		let reusableChild: Node | undefined;

		if (nextKey !== undefined) {
			reusableChild = keyedChildren.get(nextKey);
		} else {
			const currentAtIndex = currentChildren[index];
			if (
				currentAtIndex &&
				!used.has(currentAtIndex) &&
				getNodeKey(currentAtIndex) === undefined &&
				isCompatiblePosition(currentAtIndex, nextChild)
			) {
				reusableChild = currentAtIndex;
			}
		}

		if (reusableChild) {
			used.add(reusableChild);
			plannedChildren.push(patchNode(reusableChild, nextChild));
			continue;
		}

		plannedChildren.push(nextChild);
	}

	for (let index = 0; index < plannedChildren.length; index += 1) {
		const node = plannedChildren[index]!;
		const anchor = current.childNodes[index] ?? null;
		insertNode(current, node, anchor);
	}

	for (const node of currentChildren) {
		if (!used.has(node) && node.parentNode === current) {
			removeNode(node);
		}
	}
}

function patchUnkeyedChildren(
	current: Element | DocumentFragment,
	currentChildren: Node[],
	nextChildren: readonly Node[],
): void {
	const sharedLength = Math.min(currentChildren.length, nextChildren.length);

	for (let index = 0; index < sharedLength; index += 1) {
		const currentChild = currentChildren[index]!;
		const nextChild = nextChildren[index]!;
		const patched = patchNode(currentChild, nextChild);

		if (patched !== currentChild) {
			currentChild.parentNode?.replaceChild(patched, currentChild);
		}
	}

	for (
		let index = currentChildren.length - 1;
		index >= nextChildren.length;
		index -= 1
	) {
		const node = currentChildren[index];
		node?.parentNode?.removeChild(node);
	}

	for (
		let index = currentChildren.length;
		index < nextChildren.length;
		index += 1
	) {
		insertNode(
			current,
			nextChildren[index]!,
			current.childNodes[index] ?? null,
		);
	}
}

const fastReplaceChildThreshold = 256;

function hasKeyedChildren(children: readonly Node[]): boolean {
	for (const child of children) {
		if (getNodeKey(child) !== undefined) {
			return true;
		}
	}

	return false;
}

function shouldFastReplaceChildren(
	currentChildren: readonly Node[],
	nextChildren: readonly Node[],
): boolean {
	if (
		currentChildren.length < fastReplaceChildThreshold ||
		nextChildren.length < fastReplaceChildThreshold
	) {
		return false;
	}

	for (const child of currentChildren) {
		if (isComponentHostElement(child)) {
			return false;
		}

		if (
			getEventListeners(child) ||
			getNodeRefs(child) ||
			getObserverToken(child)
		) {
			return false;
		}
	}

	return true;
}

function syncAttributes(current: Element, next: Element): void {
	const currentNames =
		typeof current.getAttributeNames === "function"
			? current.getAttributeNames()
			: Array.from(current.attributes, (attribute) => attribute.name);
	const nextNames = new Set(
		typeof next.getAttributeNames === "function"
			? next.getAttributeNames()
			: Array.from(next.attributes, (attribute) => attribute.name),
	);

	for (const name of currentNames) {
		if (!nextNames.has(name)) {
			current.removeAttribute(name);
		}
	}

	for (const name of nextNames) {
		const nextValue = next.getAttribute(name);
		if (current.getAttribute(name) !== nextValue) {
			if (nextValue === null) {
				current.removeAttribute(name);
			} else {
				current.setAttribute(name, nextValue);
			}
		}
	}
}

function syncInlineStyle(current: Element, next: Element): void {
	if ("style" in current && "style" in next) {
		const currentStyle = current as Element & { style: { cssText: string } };
		const nextStyle = next as Element & { style: { cssText: string } };
		currentStyle.style.cssText = nextStyle.style.cssText;
	}
}

function syncComponentHostState(current: Node, next: Node): void {
	const source = next as unknown as Record<string, unknown>;
	const target = current as unknown as Record<string, unknown>;
	const keys = getComponentHostKeys(current);

	if (!keys) {
		return;
	}

	const preserveUndefined =
		isComponentHostHydrated(current) && isComponentHostProjected(current);

	for (const key of keys) {
		if (typeof key !== "string") {
			continue;
		}

		if (preserveUndefined && source[key] === undefined) {
			continue;
		}

		target[key] = source[key];
	}
}

function syncEventListeners(current: Node, next: Node): void {
	const currentListeners = getEventListeners(current);
	const nextListeners = getEventListeners(next);

	if (!currentListeners && !nextListeners) {
		return;
	}

	const element = current as Element & {
		addEventListener?: (
			eventName: string,
			listener: EventListenerOrEventListenerObject,
		) => void;
		removeEventListener?: (
			eventName: string,
			listener: EventListenerOrEventListenerObject,
		) => void;
	};

	if (typeof element.addEventListener !== "function") {
		return;
	}

	if (currentListeners) {
		for (const eventName in currentListeners) {
			if (
				Object.hasOwn(currentListeners, eventName) &&
				nextListeners?.[eventName] !== currentListeners[eventName]
			) {
				element.removeEventListener?.(eventName, currentListeners[eventName]!);
			}
		}
	}

	if (nextListeners) {
		for (const eventName in nextListeners) {
			if (
				Object.hasOwn(nextListeners, eventName) &&
				currentListeners?.[eventName] !== nextListeners[eventName]
			) {
				element.addEventListener(eventName, nextListeners[eventName]!);
			}
		}
	}

	setEventListeners(current, nextListeners);
}

function syncObserverBindings(current: Node, next: Node): void {
	syncObserverRuntime(current, next);
}

function transferNodeRefs(current: Node, next: Node): void {
	const refs = getNodeRefs(next);
	if (!refs || refs.length === 0) {
		clearNodeRefs(current);
		return;
	}

	for (const ref of refs) {
		ref.current = current;
	}

	setNodeRefs(current, refs);
}

function getNodeKey(node: Node): string | number | undefined {
	return (node as Node & { key?: string | number }).key;
}

function isCompatiblePosition(current: Node, next: Node | string): boolean {
	if (typeof next === "string") {
		return isTextNode(current);
	}

	if (current.nodeType !== next.nodeType) {
		return false;
	}

	if (isTextNode(current) && isTextNode(next)) {
		return true;
	}

	if (isElementNode(current) && isElementNode(next)) {
		return isSameElement(current, next);
	}

	if (isFragmentNode(current) && isFragmentNode(next)) {
		return true;
	}

	return false;
}

function insertNode(
	parent: Element | DocumentFragment,
	node: Node,
	anchor: Node | null,
): void {
	if (anchor === node) {
		return;
	}

	const host = parent as ParentNode & {
		insertBefore?: (child: Node, before: Node | null) => Node;
		appendChild?: (child: Node) => Node;
		append?: (...items: Array<Node | string>) => void;
	};

	if (typeof host.insertBefore === "function") {
		host.insertBefore(node, anchor);
		return;
	}

	if (anchor === null && typeof host.appendChild === "function") {
		host.appendChild(node);
		return;
	}

	host.append?.(node);
}

function removeNode(node: Node): void {
	clearNodeRefs(node);
	clearObserverRuntime(node);
	const parent = node.parentNode as
		| (ParentNode & {
				removeChild?: (child: Node) => Node;
		  })
		| null;

	parent?.removeChild?.(node);
}

function flattenRenderValue(
	value: RenderValue,
): Array<Node | string | SelfToken> {
	const result: Array<Node | string | SelfToken> = [];
	collectRenderValues(value, result);
	return result;
}

function collectSelfNodes(children: readonly unknown[]): Array<Node | string> {
	const result: Array<Node | string> = [];
	for (const child of children) {
		collectSelfChild(child, result);
	}
	return result;
}

function collectSelfChild(value: unknown, result: Array<Node | string>): void {
	if (Array.isArray(value)) {
		for (const item of value) {
			collectSelfChild(item, result);
		}
		return;
	}

	if (value === null || value === undefined) {
		return;
	}

	if (
		typeof value === "string" ||
		typeof value === "number" ||
		typeof value === "bigint" ||
		typeof value === "boolean"
	) {
		result.push(String(value));
		return;
	}

	if (isFragmentLike(value)) {
		for (let index = 0; index < value.childNodes.length; index += 1) {
			collectSelfChild(value.childNodes[index], result);
		}
		return;
	}

	if (isNodeLike(value)) {
		result.push(value as Node);
	}
}

function collectRenderValues(
	value: RenderValue,
	result: Array<Node | string | SelfToken>,
): void {
	if (Array.isArray(value)) {
		for (const item of value) {
			collectRenderValues(item, result);
		}
		return;
	}

	if (value === null || value === undefined) {
		return;
	}

	if (
		typeof value === "string" ||
		typeof value === "number" ||
		typeof value === "bigint" ||
		typeof value === "boolean"
	) {
		result.push(String(value));
		return;
	}

	if (isFragmentLike(value)) {
		for (let index = 0; index < value.childNodes.length; index += 1) {
			collectRenderValues(value.childNodes[index] as RenderValue, result);
		}
		return;
	}

	result.push(value);
}

function isNodeLike(value: unknown): value is { nodeType: number } {
	return (
		typeof value === "object" &&
		value !== null &&
		typeof Reflect.get(
			value as Record<string | symbol, unknown>,
			"nodeType",
		) === "number"
	);
}

function isTextNode(node: Node): node is Text {
	return node.nodeType === 3;
}

function isElementNode(node: Node): node is Element {
	return node.nodeType === 1;
}

function isFragmentNode(node: Node): node is DocumentFragment {
	return node.nodeType === 11;
}

function isFragmentLike(
	value: unknown,
): value is { nodeType: number; childNodes: ArrayLike<unknown> } {
	return isNodeLike(value) && (value as { nodeType: number }).nodeType === 11;
}

function isSameElement(current: Element, next: Element): boolean {
	return (
		current.namespaceURI === next.namespaceURI &&
		current.tagName === next.tagName
	);
}

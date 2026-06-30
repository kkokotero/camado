import {
	appendChildValue,
	createFragment,
	type ChildValue,
} from "./factories.ts";
import { getComponentMetadata } from "./metadata.ts";
import type { BaseComponent } from "./base-component.ts";
import { setComponentOutputCallbacks } from "./output-callbacks.ts";
import type {
	ComponentChildren,
	ComponentConstructor,
	ComponentElement,
	ComponentInvocationArg,
	ComponentInvocationOptions,
	ComponentInvocationChildrenToken,
	ComponentInvocationSlotToken,
} from "./component-types.ts";

interface InvocationState {
	props: Record<string, unknown>;
	hostTokens: ChildValue[];
	projectedChildren: ChildValue[];
	outputCallbacks: Record<string, (detail: unknown) => unknown>;
}

export function invokeComponent<TComponent extends BaseComponent>(
	component: ComponentConstructor<TComponent>,
	...args: readonly ComponentInvocationArg<TComponent>[]
): ComponentElement<TComponent> {
	const metadata = getComponentMetadata(component as Function);
	const selector = metadata?.selector ?? component.name;
	const doc = globalThis.document;

	if (!doc) {
		throw new Error(
			`Camado requires a DOM to invoke ${selector || component.name}`,
		);
	}

	const element = doc.createElement(
		selector || component.name,
	) as ComponentElement<TComponent>;

	const state: InvocationState = {
		props: {},
		hostTokens: [],
		projectedChildren: [],
		outputCallbacks: {},
	};

	for (const arg of args) {
		collectInvocationArg(arg, metadata, state);
	}

	validateRequiredInvocationInputs(
		metadata,
		state.props,
		state.projectedChildren,
		selector || component.name,
	);

	applyDirectProps(element, metadata, state.props, state.outputCallbacks);
	setComponentOutputCallbacks(element, state.outputCallbacks);

	for (const token of state.hostTokens) {
		appendChildValue(element as unknown as ParentNode, token);
	}

	if (metadata && metadata.childrenKeys.size > 0) {
		if (state.projectedChildren.length > 0) {
			applyChildren(element, metadata, state.projectedChildren);
		}
		return element;
	}

	if (state.projectedChildren.length > 0) {
		appendChildValue(element as unknown as ParentNode, state.projectedChildren);
	}

	return element;
}

function collectInvocationArg<TComponent extends BaseComponent>(
	value: ComponentInvocationArg<TComponent>,
	metadata: ReturnType<typeof getComponentMetadata>,
	state: InvocationState,
): void {
	if (Array.isArray(value)) {
		for (const item of value) {
			collectInvocationArg(
				item as ComponentInvocationArg<TComponent>,
				metadata,
				state,
			);
		}
		return;
	}

	if (isInvocationPropsObject(value)) {
		mergeInvocationOptions(value, metadata, state);
		return;
	}

	if (isComponentInvocationChildrenToken(value)) {
		collectInvocationChildren(value.children, metadata, state);
		return;
	}

	if (isComponentInvocationSlotToken(value)) {
		state.props[value.name] = createFragment(...value.children);
		return;
	}

	if (isProjectedInvocationChild(value)) {
		state.projectedChildren.push(value);
		return;
	}

	state.hostTokens.push(value as ChildValue);
}

function mergeInvocationOptions<TComponent extends BaseComponent>(
	options: ComponentInvocationOptions<TComponent>,
	metadata: ReturnType<typeof getComponentMetadata>,
	state: InvocationState,
): void {
	for (const [key, value] of Object.entries(options)) {
		if (key === "children") {
			collectInvocationChildren(value, metadata, state);
			continue;
		}

		state.props[key] = value;
	}
}

function collectInvocationChildren(
	value: ComponentChildren,
	metadata: ReturnType<typeof getComponentMetadata>,
	state: InvocationState,
): void {
	if (value === undefined || value === null) {
		return;
	}

	if (Array.isArray(value)) {
		for (const item of value) {
			collectInvocationChildren(item, metadata, state);
		}
		return;
	}

	if (isInvocationPropsObject(value)) {
		mergeInvocationOptions(value, metadata, state);
		return;
	}

	if (isComponentInvocationChildrenToken(value)) {
		collectInvocationChildren(value.children, metadata, state);
		return;
	}

	if (isComponentInvocationSlotToken(value)) {
		state.props[value.name] = createFragment(...value.children);
		return;
	}

	if (isProjectedInvocationChild(value)) {
		state.projectedChildren.push(value);
		return;
	}

	state.hostTokens.push(value as ChildValue);
}

function applyDirectProps<TComponent extends BaseComponent>(
	element: TComponent,
	metadata: ReturnType<typeof getComponentMetadata>,
	props: Record<string, unknown>,
	outputCallbacks: Record<string, (detail: unknown) => unknown>,
): void {
	for (const [key, value] of Object.entries(props)) {
		if (metadata?.events.has(key)) {
			if (typeof value === "function") {
				outputCallbacks[key] = value as (detail: unknown) => unknown;
			}
			continue;
		}

		(element as unknown as Record<string, unknown>)[key] = value;
	}
}

function validateRequiredInvocationInputs(
	metadata: ReturnType<typeof getComponentMetadata>,
	directProps: Record<string, unknown>,
	childValues: readonly ChildValue[],
	componentName: string,
): void {
	if (!metadata) {
		return;
	}

	for (const key of metadata.propertyKeys) {
		if (typeof key !== "string") {
			continue;
		}

		if (!(key in directProps) || directProps[key] === undefined) {
			if (metadata.propertyRequiredKeys.has(key)) {
				throw new Error(
					`Camado property "${key}" is required for ${componentName}.`,
				);
			}
		}
	}

	for (const [key, slotName] of metadata.slotKeys) {
		if (!(key in directProps) || directProps[key as string] === undefined) {
			if (metadata.slotRequiredKeys.has(key)) {
				throw new Error(
					`Camado slot "${slotName}" is required for ${componentName}.`,
				);
			}
		}
	}

	if (metadata.childrenKeys.size > 0 && childValues.length === 0) {
		const requiredChild = [...metadata.childrenKeys].find((key) =>
			metadata.childrenRequiredKeys.has(key),
		);
		if (requiredChild !== undefined) {
			throw new Error(
				`Camado children "${String(requiredChild)}" is required for ${componentName}.`,
			);
		}
	}
}

function applyChildren<TComponent extends BaseComponent>(
	element: TComponent,
	metadata: ReturnType<typeof getComponentMetadata>,
	children: readonly ChildValue[],
): void {
	const childrenKeys = metadata ? [...metadata.childrenKeys] : [];

	if (childrenKeys.length > 0) {
		const fragment = createFragment(...children);

		childrenKeys.forEach((key, index) => {
			(element as Record<string | symbol, unknown>)[key] =
				index === 0 ? fragment : fragment.cloneNode(true);
		});

		return;
	}

	appendChildValue(element as unknown as ParentNode, children);
}

function isInvocationPropsObject<TComponent extends BaseComponent>(
	value: unknown,
): value is ComponentInvocationOptions<TComponent> {
	if (typeof value !== "object" || value === null || Array.isArray(value)) {
		return false;
	}

	if (isNodeLike(value)) {
		return false;
	}

	const record = value as Record<string, unknown>;
	if (typeof record.kind === "string") {
		return false;
	}

	if (
		typeof record.mode === "string" &&
		typeof record.toSnapshot === "function"
	) {
		return false;
	}

	if (typeof record.current !== "undefined") {
		return false;
	}

	return true;
}

function isComponentInvocationChildrenToken(
	value: unknown,
): value is ComponentInvocationChildrenToken {
	return (
		typeof value === "object" &&
		value !== null &&
		(value as { kind?: string }).kind === "component-children"
	);
}

function isComponentInvocationSlotToken(
	value: unknown,
): value is ComponentInvocationSlotToken {
	return (
		typeof value === "object" &&
		value !== null &&
		(value as { kind?: string }).kind === "component-slot"
	);
}

function isProjectedInvocationChild(value: unknown): value is ChildValue {
	return (
		typeof value === "string" ||
		typeof value === "number" ||
		typeof value === "bigint" ||
		typeof value === "boolean" ||
		isNodeLike(value)
	);
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

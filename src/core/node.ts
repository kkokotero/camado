export type NodeKind = "element" | "text" | "fragment" | "portal";

export interface BaseNodeDescriptor {
	readonly kind: NodeKind;
	readonly key?: string | number;
}

export interface ElementNodeDescriptor extends BaseNodeDescriptor {
	readonly kind: "element";
	readonly name: string;
	readonly namespace?: "html" | "svg";
	readonly props?: Readonly<Record<string, unknown>>;
	readonly children?: readonly NodeDescriptor[];
}

export interface TextNodeDescriptor extends BaseNodeDescriptor {
	readonly kind: "text";
	readonly value: string;
}

export interface FragmentNodeDescriptor extends BaseNodeDescriptor {
	readonly kind: "fragment";
	readonly children: readonly NodeDescriptor[];
}

export interface PortalNodeDescriptor extends BaseNodeDescriptor {
	readonly kind: "portal";
	readonly target: Node | null;
	readonly children: readonly NodeDescriptor[];
}

export type NodeDescriptor =
	| ElementNodeDescriptor
	| TextNodeDescriptor
	| FragmentNodeDescriptor
	| PortalNodeDescriptor;

export interface NodeRef<T extends Node = Node> {
	current: T | null;
}

export function createNodeRef<T extends Node = Node>(): NodeRef<T> {
	return { current: null };
}

export function isNodeDescriptor(value: unknown): value is NodeDescriptor {
	return (
		typeof value === "object" &&
		value !== null &&
		"kind" in value &&
		typeof (value as { kind: unknown }).kind === "string"
	);
}

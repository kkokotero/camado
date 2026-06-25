import { createNodeRef } from "./node.ts";

export function Ref<T extends Node = Node>() {
	return createNodeRef<T>();
}

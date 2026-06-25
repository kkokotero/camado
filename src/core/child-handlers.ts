export interface ChildHandler {
	test(value: unknown): boolean;
	handle(target: ParentNode, value: unknown): void;
}

const childHandlers: ChildHandler[] = [];

export function registerChildHandler(handler: ChildHandler): () => void {
	childHandlers.push(handler);
	return () => {
		const index = childHandlers.indexOf(handler);
		if (index >= 0) {
			childHandlers.splice(index, 1);
		}
	};
}

export function tryHandleChildValue(
	target: ParentNode,
	value: unknown,
): boolean {
	for (const handler of childHandlers) {
		if (!handler.test(value)) {
			continue;
		}

		handler.handle(target, value);
		return true;
	}

	return false;
}

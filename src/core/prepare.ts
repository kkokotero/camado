import type { BaseComponent } from "./base-component.ts";
import { getComponentMetadata } from "./metadata.ts";
import type {
	ComponentConstructor,
	ComponentFactory,
} from "./component-types.ts";

export type PreparedInput<TComponent extends BaseComponent = BaseComponent> =
	| ComponentConstructor<TComponent>
	| (ComponentFactory<TComponent> & { ctor: ComponentConstructor<TComponent> });

export interface PreparedComponent<
	TComponent extends BaseComponent = BaseComponent,
> {
	readonly name: string;
	readonly selector?: string;
	readonly component: ComponentConstructor<TComponent>;
}

export interface PreparedManifest {
	readonly components: readonly PreparedComponent[];
	readonly selectors: Readonly<Record<string, ComponentConstructor>>;
}

function resolveComponentConstructor<TComponent extends BaseComponent>(
	input: PreparedInput<TComponent>,
): ComponentConstructor<TComponent> {
	if (typeof input === "function" && "ctor" in input && input.ctor) {
		return input.ctor;
	}

	return input as unknown as ComponentConstructor<TComponent>;
}

export function prepare<
	const TComponents extends readonly PreparedInput<BaseComponent>[],
>(...components: TComponents): PreparedManifest {
	const prepared = components.map((input) => {
		const component = resolveComponentConstructor(input);
		const metadata = getComponentMetadata(component as Function);
		return Object.freeze({
			name: component.name,
			selector: metadata?.selector,
			component,
		});
	});

	return Object.freeze({
		components: prepared,
		selectors: Object.freeze(
			Object.fromEntries(
				prepared
					.filter((entry): entry is PreparedComponent & { selector: string } =>
						Boolean(entry.selector),
					)
					.map((entry) => [entry.selector, entry.component]),
			),
		),
	});
}

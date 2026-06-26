import type { BaseComponent } from "./base-component.ts";
import type { ChildValue } from "./factories.ts";

export type ComponentChildren = ChildValue | readonly ChildValue[];

type ComponentPropKeys<TComponent> = {
	[K in keyof TComponent]-?: K extends keyof BaseComponent | "children"
		? never
		: TComponent[K] extends (...args: any[]) => any
			? never
			: K;
}[keyof TComponent];

type ComponentMethodKeys<TComponent> = {
	[K in keyof TComponent]-?: K extends keyof BaseComponent | "children"
		? never
		: TComponent[K] extends (...args: any[]) => any
			? K
			: never;
}[keyof TComponent];

export type ComponentProps<TComponent> = Partial<
	Pick<TComponent, ComponentPropKeys<TComponent>>
>;

export type ComponentOutputCallbacks<TComponent> = Partial<{
	[K in ComponentMethodKeys<TComponent>]: TComponent[K] extends (
		...args: any[]
	) => infer Result
		? (detail: Awaited<Result>) => unknown
		: never;
}>;

export type ComponentInvocationOptions<TComponent = object> =
	ComponentProps<TComponent> &
		ComponentOutputCallbacks<TComponent> & {
			children?: ComponentChildren;
		};

export type ComponentConstructor<TComponent = object> = abstract new (
	...args: any[]
) => TComponent;

export type ComponentElement<TComponent extends BaseComponent> = HTMLElement &
	TComponent & {
		connectedCallback(): void;
		disconnectedCallback(): void;
	};

export type ComponentFactory<TComponent extends BaseComponent> = ((
	options?: ComponentInvocationOptions<TComponent>,
) => ComponentElement<TComponent>) & {
	ctor?: ComponentConstructor<TComponent>;
};

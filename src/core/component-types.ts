import type { BaseComponent } from "./base-component.ts";
import type { ChildValue } from "./factories.ts";

export type ComponentChildren = ChildValue | readonly ChildValue[];

export type ComponentProps<TComponent> = Partial<{
	[K in keyof TComponent as K extends "children" ? never : K]: TComponent[K];
}>;

export type ComponentInvocationOptions<TComponent = object> =
	ComponentProps<TComponent> & {
		children?: ComponentChildren;
	} & Record<string, unknown>;

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

import { ensureBinderInstanceProperty } from "./binder.ts";
import { markBinder } from "./metadata.ts";
import type { BinderConstructor, BaseBinder } from "./binder.ts";

export function Bind<TBinder extends BaseBinder<any>>(
	binder: BinderConstructor<any, TBinder>,
): PropertyDecorator {
	return (target, key) => {
		ensureBinderInstanceProperty(binder);
		markBinder(target, key, binder);
	};
}

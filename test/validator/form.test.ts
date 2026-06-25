import { expect, test } from "vitest";
import { Input } from "../../src/html/index.ts";
import { setCurrentRenderTarget } from "../../src/core/render-context.ts";
import { Field, Forms } from "../../src/validator/index.ts";

test("form controllers expose field state and validation", () => {
	const form = Forms.create({
		name: Field.text()
			.required("El nombre es obligatorio")
			.min(3, "Mínimo 3 caracteres"),
		email: Field.email()
			.required("El correo es obligatorio")
			.message("Correo inválido"),
		age: Field.number().min(18, "Debes ser mayor de edad"),
	});

	expect(form.valid).toBe(false);
	expect(form.invalid).toBe(true);
	expect(form.pristine).toBe(true);
	expect(form.untouched).toBe(true);
	expect(form.state.valid).toBe(false);
	expect(form.state.invalid).toBe(true);
	expect(form.state.values).toEqual({
		name: "",
		email: "",
		age: undefined,
	});

	form.set({ name: "Ada", email: "ada", age: 17 });

	expect(form.field.name.valid).toBe(true);
	expect(form.field.email.valid).toBe(false);
	expect(form.field.email.message).toBe("Correo inválido");
	expect(form.field.age.message).toBe("Debes ser mayor de edad");
	expect(form.values).toEqual({
		name: "Ada",
		email: "ada",
		age: 17,
	});
	expect(form.submit()).toBeNull();
	expect(form.verify()).toBe(false);
	expect(form.field.name.touched).toBe(true);
	form.touch();
	expect(form.touched).toBe(true);
	expect(form.field.name.clear).toBeTypeOf("function");
});

test("forms track render targets for reactive UI updates", () => {
	const form = Forms.create({
		name: Field.text().required("Required"),
	});
	let updates = 0;

	setCurrentRenderTarget({
		requestUpdate() {
			updates += 1;
		},
	});

	// Accessing the getter during render should subscribe the active component.
	void form.valid;
	setCurrentRenderTarget(null);

	form.field.name.set("Ada");
	expect(updates).toBe(1);
});

test("Input binds a form field to DOM input events", () => {
	const previousDocument = globalThis.document;
	const listeners = new Map<string, Array<(event: Event) => void>>();
	const element = {
		tagName: "INPUT",
		type: "text",
		value: "",
		checked: false,
		ownerDocument: null as unknown,
		setAttribute() {},
		removeAttribute() {},
		addEventListener(type: string, listener: (event: Event) => void) {
			const current = listeners.get(type) ?? [];
			current.push(listener);
			listeners.set(type, current);
		},
		dispatch(type: string) {
			for (const listener of listeners.get(type) ?? []) {
				listener({ type } as Event);
			}
		},
	} as unknown as HTMLInputElement & { dispatch(type: string): void };
	const doc = {
		createElement() {
			return element;
		},
	} as unknown as Document;

	try {
		(globalThis as typeof globalThis & { document: Document }).document = doc;

		const form = Forms.create({
			name: Field.text().required("Required"),
		});

		const input = Input(form.field.name) as HTMLInputElement & {
			dispatch(type: string): void;
		};
		expect(input.value).toBe("");

		input.value = "Ada";
		input.dispatch("input");
		expect(form.field.name.value).toBe("Ada");
		expect(form.field.name.dirty).toBe(true);
		form.field.name.verify();
		expect(form.field.name.touched).toBe(true);
	} finally {
		(globalThis as typeof globalThis & { document: Document }).document =
			previousDocument as Document;
	}
});

import { expect, test } from "vitest";
import { Validator, ValidationError } from "../../src/validator/index.ts";

test("validator parses chained strings", () => {
	const schema = Validator.string().trim().min(3).email();

	expect(schema.parse("  test@example.com  ")).toBe("test@example.com");
	expect(schema.safeParse("x")).toEqual({
		success: false,
		error: expect.any(ValidationError),
	});
});

test("validator parses objects and arrays", () => {
	const schema = Validator.object({
		name: Validator.string().min(1),
		age: Validator.number().int().min(18),
		tags: Validator.array(Validator.string().nonempty()).min(1),
	});

	expect(
		schema.parse({
			name: "Ada",
			age: 36,
			tags: ["ui", "forms"],
		}),
	).toEqual({
		name: "Ada",
		age: 36,
		tags: ["ui", "forms"],
	});
});

test("validator precompiles parsers", () => {
	const schema = Validator.literal("ready");
	const first = schema.compile();
	const second = schema.compile();

	expect(first).toBe(second);
	expect(first("ready")).toBe("ready");
});

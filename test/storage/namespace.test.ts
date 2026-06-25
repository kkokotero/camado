import { expect, test } from "vitest";
import { Storage } from "../../src/storage/index.ts";

test("storage namespaces isolate values and support clear with undefined", () => {
	const storeA = Storage.memory<{ value: string | undefined }>("alpha");
	const storeB = Storage.memory<{ value: string | undefined }>("beta");

	storeA.set("value", "one");
	storeB.set("value", "two");
	expect(storeA.get("value")).toBe("one");
	expect(storeB.get("value")).toBe("two");

	storeA.set("value", undefined);
	expect(storeA.has("value")).toBe(false);
	expect(storeA.get("value")).toBeUndefined();

	storeB.clear();
	expect(storeB.keys()).toEqual([]);
});

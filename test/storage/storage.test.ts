import { expect, test } from "vitest";
import { Storage } from "../../src/storage/index.ts";

test("storage memory wrapper keeps values typed per key", () => {
	const store = Storage.memory<{
		count: number;
		user: { name: string };
	}>("storage-test");

	store.set("count", 3).set("user", { name: "Ana" });

	expect(store.get("count")).toBe(3);
	expect(store.get("user")).toEqual({ name: "Ana" });
	expect(store.has("count")).toBe(true);
	expect(store.keys()).toEqual(expect.arrayContaining(["count", "user"]));
	expect(store.snapshot()).toEqual({ count: 3, user: { name: "Ana" } });

	store.remove("count");
	expect(store.has("count")).toBe(false);
});

test("storage local wrapper round-trips through web storage", () => {
	const previousLocalStorage = globalThis.localStorage;
	const values = new Map<string, string>();

	(globalThis as typeof globalThis & { localStorage: Storage }).localStorage = {
		getItem: (key: string) => values.get(key) ?? null,
		setItem: (key: string, value: string) => {
			values.set(key, value);
		},
		removeItem: (key: string) => {
			values.delete(key);
		},
		clear: () => {
			values.clear();
		},
		key: (index: number) => [...values.keys()][index] ?? null,
		get length() {
			return values.size;
		},
	};

	try {
		const store = Storage.local<{
			message: string;
			count: number;
		}>("storage-local-test");

		store.set("message", "hello").set("count", 9);

		expect(store.get("message")).toBe("hello");
		expect(store.get("count")).toBe(9);
		expect(store.entries()).toEqual([
			["message", "hello"],
			["count", 9],
		]);
	} finally {
		(
			globalThis as typeof globalThis & { localStorage?: Storage }
		).localStorage = previousLocalStorage;
	}
});

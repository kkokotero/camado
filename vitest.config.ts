import { defineConfig } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";

export default defineConfig({
	test: {
		projects: [
			{
				test: {
					name: "node",
					environment: "node",
					include: ["test/**/*.test.ts"],
					exclude: ["test/browser/**/*.browser.test.ts"],
				},
			},
			{
				test: {
					name: "browser",
					browser: {
						enabled: true,
						headless: true,
						provider: playwright(),
						instances: [{ browser: "chromium" }],
					},
					include: ["test/browser/**/*.browser.test.ts"],
				},
			},
		],
	},
});

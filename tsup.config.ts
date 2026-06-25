import { defineConfig } from "tsup";

const entry = [
	"src/index.ts",
	"src/control/index.ts",
	"src/core/index.ts",
	"src/html/index.ts",
	"src/modifiers/index.ts",
	"src/navigator/index.ts",
	"src/reactive/index.ts",
	"src/storage/index.ts",
	"src/svg/index.ts",
	"src/unit/index.ts",
	"src/validator/index.ts",
];

export default defineConfig({
	entry,
	clean: true,
	dts: true,
	format: ["esm"],
	minify: true,
	outDir: "dist",
	platform: "node",
	sourcemap: false,
	splitting: true,
	target: "es2022",
	treeshake: true,
	bundle: true,
});

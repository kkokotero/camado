import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

type TagSpec = readonly [exportName: string, tagName: string];

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = resolve(rootDir, "src");
const libDir = dirname(
	ts.getDefaultLibFilePath({ target: ts.ScriptTarget.ESNext }),
);
const domLibPath = resolve(libDir, "lib.dom.d.ts");

function ensureDir(path: string): void {
	mkdirSync(path, { recursive: true });
}

function toExportName(tagName: string): string {
	return tagName
		.split("-")
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join("")
		.replace(/^\d/, (digit) => `_${digit}`);
}

function extractTagNames(interfaceName: string): string[] {
	const sourceText = readFileSync(domLibPath, "utf8");
	const sourceFile = ts.createSourceFile(
		domLibPath,
		sourceText,
		ts.ScriptTarget.Latest,
		true,
	);

	for (const statement of sourceFile.statements) {
		if (
			!ts.isInterfaceDeclaration(statement) ||
			statement.name.text !== interfaceName
		) {
			continue;
		}

		const tags = statement.members
			.map((member) => {
				if (!ts.isPropertySignature(member) || !member.name) {
					return null;
				}

				if (ts.isIdentifier(member.name) || ts.isStringLiteral(member.name)) {
					return member.name.text;
				}

				return member.name.getText(sourceFile).replace(/^"|"$/g, "");
			})
			.filter((tag): tag is string => Boolean(tag));

		return tags;
	}

	throw new Error(`Could not find ${interfaceName} in ${domLibPath}`);
}

function toTagSpecs(tags: readonly string[]): readonly TagSpec[] {
	return tags.map((tagName) => [toExportName(tagName), tagName] as const);
}

function renderModule(
	namespace: "html" | "svg",
	tags: readonly TagSpec[],
): string {
	const factoryName =
		namespace === "html" ? "createHtmlFactory" : "createSvgFactory";
	const importLine =
		namespace === "html"
			? `import { createElementFactory, createFragment, type ChildValue } from "../core/factories.ts";`
			: `import { createElementFactory, type ChildValue } from "../core/factories.ts";`;

	const lines = [
		importLine,
		"",
		`function ${factoryName}(tagName: string) {`,
		`\treturn (...children: readonly ChildValue[]) =>`,
		`\t\tcreateElementFactory(tagName, { namespace: "${namespace}" })(...children);`,
		`}`,
		"",
	];

	for (const [exportName, tagName] of tags) {
		lines.push(`export const ${exportName} = ${factoryName}("${tagName}");`);
	}

	if (namespace === "html") {
		lines.push("");
		lines.push(
			`export const Fragment = (...children: readonly ChildValue[]) => createFragment(...children);`,
		);
		lines.push(`export function Text(value: ChildValue): Text {`);
		lines.push(`\treturn document.createTextNode(String(value));`);
		lines.push(`}`);
	}

	lines.push("");
	return lines.join("\n");
}

function writeNamespaceFile(
	namespace: "html" | "svg",
	tags: readonly TagSpec[],
): void {
	const targetDir = resolve(srcDir, namespace);
	ensureDir(targetDir);
	writeFileSync(
		resolve(targetDir, "index.ts"),
		`${renderModule(namespace, tags)}\n`,
	);
}

function cleanupLegacyFiles(): void {
	rmSync(resolve(srcDir, "html.ts"), { force: true });
	rmSync(resolve(srcDir, "svg.ts"), { force: true });
}

const htmlTags = toTagSpecs(extractTagNames("HTMLElementTagNameMap"));
const svgTags = toTagSpecs(extractTagNames("SVGElementTagNameMap"));

ensureDir(srcDir);
writeNamespaceFile("html", htmlTags);
writeNamespaceFile("svg", svgTags);
cleanupLegacyFiles();

console.log(
	`Generated ${htmlTags.length} HTML tags from HTMLElementTagNameMap into src/html/index.ts and ${svgTags.length} SVG tags from SVGElementTagNameMap into src/svg/index.ts.`,
);

import { registerChildHandler } from "../core/child-handlers.ts";

type StyleValue = string | number | { toString(): string };

type StyleMode = "class" | "inline";

type StyleRule = {
	readonly selector?: string;
	readonly media?: string;
	readonly supports?: string;
	readonly declarations: Readonly<Record<string, string>>;
	readonly children: readonly StyleRule[];
};

function toCssPropertyName(name: string): string {
	return name.replace(/[A-Z]/g, (character) => `-${character.toLowerCase()}`);
}

function normalizeStyleValue(value: StyleValue): string {
	return String(value);
}

function normalizeStyleRule(rule: StyleRule): StyleRule {
	return {
		selector: rule.selector,
		media: rule.media,
		supports: rule.supports,
		declarations: Object.fromEntries(
			Object.entries(rule.declarations).sort(([left], [right]) =>
				left.localeCompare(right),
			),
		),
		children: rule.children.map(normalizeStyleRule),
	};
}

function serializeDeclarations(
	declarations: Readonly<Record<string, string>>,
): string {
	return Object.entries(declarations)
		.map(([name, value]) => `${toCssPropertyName(name)}:${value};`)
		.join("");
}

function styleRuleHasContent(rule: StyleRule): boolean {
	return Object.keys(rule.declarations).length > 0 || rule.children.length > 0;
}

function styleRuleToCss(selector: string, rule: StyleRule): string {
	let css = "";
	if (Object.keys(rule.declarations).length > 0) {
		css += `${selector}{${serializeDeclarations(rule.declarations)}}`;
	}

	for (const child of rule.children) {
		if (child.media) {
			css += `@media ${child.media}{${styleRuleToCss(selector, child)}}`;
			continue;
		}
		if (child.supports) {
			css += `@supports ${child.supports}{${styleRuleToCss(selector, child)}}`;
			continue;
		}
		css += styleRuleToCss(`${selector}${child.selector ?? ""}`, child);
	}

	return css;
}

let styleCounter = 0;
let installed = false;
const styleCache = new Map<string, string>();
const styleSheetCache = new WeakMap<Document, HTMLStyleElement>();

function createClassName(rule: StyleRule): string {
	const key = JSON.stringify(normalizeStyleRule(rule));
	const cached = styleCache.get(key);
	if (cached) {
		return cached;
	}

	const className = `n${((styleCounter += 1)).toString(36)}`;
	styleCache.set(key, className);
	return className;
}

function ensureStyleSheet(doc: Document | undefined): HTMLStyleElement | null {
	if (!doc) {
		return null;
	}

	const cached = styleSheetCache.get(doc);
	if (cached) {
		return cached;
	}

	const existing =
		typeof doc.querySelector === "function"
			? doc.querySelector("style[data-style]")
			: null;
	if (existing && typeof existing === "object" && "textContent" in existing) {
		styleSheetCache.set(doc, existing as HTMLStyleElement);
		return existing as HTMLStyleElement;
	}

	if (typeof doc.createElement !== "function") {
		return null;
	}

	const style = doc.createElement("style");
	style.setAttribute("data-style", "true");
	(doc.head ?? doc.documentElement)?.append?.(style);
	styleSheetCache.set(doc, style);
	return style;
}

function applyStyleClass(target: ParentNode, rule: StyleRule): void {
	const element = target as ParentNode & {
		classList?: { add?: (...classes: string[]) => void };
		getAttribute?: (name: string) => string | null;
		setAttribute?: (name: string, value: string) => void;
		ownerDocument?: Document;
	};

	if (
		typeof element.classList?.add !== "function" &&
		typeof element.setAttribute !== "function"
	) {
		return;
	}

	if (!styleRuleHasContent(rule)) {
		return;
	}

	const className = createClassName(rule);
	const style = ensureStyleSheet(element.ownerDocument ?? globalThis.document);
	if (style) {
		const css = styleRuleToCss(`.${className}`, rule);
		if (css && !(style.textContent ?? "").includes(css)) {
			const textNode = (
				style.ownerDocument ?? globalThis.document
			)?.createTextNode(css);
			if (textNode) {
				style.append?.(textNode);
			}
			style.textContent =
				`${style.textContent ?? ""}${style.textContent ? "\n" : ""}${css}`.trim();
		}
	}

	if (typeof element.classList?.add === "function") {
		element.classList.add(className);
		return;
	}

	const current = element.getAttribute?.("class");
	element.setAttribute?.(
		"class",
		current ? `${current} ${className}` : className,
	);
}

function applyInlineStyles(
	target: ParentNode,
	styles: Readonly<Record<string, string>>,
): void {
	const element = target as ParentNode & { style?: CSSStyleDeclaration };
	if (typeof element.style?.setProperty !== "function") {
		return;
	}

	for (const [name, value] of Object.entries(styles)) {
		element.style.setProperty(toCssPropertyName(name), value);
	}
}

function wrapStyleBuilder(builder: StyleBuilder): StyleBuilder {
	let proxy: StyleBuilder;
	proxy = new Proxy(builder, {
		get(target, property, receiver) {
			if (typeof property !== "string") {
				return Reflect.get(target, property, receiver);
			}

			const value = Reflect.get(target, property, target);
			if (typeof value === "function") {
				return (...args: unknown[]) => {
					const result = value.apply(target, args);
					return result === target ? proxy : result;
				};
			}

			if (property in target) {
				return value;
			}

			return (...args: unknown[]) => {
				if (args.length === 1) {
					target.set(property, args[0] as StyleValue);
				}

				return proxy;
			};
		},
	});
	return proxy;
}

export class StyleBuilder {
	[key: string]: any;
	readonly mode: StyleMode;
	#styles: Record<string, StyleValue> = {};
	#children: StyleRule[] = [];

	constructor(mode: StyleMode = "class") {
		this.mode = mode;
	}

	display(value: StyleValue): this {
		this.#styles.display = value;
		return this;
	}
	flexDirection(value: StyleValue): this {
		this.#styles.flexDirection = value;
		return this;
	}
	gap(value: StyleValue): this {
		this.#styles.gap = normalizeStyleValue(value);
		return this;
	}
	padding(value: StyleValue): this {
		this.#styles.padding = normalizeStyleValue(value);
		return this;
	}
	margin(value: StyleValue): this {
		this.#styles.margin = normalizeStyleValue(value);
		return this;
	}
	background(value: StyleValue): this {
		this.#styles.background = value;
		return this;
	}
	color(value: StyleValue): this {
		this.#styles.color = value;
		return this;
	}
	borderRadius(value: StyleValue): this {
		this.#styles.borderRadius = normalizeStyleValue(value);
		return this;
	}
	radius(value: StyleValue): this {
		return this.borderRadius(value);
	}
	set(name: string, value: StyleValue): this {
		this.#styles[name] = normalizeStyleValue(value);
		return this;
	}
	pseudo(selector: string, apply: (style: StyleBuilder) => void): StyleBuilder {
		return this.#nest({ selector }, apply);
	}
	hover(apply: (style: StyleBuilder) => void): StyleBuilder {
		return this.pseudo(":hover", apply);
	}
	focus(apply: (style: StyleBuilder) => void): StyleBuilder {
		return this.pseudo(":focus", apply);
	}
	active(apply: (style: StyleBuilder) => void): StyleBuilder {
		return this.pseudo(":active", apply);
	}
	before(apply: (style: StyleBuilder) => void): StyleBuilder {
		return this.pseudo("::before", apply);
	}
	after(apply: (style: StyleBuilder) => void): StyleBuilder {
		return this.pseudo("::after", apply);
	}
	media(query: string, apply: (style: StyleBuilder) => void): StyleBuilder {
		return this.#nest({ media: query }, apply);
	}
	supports(query: string, apply: (style: StyleBuilder) => void): StyleBuilder {
		return this.#nest({ supports: query }, apply);
	}

	toRecord(): Record<string, string> {
		return Object.fromEntries(
			Object.entries(this.#styles).map(([name, value]) => [
				name,
				String(value),
			]),
		);
	}

	toSnapshot(): StyleRule {
		return {
			declarations: this.toRecord(),
			children: this.#children.map((entry) => ({
				...entry,
				children: entry.children.map((child) => child),
			})),
		};
	}

	#nest(
		entry: Pick<StyleRule, "selector" | "media" | "supports">,
		apply: (style: StyleBuilder) => void,
	): StyleBuilder {
		const builder = new StyleBuilder(this.mode);
		apply(builder);
		this.#children.push({
			...entry,
			declarations: builder.toRecord(),
			children: builder.#children,
		});
		return this;
	}
}

export function createStyleBuilder(mode: StyleMode = "class"): StyleBuilder {
	return wrapStyleBuilder(new StyleBuilder(mode));
}

export function ensureStyleRuntime(): void {
	if (installed) {
		return;
	}

	installed = true;
	registerChildHandler({
		test: (value): value is StyleBuilder =>
			typeof value === "object" &&
			value !== null &&
			typeof (value as { toSnapshot?: unknown }).toSnapshot === "function" &&
			typeof (value as { mode?: unknown }).mode === "string",
		handle(target, value) {
			const builder = value as StyleBuilder;
			if (builder.mode === "inline") {
				applyInlineStyles(target, builder.toRecord());
				return;
			}

			applyStyleClass(target, builder.toSnapshot());
		},
	});
}

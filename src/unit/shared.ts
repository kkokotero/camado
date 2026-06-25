export type CssValueLike =
	| string
	| number
	| { toString(): string; valueOf?: () => string | number };

export class CssText {
	readonly #text: string;

	constructor(text: string) {
		this.#text = text;
	}

	toString(): string {
		return this.#text;
	}

	valueOf(): string {
		return this.#text;
	}

	[Symbol.toPrimitive](): string {
		return this.#text;
	}
}

export class CssFunction extends CssText {
	constructor(name: string, values: readonly CssValueLike[]) {
		super(`${name}(${values.map(String).join(", ")})`);
	}
}

export interface EmailOptions {
	subject?: string;
	body?: string;
	cc?: string | readonly string[];
	bcc?: string | readonly string[];
}

function encodeList(value?: string | readonly string[]): string | undefined {
	if (value === undefined) {
		return undefined;
	}

	return typeof value === "string" ? value : value.join(",");
}

function buildMailtoHref(to: string, options: EmailOptions = {}): string {
	const params = new URLSearchParams();
	if (options.subject) {
		params.set("subject", options.subject);
	}
	if (options.body) {
		params.set("body", options.body);
	}
	const cc = encodeList(options.cc);
	if (cc) {
		params.set("cc", cc);
	}
	const bcc = encodeList(options.bcc);
	if (bcc) {
		params.set("bcc", bcc);
	}

	const query = params.toString();
	return `mailto:${to}${query ? `?${query}` : ""}`;
}

export function email(to: string, options: EmailOptions = {}): string {
	const href = buildMailtoHref(to, options);
	globalThis.location?.assign(href);
	return href;
}

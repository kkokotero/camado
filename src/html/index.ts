import {
	createElementFactory,
	createFragment,
	type ChildValue,
} from "../core/factories.ts";

function createHtmlFactory(tagName: string) {
	return (...children: readonly ChildValue[]) =>
		createElementFactory(tagName, { namespace: "html" })(...children);
}

export const A = /*#__PURE__*/ createHtmlFactory("a");
export const Abbr = /*#__PURE__*/ createHtmlFactory("abbr");
export const Address = /*#__PURE__*/ createHtmlFactory("address");
export const Area = /*#__PURE__*/ createHtmlFactory("area");
export const Article = /*#__PURE__*/ createHtmlFactory("article");
export const Aside = /*#__PURE__*/ createHtmlFactory("aside");
export const Audio = /*#__PURE__*/ createHtmlFactory("audio");
export const B = /*#__PURE__*/ createHtmlFactory("b");
export const Base = /*#__PURE__*/ createHtmlFactory("base");
export const Bdi = /*#__PURE__*/ createHtmlFactory("bdi");
export const Bdo = /*#__PURE__*/ createHtmlFactory("bdo");
export const Blockquote = /*#__PURE__*/ createHtmlFactory("blockquote");
export const Body = /*#__PURE__*/ createHtmlFactory("body");
export const Br = /*#__PURE__*/ createHtmlFactory("br");
export const Button = /*#__PURE__*/ createHtmlFactory("button");
export const Canvas = /*#__PURE__*/ createHtmlFactory("canvas");
export const Caption = /*#__PURE__*/ createHtmlFactory("caption");
export const Cite = /*#__PURE__*/ createHtmlFactory("cite");
export const Code = /*#__PURE__*/ createHtmlFactory("code");
export const Col = /*#__PURE__*/ createHtmlFactory("col");
export const Colgroup = /*#__PURE__*/ createHtmlFactory("colgroup");
export const Data = /*#__PURE__*/ createHtmlFactory("data");
export const Datalist = /*#__PURE__*/ createHtmlFactory("datalist");
export const Dd = /*#__PURE__*/ createHtmlFactory("dd");
export const Del = /*#__PURE__*/ createHtmlFactory("del");
export const Details = /*#__PURE__*/ createHtmlFactory("details");
export const Dfn = /*#__PURE__*/ createHtmlFactory("dfn");
export const Dialog = /*#__PURE__*/ createHtmlFactory("dialog");
export const Div = /*#__PURE__*/ createHtmlFactory("div");
export const Dl = /*#__PURE__*/ createHtmlFactory("dl");
export const Dt = /*#__PURE__*/ createHtmlFactory("dt");
export const Em = /*#__PURE__*/ createHtmlFactory("em");
export const Embed = /*#__PURE__*/ createHtmlFactory("embed");
export const Fieldset = /*#__PURE__*/ createHtmlFactory("fieldset");
export const Figcaption = /*#__PURE__*/ createHtmlFactory("figcaption");
export const Figure = /*#__PURE__*/ createHtmlFactory("figure");
export const Footer = /*#__PURE__*/ createHtmlFactory("footer");
export const Form = /*#__PURE__*/ createHtmlFactory("form");
export const H1 = /*#__PURE__*/ createHtmlFactory("h1");
export const H2 = /*#__PURE__*/ createHtmlFactory("h2");
export const H3 = /*#__PURE__*/ createHtmlFactory("h3");
export const H4 = /*#__PURE__*/ createHtmlFactory("h4");
export const H5 = /*#__PURE__*/ createHtmlFactory("h5");
export const H6 = /*#__PURE__*/ createHtmlFactory("h6");
export const Head = /*#__PURE__*/ createHtmlFactory("head");
export const Header = /*#__PURE__*/ createHtmlFactory("header");
export const Hgroup = /*#__PURE__*/ createHtmlFactory("hgroup");
export const Hr = /*#__PURE__*/ createHtmlFactory("hr");
export const Html = /*#__PURE__*/ createHtmlFactory("html");
export const I = /*#__PURE__*/ createHtmlFactory("i");
export const Iframe = /*#__PURE__*/ createHtmlFactory("iframe");
export const Img = /*#__PURE__*/ createHtmlFactory("img");
export const Input = /*#__PURE__*/ createHtmlFactory("input");
export const Ins = /*#__PURE__*/ createHtmlFactory("ins");
export const Kbd = /*#__PURE__*/ createHtmlFactory("kbd");
export const Label = /*#__PURE__*/ createHtmlFactory("label");
export const Legend = /*#__PURE__*/ createHtmlFactory("legend");
export const Li = /*#__PURE__*/ createHtmlFactory("li");
export const Link = /*#__PURE__*/ createHtmlFactory("link");
export const Main = /*#__PURE__*/ createHtmlFactory("main");
export const Map = /*#__PURE__*/ createHtmlFactory("map");
export const Mark = /*#__PURE__*/ createHtmlFactory("mark");
export const Menu = /*#__PURE__*/ createHtmlFactory("menu");
export const Meta = /*#__PURE__*/ createHtmlFactory("meta");
export const Meter = /*#__PURE__*/ createHtmlFactory("meter");
export const Nav = /*#__PURE__*/ createHtmlFactory("nav");
export const Noscript = /*#__PURE__*/ createHtmlFactory("noscript");
export const Object = /*#__PURE__*/ createHtmlFactory("object");
export const Ol = /*#__PURE__*/ createHtmlFactory("ol");
export const Optgroup = /*#__PURE__*/ createHtmlFactory("optgroup");
export const Option = /*#__PURE__*/ createHtmlFactory("option");
export const Output = /*#__PURE__*/ createHtmlFactory("output");
export const P = /*#__PURE__*/ createHtmlFactory("p");
export const Picture = /*#__PURE__*/ createHtmlFactory("picture");
export const Pre = /*#__PURE__*/ createHtmlFactory("pre");
export const Progress = /*#__PURE__*/ createHtmlFactory("progress");
export const Q = /*#__PURE__*/ createHtmlFactory("q");
export const Rp = /*#__PURE__*/ createHtmlFactory("rp");
export const Rt = /*#__PURE__*/ createHtmlFactory("rt");
export const Ruby = /*#__PURE__*/ createHtmlFactory("ruby");
export const S = /*#__PURE__*/ createHtmlFactory("s");
export const Samp = /*#__PURE__*/ createHtmlFactory("samp");
export const Script = /*#__PURE__*/ createHtmlFactory("script");
export const Search = /*#__PURE__*/ createHtmlFactory("search");
export const Section = /*#__PURE__*/ createHtmlFactory("section");
export const Select = /*#__PURE__*/ createHtmlFactory("select");
export const Slot = /*#__PURE__*/ createHtmlFactory("slot");
export const Small = /*#__PURE__*/ createHtmlFactory("small");
export const Source = /*#__PURE__*/ createHtmlFactory("source");
export const Span = /*#__PURE__*/ createHtmlFactory("span");
export const Strong = /*#__PURE__*/ createHtmlFactory("strong");
export const Style = /*#__PURE__*/ createHtmlFactory("style");
export const Sub = /*#__PURE__*/ createHtmlFactory("sub");
export const Summary = /*#__PURE__*/ createHtmlFactory("summary");
export const Sup = /*#__PURE__*/ createHtmlFactory("sup");
export const Table = /*#__PURE__*/ createHtmlFactory("table");
export const Tbody = /*#__PURE__*/ createHtmlFactory("tbody");
export const Td = /*#__PURE__*/ createHtmlFactory("td");
export const Template = /*#__PURE__*/ createHtmlFactory("template");
export const Textarea = /*#__PURE__*/ createHtmlFactory("textarea");
export const Tfoot = /*#__PURE__*/ createHtmlFactory("tfoot");
export const Th = /*#__PURE__*/ createHtmlFactory("th");
export const Thead = /*#__PURE__*/ createHtmlFactory("thead");
export const Time = /*#__PURE__*/ createHtmlFactory("time");
export const Title = /*#__PURE__*/ createHtmlFactory("title");
export const Tr = /*#__PURE__*/ createHtmlFactory("tr");
export const Track = /*#__PURE__*/ createHtmlFactory("track");
export const U = /*#__PURE__*/ createHtmlFactory("u");
export const Ul = /*#__PURE__*/ createHtmlFactory("ul");
export const Var = /*#__PURE__*/ createHtmlFactory("var");
export const Video = /*#__PURE__*/ createHtmlFactory("video");
export const Wbr = /*#__PURE__*/ createHtmlFactory("wbr");

export const Fragment = (...children: readonly ChildValue[]) =>
	createFragment(...children);
export function Text(value: ChildValue): Text {
	return document.createTextNode(String(value));
}

import { createElementFactory, type ChildValue } from "../core/factories.ts";

function createSvgFactory(tagName: string) {
	return (...children: readonly ChildValue[]) =>
		createElementFactory(tagName, { namespace: "svg" })(...children);
}

export const A = /*#__PURE__*/ createSvgFactory("a");
export const Animate = /*#__PURE__*/ createSvgFactory("animate");
export const AnimateMotion = /*#__PURE__*/ createSvgFactory("animateMotion");
export const AnimateTransform =
	/*#__PURE__*/ createSvgFactory("animateTransform");
export const Circle = /*#__PURE__*/ createSvgFactory("circle");
export const ClipPath = /*#__PURE__*/ createSvgFactory("clipPath");
export const Defs = /*#__PURE__*/ createSvgFactory("defs");
export const Desc = /*#__PURE__*/ createSvgFactory("desc");
export const Ellipse = /*#__PURE__*/ createSvgFactory("ellipse");
export const FeBlend = /*#__PURE__*/ createSvgFactory("feBlend");
export const FeColorMatrix = /*#__PURE__*/ createSvgFactory("feColorMatrix");
export const FeComponentTransfer = /*#__PURE__*/ createSvgFactory(
	"feComponentTransfer",
);
export const FeComposite = /*#__PURE__*/ createSvgFactory("feComposite");
export const FeConvolveMatrix =
	/*#__PURE__*/ createSvgFactory("feConvolveMatrix");
export const FeDiffuseLighting =
	/*#__PURE__*/ createSvgFactory("feDiffuseLighting");
export const FeDisplacementMap =
	/*#__PURE__*/ createSvgFactory("feDisplacementMap");
export const FeDistantLight = /*#__PURE__*/ createSvgFactory("feDistantLight");
export const FeDropShadow = /*#__PURE__*/ createSvgFactory("feDropShadow");
export const FeFlood = /*#__PURE__*/ createSvgFactory("feFlood");
export const FeFuncA = /*#__PURE__*/ createSvgFactory("feFuncA");
export const FeFuncB = /*#__PURE__*/ createSvgFactory("feFuncB");
export const FeFuncG = /*#__PURE__*/ createSvgFactory("feFuncG");
export const FeFuncR = /*#__PURE__*/ createSvgFactory("feFuncR");
export const FeGaussianBlur = /*#__PURE__*/ createSvgFactory("feGaussianBlur");
export const FeImage = /*#__PURE__*/ createSvgFactory("feImage");
export const FeMerge = /*#__PURE__*/ createSvgFactory("feMerge");
export const FeMergeNode = /*#__PURE__*/ createSvgFactory("feMergeNode");
export const FeMorphology = /*#__PURE__*/ createSvgFactory("feMorphology");
export const FeOffset = /*#__PURE__*/ createSvgFactory("feOffset");
export const FePointLight = /*#__PURE__*/ createSvgFactory("fePointLight");
export const FeSpecularLighting =
	/*#__PURE__*/ createSvgFactory("feSpecularLighting");
export const FeSpotLight = /*#__PURE__*/ createSvgFactory("feSpotLight");
export const FeTile = /*#__PURE__*/ createSvgFactory("feTile");
export const FeTurbulence = /*#__PURE__*/ createSvgFactory("feTurbulence");
export const Filter = /*#__PURE__*/ createSvgFactory("filter");
export const ForeignObject = /*#__PURE__*/ createSvgFactory("foreignObject");
export const G = /*#__PURE__*/ createSvgFactory("g");
export const Image = /*#__PURE__*/ createSvgFactory("image");
export const Line = /*#__PURE__*/ createSvgFactory("line");
export const LinearGradient = /*#__PURE__*/ createSvgFactory("linearGradient");
export const Marker = /*#__PURE__*/ createSvgFactory("marker");
export const Mask = /*#__PURE__*/ createSvgFactory("mask");
export const Metadata = /*#__PURE__*/ createSvgFactory("metadata");
export const Mpath = /*#__PURE__*/ createSvgFactory("mpath");
export const Path = /*#__PURE__*/ createSvgFactory("path");
export const Pattern = /*#__PURE__*/ createSvgFactory("pattern");
export const Polygon = /*#__PURE__*/ createSvgFactory("polygon");
export const Polyline = /*#__PURE__*/ createSvgFactory("polyline");
export const RadialGradient = /*#__PURE__*/ createSvgFactory("radialGradient");
export const Rect = /*#__PURE__*/ createSvgFactory("rect");
export const Script = /*#__PURE__*/ createSvgFactory("script");
export const Set = /*#__PURE__*/ createSvgFactory("set");
export const Stop = /*#__PURE__*/ createSvgFactory("stop");
export const Style = /*#__PURE__*/ createSvgFactory("style");
export const Svg = /*#__PURE__*/ createSvgFactory("svg");
export const Switch = /*#__PURE__*/ createSvgFactory("switch");
export const Symbol = /*#__PURE__*/ createSvgFactory("symbol");
export const Text = /*#__PURE__*/ createSvgFactory("text");
export const TextPath = /*#__PURE__*/ createSvgFactory("textPath");
export const Title = /*#__PURE__*/ createSvgFactory("title");
export const Tspan = /*#__PURE__*/ createSvgFactory("tspan");
export const Use = /*#__PURE__*/ createSvgFactory("use");
export const View = /*#__PURE__*/ createSvgFactory("view");

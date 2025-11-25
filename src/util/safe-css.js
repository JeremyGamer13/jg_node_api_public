const safeProperties = [
    // Layout & Positioning
    "position", "top", "right", "bottom", "left",
    "display", "visibility", "overflow", "overflowX", "overflowY",
    "width", "height", "minWidth", "minHeight", "maxWidth", "maxHeight",
    "boxSizing", "float", "clear",
    "objectFit", "objectPosition",

    // Margin & Padding (The Box Model)
    "margin", "marginTop", "marginRight", "marginBottom", "marginLeft",
    "padding", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft",

    // Typography & Text
    "color", "fontSize", "fontWeight", "fontStyle", "lineHeight", "textAlign",
    "textDecoration", "textIndent", "textTransform", "letterSpacing", "wordSpacing",
    "whiteSpace", "fontFamily",

    // Borders & Background
    "backgroundColor", "border", "borderTop", "borderRight", "borderBottom", "borderLeft",
    "borderColor", "borderStyle", "borderWidth", "borderRadius",

    // Flexbox & Grid
    "flex", "flexGrow", "flexShrink", "flexBasis", "flexDirection",
    "flexWrap", "justifyContent", "alignItems", "alignContent", "alignSelf",
    "gap", "rowGap", "columnGap",
    "gridTemplateColumns", "gridTemplateRows", "gridColumn", "gridRow",
    "gridAutoColumns", "gridAutoRows", "gridAutoFlow",

    // Effects & Transforms
    "transform", "transformOrigin", "transition", "transitionProperty", "transitionDuration",
    "transitionTimingFunction", "transitionDelay", "perspective", "perspectiveOrigin",
    "boxShadow", "opacity",

    // TRUST WITH LIMITS
    "zIndex", // should be limited to 0-99999
    "filter", // should be checked for `url()`
];
const filterProperties = (styles) => {
    const newStyles = {};

    for (const key in styles) {
        const value = styles[key];
        if (!safeProperties.includes(key)) continue;

        newStyles[key] = String(value);
        if (key === "zIndex") {
            newStyles.zIndex = isNaN(value) ? 0 : Math.min(Math.max(0, Number(value || 0)), 99999);
        }
        if (key === "filter" && /url\s*\(/i.test(String(value))) {
            newStyles.filter = "";
        }
    }

    return newStyles;
};

module.exports = {
    safeProperties,
    filterProperties,
};
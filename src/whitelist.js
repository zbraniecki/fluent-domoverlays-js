const TEXT_LEVEL_ELEMENTS = [
    "em", "strong", "small", "s", "cite", "q", "dfn", "abbr", "data",
    "time", "code", "var", "samp", "kbd", "sub", "sup", "i", "b", "u",
    "mark", "bdi", "bdo", "span", "br", "wbr"
];

const LOCALIZABLE_ATTRIBUTES = {
  global: ["title", "aria-label", "aria-valuetext", "aria-moz-hint"],
  a: ["download"],
  area: ["download", "alt"],
  // value is special-cased in isAttrNameLocalizable
  input: ["alt", "placeholder"],
  menuitem: ["label"],
  menu: ["label"],
  optgroup: ["label"],
  option: ["label"],
  track: ["label"],
  img: ["alt"],
  textarea: ["placeholder"],
  th: ["abbr"],
};

exports.TEXT_LEVEL_ELEMENTS = TEXT_LEVEL_ELEMENTS;
exports.LOCALIZABLE_ATTRIBUTES = LOCALIZABLE_ATTRIBUTES;

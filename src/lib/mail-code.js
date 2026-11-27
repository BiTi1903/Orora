import parse5 from "parse5";

import { MAIL_CODE_LIMIT } from "./mail-design.js";
const tags = new Set("div span p h1 h2 h3 h4 strong b em i u s small br hr a img ul ol li blockquote table thead tbody tfoot tr td th".split(" "));
const voidTags = new Set(["br", "hr", "img"]);
const properties = /^(?:color|background-color|font-(?:size|family|weight|style)|letter-spacing|line-height|text-(?:align|decoration)|vertical-align|width|max-width|height|border(?:-(?:radius|collapse|width|color|style|top|bottom|left|right))?|(?:padding|margin)(?:-(?:top|bottom|left|right))?)$/;

function escape(value) {
  return value.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
}

function attribute(tag, name, value) {
  if (name === "style") return value.split(";").filter(rule => {
    const [property, val, extra] = rule.split(":");
    return extra === undefined && properties.test(property.trim().toLowerCase()) && /^[\w\s#.,%'"-]+$/.test(val || "");
  }).join(";");
  if ((name === "href" && tag === "a") || (name === "src" && tag === "img")) {
    try {
      const url = new URL(value);
      return url.protocol === "https:" || (name === "href" && url.protocol === "mailto:") ? url.href : "";
    } catch { return ""; }
  }
  if (name === "alt" && tag === "img") return value;
  if (/^(width|height|border|cellpadding|cellspacing|colspan|rowspan)$/.test(name) && /^\d{1,4}%?$/.test(value)) return value;
  if (name === "align" && /^(left|center|right)$/.test(value)) return value;
  return "";
}

export function renderMailCode(source, content) {
  let inserted = false;
  function render(node, depth) {
    if (node.nodeName === "#text") return escape(node.value).replaceAll("{{content}}", () => {
      if (inserted) return "";
      inserted = true;
      return content;
    });
    const tag = node.tagName;
    if (depth > 80 || !tags.has(tag) || node.namespaceURI !== "http://www.w3.org/1999/xhtml") return "";
    const attrs = node.attrs.map(({name, value}) => {
      const safe = attribute(tag, name, value);
      return safe ? ` ${name}="${escape(safe)}"` : "";
    }).join("");
    const open = `<${tag}${attrs}>`;
    return voidTags.has(tag) ? open : open + node.childNodes.map(child => render(child, depth + 1)).join("") + `</${tag}>`;
  }
  return parse5.parseFragment(source.slice(0, MAIL_CODE_LIMIT)).childNodes.map(node => render(node, 0)).join("");
}

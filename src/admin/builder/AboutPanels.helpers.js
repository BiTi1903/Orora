import { DEFAULT_ABOUT, DEFAULT_STYLE } from "./registry";

export function getSelectedData(about, selected) {
  if (selected === "section") {
    return {
      type: "section",
      data: about.section,
    };
  }

  if (selected === "image") {
    return {
      type: "image",
      data: about.image,
    };
  }

  if (selected === "stats") {
    return {
      type: "stats",
      data: Array.isArray(about.stats) ? about.stats : DEFAULT_ABOUT.stats,
    };
  }

  if (
    typeof selected === "string" &&
    (selected.startsWith("statValue:") || selected.startsWith("statLabel:"))
  ) {
    const [kind, indexRaw] = selected.split(":");
    const index = Number(indexRaw);
    const item = (Array.isArray(about.stats) ? about.stats : [])[index] || {};
    const base = kind === "statValue"
      ? about.statValue || DEFAULT_ABOUT.statValue
      : about.statLabel || DEFAULT_ABOUT.statLabel;
    return {
      type: "statText",
      data: {
        kind,
        index,
        text: kind === "statValue" ? item.value ?? "" : item.label ?? "",
        suffix: item.suffix || "",
        style: { ...(base || {}) },
      },
    };
  }

  const block = about[selected];
  if (!block || typeof block !== "object") {
    return {
      type: "text",
      data: { text: "", style: { ...DEFAULT_STYLE } },
    };
  }

  return {
    type: "text",
    data: {
      text: block.text || "",
      style: block.style || { ...DEFAULT_STYLE },
    },
  };
}

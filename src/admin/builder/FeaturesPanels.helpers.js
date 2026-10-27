import { FEATURES_TEXT_MAP } from "./registry";

export function getFeaturesSelectedData(features, selected) {
  if (selected?.startsWith("featCard-")) {
    const index = Number(selected.replace("featCard-", ""));
    return {
      type: "featCard",
      data: features,
      meta: { index, label: `Ô ${index + 1}` },
    };
  }
  const meta = FEATURES_TEXT_MAP[selected];
  if (!meta) return { type: "featEmpty", data: null };
  return { type: "featText", data: features, meta };
}

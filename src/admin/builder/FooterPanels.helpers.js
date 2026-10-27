import { FOOTER_FIELD_MAP } from "./registry";

export function getFooterSelectedData(footer, selected) {
  const meta = FOOTER_FIELD_MAP[selected];
  if (!meta) return { type: "ftEmpty", data: null };
  return { type: "ftText", data: footer, meta };
}

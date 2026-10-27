import { NEWSLETTER_FIELD_MAP } from "./registry";

export function getNewsletterSelectedData(newsletter, selected) {
  const meta = NEWSLETTER_FIELD_MAP[selected];
  if (!meta) return { type: "nlEmpty", data: null };
  return { type: "nlField", data: newsletter, meta };
}

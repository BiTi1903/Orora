import { HERO_FIELD_MAP } from "./registry";

export function getHeroSelectedData(hero, selected) {
  const meta = HERO_FIELD_MAP[selected];
  if (!meta) {
    return { type: "heroEmpty", data: null };
  }
  return { type: meta.type, data: hero, meta };
}

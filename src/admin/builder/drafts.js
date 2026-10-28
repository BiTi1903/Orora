const SECTIONS = ["about", "hero", "collection", "productDetail", "features", "reviews", "newsletter", "footer", "ticker", "navbar", "philosophy"];
export const builderDraftKey = (uid = "local") => `orora:builder-draft:v1:${uid}`;
export function saveBuilderDraft(storage, key, sections) {
  const draft = { version: 1, savedAt: new Date().toISOString(), sections: Object.fromEntries(SECTIONS.map((name) => [name, sections[name]])) };
  storage.setItem(key, JSON.stringify(draft));
  return draft;
}
export function readBuilderDraft(storage, key) {
  const raw = storage.getItem(key);
  if (!raw) return null;
  const draft = JSON.parse(raw);
  if (draft.version !== 1 || !SECTIONS.every((name) => draft.sections?.[name] && typeof draft.sections[name] === "object" && !Array.isArray(draft.sections[name]))) {
    throw new Error("Bản nháp không hợp lệ.");
  }
  return draft;
}

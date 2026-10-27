import { COLLECTION_FIELD_MAP } from "./registry";

export function getCollectionSelectedData(collection, selected) {
  const meta = COLLECTION_FIELD_MAP[selected];
  if (!meta) {
    return { type: "colEmpty", data: null };
  }
  return { type: meta.type, data: collection, meta };
}

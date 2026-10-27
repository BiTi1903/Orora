import { REVIEWS_TEXT_MAP } from "./registry";

export function getReviewsSelectedData(reviews, selected) {
  if (selected?.startsWith("revCard-")) {
    const index = Number(selected.replace("revCard-", ""));
    return {
      type: "revCard",
      data: reviews,
      meta: { index, label: `Đánh giá ${index + 1}` },
    };
  }
  const meta = REVIEWS_TEXT_MAP[selected];
  if (!meta) return { type: "revEmpty", data: null };
  return { type: "revText", data: reviews, meta };
}

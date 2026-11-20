export const ORDER_STATUSES = ["new", "confirmed", "shipping", "completed", "cancelled"];

export const NEXT_ORDER_STATUSES = {
  new: ["confirmed", "shipping", "cancelled"],
  confirmed: ["shipping", "completed", "cancelled"],
  shipping: ["completed", "cancelled"],
  completed: ["cancelled"],
  cancelled: [],
};

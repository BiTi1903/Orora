import { createContext, useContext } from "react";

export const ConfirmContext = createContext(() => {
  if (import.meta.env.DEV) console.warn("useConfirm: missing ConfirmProvider. The action was cancelled.");
  return Promise.resolve(false);
});

export function useConfirm() {
  return useContext(ConfirmContext);
}

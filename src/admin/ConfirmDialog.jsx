import { useEffect, useRef, useState } from "react";
import ModalDialog from "../components/ModalDialog";
import { ConfirmContext } from "./confirm-context";

export default function ConfirmProvider({ children }) {
  const [request, setRequest] = useState(null);
  const cancelRef = useRef(null);
  const pending = useRef(null);

  useEffect(() => () => {
    pending.current?.(false);
    pending.current = null;
  }, []);

  function confirm(text, { title = "Xác nhận thao tác", confirmLabel = "Xác nhận", danger = false } = {}) {
    if (pending.current) return Promise.resolve(false);
    return new Promise((resolve) => {
      pending.current = resolve;
      setRequest({ text, title, confirmLabel, danger });
    });
  }

  function finish(accepted) {
    const resolve = pending.current;
    if (!resolve) return;
    pending.current = null;
    setRequest(null);
    resolve(accepted);
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {request !== null && (
        <ModalDialog title={request.title} initialFocusRef={request.danger ? cancelRef : undefined} className="admin-mail-dialog admin-confirm-dialog" onClose={() => finish(false)}>
          <p className="admin-confirm-message">{request.text}</p>
          <div className="admin-actions">
            <button ref={cancelRef} type="button" className="admin-btn" onClick={() => finish(false)}>Hủy</button>
            <button type="button" className={`admin-btn ${request.danger ? "danger" : "primary"}`} onClick={() => finish(true)}>{request.confirmLabel}</button>
          </div>
        </ModalDialog>
      )}
    </ConfirmContext.Provider>
  );
}

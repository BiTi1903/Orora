import { useEffect, useRef, useState } from "react";
import ModalDialog from "../components/ModalDialog";
import { ConfirmContext } from "./confirm-context";

export default function ConfirmProvider({ children }) {
  const [message, setMessage] = useState(null);
  const pending = useRef(null);

  useEffect(() => () => {
    pending.current?.(false);
    pending.current = null;
  }, []);

  function confirm(text) {
    if (pending.current) return Promise.resolve(false);
    return new Promise((resolve) => {
      pending.current = resolve;
      setMessage(text);
    });
  }

  function finish(accepted) {
    const resolve = pending.current;
    if (!resolve) return;
    pending.current = null;
    setMessage(null);
    resolve(accepted);
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {message !== null && (
        <ModalDialog title="Xác nhận thao tác" className="admin-mail-dialog admin-confirm-dialog" onClose={() => finish(false)}>
          <p className="admin-confirm-message">{message}</p>
          <div className="admin-actions">
            <button type="button" className="admin-btn" onClick={() => finish(false)}>Hủy</button>
            <button type="button" className="admin-btn primary" onClick={() => finish(true)}>Xác nhận</button>
          </div>
        </ModalDialog>
      )}
    </ConfirmContext.Provider>
  );
}

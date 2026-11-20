import { useCallback, useState } from "react";
import ModalDialog from "./ModalDialog";

export default function ConsultationDialog({ children, onClose, source }) {
  const [closing, setClosing] = useState(false);
  const requestClose = useCallback(() => {
    if (!source || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onClose?.();
    } else {
      setClosing(true);
    }
  }, [source, onClose]);

  return (
    <ModalDialog
      title="Tư vấn cùng ORORA"
      closeLabel="Đóng tư vấn"
      className="product-consultation-dialog"
      motionSource={source}
      motionClosing={closing}
      onMotionClosed={onClose}
      onClose={requestClose}
    >
      <p className="consultation-dialog-lead">Bạn muốn được hỗ trợ qua hình thức nào?</p>
      <div className="product-consultation-options" aria-label="Chọn hình thức tư vấn">{children}</div>
    </ModalDialog>
  );
}

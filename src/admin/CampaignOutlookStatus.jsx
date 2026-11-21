import { useEffect, useState } from "react";
import MailPreviewDialog from "./MailPreviewDialog";
import OutlookCheck from "./OutlookCheck";
import { MAIL_STATES } from "./order-api";

export default function CampaignOutlookStatus({ campaign, request, onClose }) {
  const [deliveries, setDeliveries] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [error, setError] = useState("");
  const [scanNotice, setScanNotice] = useState(null);
  const [busy, setBusy] = useState(true);
  const [checkingAll, setCheckingAll] = useState(false);

  useEffect(() => {
    let alive = true;
    request({ action: "campaignDeliveryStatuses", id: campaign.id })
      .then((data) => {
        if (alive) {
          setDeliveries(data.deliveries);
          setCursor(data.nextCursor);
        }
      })
      .catch((cause) => {
        if (alive) setError(cause.message);
      })
      .finally(() => {
        if (alive) setBusy(false);
      });
    return () => { alive = false; };
  }, [campaign.id, request]);

  const checkAll = async () => {
    if (checkingAll || busy) return;
    setCheckingAll(true);
    setScanNotice(null);
    setError("");
    try {
      const result = await request({ action: "checkCampaignBatchOutlook", id: campaign.id, limit: 30 });
      if (result.results) {
        setDeliveries((items) => items.map((item) => (result.results[item.id] ? { ...item, outlook: result.results[item.id] } : item)));
      }
      setScanNotice({ error: (result.bouncedCount || 0) > 0, text: result.message });
    } catch (cause) {
      setScanNotice({ error: true, text: cause.message });
    } finally {
      setCheckingAll(false);
    }
  };

  return (
    <MailPreviewDialog
      title="Kiểm tra trạng thái thư theo người nhận"
      onClose={onClose}
      metadata={
        <>
          <div className="admin-top" style={{ marginBottom: 8 }}>
            <h3>{campaign.subject}</h3>
            {deliveries.length > 0 && (
              <button type="button" className="admin-btn primary" aria-busy={checkingAll} disabled={busy || checkingAll} onClick={checkAll}>
                {checkingAll ? "Đang kiểm tra…" : "Kiểm tra toàn bộ"}
              </button>
            )}
          </div>
          <p className="admin-muted">“Đã gửi đi” chưa chứng minh thư đã vào hộp thư đến. Địa chỉ bị trả lại sẽ tự chuyển sang trạng thái Bị trả lại để không gửi lặp.</p>
          {scanNotice && <p role="status" className={scanNotice.error ? "admin-error" : "admin-success"}>{scanNotice.text}</p>}
          {error && <p className="admin-error" role="alert">{error}</p>}
          {busy && <p>Đang tải bản ghi gửi…</p>}
          <div className="outlook-delivery-list">
            {deliveries.map((item) => (
              <div className="order-mail-event" key={item.id}>
                <strong>{item.email}</strong>
                <p>{MAIL_STATES[item.status] || item.status}</p>
                {item.errorMessage && <p className="admin-error">{item.errorMessage}</p>}
                <OutlookCheck outlook={item.outlook} label={item.email} check={() => request({ action: "checkCampaignOutlook", id: campaign.id, deliveryId: item.id })} />
              </div>
            ))}
          </div>
          {!busy && !deliveries.length && <p>Chưa có bản ghi gửi đến người nhận.</p>}
          {cursor && (
            <button
              type="button"
              className="admin-btn"
              aria-busy={busy}
              disabled={busy || checkingAll}
              onClick={async () => {
                setBusy(true);
                try {
                  const data = await request({ action: "campaignDeliveryStatuses", id: campaign.id, cursor });
                  setDeliveries((items) => [...new Map([...items, ...data.deliveries].map((item) => [item.id, item])).values()]);
                  setCursor(data.nextCursor);
                } catch (cause) {
                  setError(cause.message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              Tải thêm người nhận
            </button>
          )}
        </>
      }
    />
  );
}

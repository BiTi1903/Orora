import { useCallback, useEffect, useRef, useState } from "react";
import { orderRequest } from "./order-api";

export default function useOrderNotifications(enabled = true) {
  const [snapshot, setSnapshot] = useState(null);
  const [incoming, setIncoming] = useState(null);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const refreshRef = useRef(null);
  useEffect(() => {
    if (!enabled) return;
    let alive = true; let timer; let controller; let active = false; let queued = false;
    let terminal = false; let baseline = false; let previous = null; let lastStarted = -Infinity;
    const schedule = () => {
      window.clearTimeout(timer);
      if (alive && !terminal && !document.hidden) timer = window.setTimeout(() => check(), 60_000);
    };
    async function check(force = false) {
      if (!alive || document.hidden || terminal) return;
      if (active) { if (force) queued = true; return; }
      if (!force && Date.now() - lastStarted < 15_000) { schedule(); return; }
      active = true; lastStarted = Date.now(); window.clearTimeout(timer);
      controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 15_000);
      try {
        const data = await orderRequest(null, { summary: "1" }, { signal: controller.signal });
        if (!alive) return;
        if (!Number.isSafeInteger(data.pendingCount) || data.pendingCount < 0) throw new Error("Chưa đọc được số đơn chờ xác nhận.");
        const latest = data.latestOrder;
        if (baseline && latest?.status === "new" && latest.id !== previous?.id && (!previous || latest.createdAt >= previous.createdAt)) {
          setIncoming(latest); setRevision((value) => value + 1);
        }
        baseline = true; previous = latest;
        setSnapshot(data); setError("");
      } catch (cause) {
        if (alive) {
          terminal = [401, 403].includes(cause.status);
          if (terminal) { setSnapshot(null); setIncoming(null); }
          setError(cause.name === "AbortError" ? "Cập nhật đơn hàng quá thời gian chờ." : cause.message);
        }
      } finally {
        window.clearTimeout(timeout); active = false;
        if (alive && queued) { queued = false; check(true); } else schedule();
      }
    }
    const onFocus = () => check();
    const onVisibility = () => { if (document.hidden) window.clearTimeout(timer); else check(); };
    refreshRef.current = () => check(true);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    check();
    return () => {
      alive = false; refreshRef.current = null; window.clearTimeout(timer); controller?.abort();
      window.removeEventListener("focus", onFocus); document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled]);
  const refresh = useCallback(() => refreshRef.current?.(), []);
  const dismiss = useCallback(() => setIncoming(null), []);
  return { snapshot, incoming, error, revision, refresh, dismiss };
}

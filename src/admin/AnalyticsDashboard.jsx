import { validAnalyticsReport } from "../lib/analytics";
import { useEffect, useId, useState } from "react";
import { auth } from "../lib/firebaseAuth";
import { formatVnd } from "../lib/commerce";

const PRESETS = [
  { days: 7, label: "7 ngày" },
  { days: 14, label: "14 ngày" },
  { days: 30, label: "30 ngày" },
  { days: 90, label: "90 ngày" },
];

const TRAFFIC_FIELDS = [
  { key: "pageViews", label: "Lượt xem", color: "#b8446d" },
  { key: "visitors", label: "Khách/ngày", color: "#4f7cac" },
  { key: "productClicks", label: "Bấm sản phẩm", color: "#d4832a" },
];

const shortDay = (day) => `${day.slice(8)}/${day.slice(5, 7)}`;
const fullDay = (day) => day.split("-").reverse().join("/");
const compact = (n) =>
  new Intl.NumberFormat("vi-VN", { notation: "compact", maximumFractionDigits: 1 }).format(n);

function niceCeiling(peak, money = false) {
  const floor = money ? 100000 : 4;
  if (!Number.isFinite(peak) || peak <= 0) return floor;
  const target = Math.max(peak, floor);
  const exp = Math.pow(10, Math.floor(Math.log10(target)));
  const fraction = target / exp;
  let nice = 10;
  if (fraction <= 1) nice = 1;
  else if (fraction <= 1.5) nice = 1.5;
  else if (fraction <= 2) nice = 2;
  else if (fraction <= 2.5) nice = 2.5;
  else if (fraction <= 4) nice = 4;
  else if (fraction <= 5) nice = 5;
  else if (fraction <= 8) nice = 8;
  return Math.ceil(nice * exp);
}

function csvSafeCell(value) {
  const text = String(value ?? "");
  const guarded = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${guarded.replace(/"/g, '""')}"`;
}

function RevenueBarChart({ series }) {
  const [activeIndex, setActiveIndex] = useState(-1);
  const tooltipId = useId();
  const barGradId = useId();
  const hasRevenue = series.some((day) => (day.paidAmount || 0) > 0 || (day.paidOrders || 0) > 0);
  const peak = Math.max(0, ...series.map((day) => day.paidAmount || 0));
  const totalRevenue = series.reduce((sum, day) => sum + (day.paidAmount || 0), 0);
  const max = niceCeiling(peak, true);
  const padLeft = 58;
  const padRight = 18;
  const plotTop = 24;
  const plotBottom = 192;
  const plotHeight = plotBottom - plotTop;
  const plotWidth = series.length > 30 ? Math.max(600, padLeft + padRight + series.length * 18) : 600;
  const innerWidth = plotWidth - padLeft - padRight;
  const step = innerWidth / Math.max(1, series.length);
  const barWidth = Math.max(6, Math.min(30, step * 0.58));
  const xCenter = (i) => padLeft + step * i + step / 2;
  const y = (val) => plotBottom - (Math.max(0, val) / max) * plotHeight;
  const active = activeIndex >= 0 ? series[activeIndex] : null;
  const labelEvery = Math.max(1, Math.ceil(series.length / Math.max(2, Math.floor(innerWidth / 64))));

  return (
    <div className="admin-card analytics-chart-card">
      <div className="analytics-card-head">
        <div>
          <h3>Doanh thu đã thanh toán theo ngày</h3>
          <p className="analytics-card-sub">
            Tổng kỳ: <strong>{formatVnd(totalRevenue)}</strong>
            {peak > 0 ? ` · Ngày cao nhất: ${formatVnd(peak)}` : ""}
          </p>
        </div>
        <div className="analytics-legend">
          <span>
            <i style={{ background: "#b8446d" }} />
            Doanh thu (đ)
          </span>
        </div>
      </div>

      {!hasRevenue ? (
        <div className="analytics-empty">
          Chưa có đơn hàng đã thanh toán trong khoảng thời gian này.
        </div>
      ) : (
        <div className="analytics-chart-scroll" tabIndex="0" role="region" aria-label="Biểu đồ doanh thu theo ngày">
          <div
            className="analytics-plot"
            style={{ width: series.length > 30 ? `max(100%, ${plotWidth}px)` : "100%" }}
            onMouseLeave={() => setActiveIndex(-1)}
            onKeyDown={(event) => {
              if (event.key === "Escape") setActiveIndex(-1);
            }}
          >
            <svg
              className="analytics-chart"
              viewBox={`0 0 ${plotWidth} 230`}
              role="group"
              aria-label="Biểu đồ cột doanh thu đã thanh toán theo ngày"
            >
              <defs>
                <linearGradient id={barGradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#b8446d" />
                  <stop offset="100%" stopColor="#e07a9f" />
                </linearGradient>
              </defs>
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const tickVal = Math.round(max * ratio);
                const yPos = y(tickVal);
                return (
                  <g key={ratio}>
                    <line
                      x1={padLeft}
                      x2={plotWidth - padRight}
                      y1={yPos}
                      y2={yPos}
                      stroke={ratio === 0 ? "#dfc9d4" : "#f2e7ec"}
                      strokeDasharray={ratio === 0 ? undefined : "4 4"}
                    />
                    <text x={padLeft - 8} y={yPos + 4} textAnchor="end">
                      {compact(tickVal)}
                    </text>
                  </g>
                );
              })}

              {series.map((day, i) => {
                const val = day.paidAmount || 0;
                const cx = xCenter(i);
                const barH = val > 0 ? Math.max(4, plotBottom - y(val)) : 0;
                const isActive = activeIndex === i;
                return (
                  <g key={day.day}>
                    {isActive && (
                      <rect
                        x={cx - step / 2}
                        y={plotTop}
                        width={step}
                        height={plotHeight}
                        fill="#b8446d"
                        fillOpacity="0.06"
                        rx="4"
                        pointerEvents="none"
                      />
                    )}
                    {barH > 0 ? (
                      <rect
                        x={cx - barWidth / 2}
                        y={plotBottom - barH}
                        width={barWidth}
                        height={barH}
                        rx={Math.min(6, barWidth / 2)}
                        fill={isActive ? "#8f2c52" : `url(#${barGradId})`}
                        pointerEvents="none"
                      />
                    ) : (
                      <line
                        x1={cx - Math.min(6, barWidth / 2)}
                        x2={cx + Math.min(6, barWidth / 2)}
                        y1={plotBottom - 1}
                        y2={plotBottom - 1}
                        stroke="#e3cfd8"
                        strokeWidth="2"
                        strokeLinecap="round"
                        pointerEvents="none"
                      />
                    )}
                    <rect
                      className="analytics-point-target"
                      x={cx - step / 2}
                      y={plotTop}
                      width={step}
                      height={plotHeight + 24}
                      fill="transparent"
                      tabIndex="0"
                      role="button"
                      aria-describedby={isActive ? tooltipId : undefined}
                      aria-label={`${fullDay(day.day)}: ${formatVnd(val)}, ${day.paidOrders || 0} đơn`}
                      onMouseEnter={() => setActiveIndex(i)}
                      onFocus={() => setActiveIndex(i)}
                      onBlur={() => setActiveIndex(-1)}
                      onClick={() => setActiveIndex(i)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setActiveIndex(i);
                        }
                      }}
                    />
                  </g>
                );
              })}

              {series.map((day, i) => {
                const show = i === 0 || i === series.length - 1 || i % labelEvery === 0;
                if (!show && activeIndex !== i) return null;
                const cx = xCenter(i);
                if (activeIndex === i) {
                  return (
                    <g key={`lbl-${day.day}`} pointerEvents="none">
                      <rect x={cx - 26} y="200" width="52" height="22" rx="6" fill="#b8446d" />
                      <text className="analytics-crosshair-label" x={cx} y="215" textAnchor="middle">
                        {shortDay(day.day)}
                      </text>
                    </g>
                  );
                }
                return (
                  <text key={`lbl-${day.day}`} x={cx} y="216" textAnchor="middle">
                    {shortDay(day.day)}
                  </text>
                );
              })}
            </svg>

            {active && (
              <div
                id={tooltipId}
                className="analytics-tooltip"
                role="tooltip"
                style={{ left: `clamp(112px, ${(xCenter(activeIndex) / plotWidth) * 100}%, calc(100% - 112px))` }}
              >
                <strong>{fullDay(active.day)}</strong>
                <span>
                  <i style={{ background: "#b8446d" }} />
                  Doanh thu
                  <b>{formatVnd(active.paidAmount || 0)}</b>
                </span>
                <span>
                  <i style={{ background: "#6e4e5c" }} />
                  Đơn thanh toán
                  <b>{(active.paidOrders || 0).toLocaleString("vi-VN")}</b>
                </span>
                {(active.paidOrders || 0) > 0 && (
                  <span>
                    <i style={{ background: "#d4832a" }} />
                    TB / đơn
                    <b>{formatVnd(Math.round((active.paidAmount || 0) / active.paidOrders))}</b>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TrafficLineChart({ series }) {
  const [visibleKeys, setVisibleKeys] = useState(() => TRAFFIC_FIELDS.map((f) => f.key));
  const [activeIndex, setActiveIndex] = useState(-1);
  const tooltipId = useId();
  const gradientId = useId();

  const activeFields = TRAFFIC_FIELDS.filter((field) => visibleKeys.includes(field.key));
  const hasTraffic = series.some((day) => activeFields.some((field) => Number.isFinite(day[field.key])));

  const toggleField = (key) => {
    setVisibleKeys((current) => {
      if (current.includes(key)) {
        return current.length > 1 ? current.filter((item) => item !== key) : current;
      }
      return [...current, key];
    });
  };

  const peak = Math.max(
    0,
    ...series.flatMap((day) => activeFields.map((field) => (Number.isFinite(day[field.key]) ? day[field.key] : 0))),
  );
  const max = niceCeiling(peak, false);
  const padLeft = 48;
  const padRight = 20;
  const plotTop = 24;
  const plotBottom = 192;
  const plotHeight = plotBottom - plotTop;
  const plotWidth = series.length > 30 ? Math.max(600, padLeft + padRight + (series.length - 1) * 20) : 600;
  const innerWidth = plotWidth - padLeft - padRight;
  const x = (i) =>
    series.length <= 1 ? padLeft + innerWidth / 2 : padLeft + (i / (series.length - 1)) * innerWidth;
  const y = (val) => plotBottom - (Math.max(0, val) / max) * plotHeight;
  const active = activeIndex >= 0 ? series[activeIndex] : null;
  const labelEvery = Math.max(1, Math.ceil(series.length / Math.max(2, Math.floor(innerWidth / 70))));

  const primaryField = activeFields[0];
  const primarySegments = primaryField
    ? series
        .reduce((segments, day, i) => {
          if (!Number.isFinite(day[primaryField.key])) {
            if (segments.at(-1)?.length) segments.push([]);
            return segments;
          }
          if (!segments.length) segments.push([]);
          segments.at(-1).push({ x: x(i), y: y(day[primaryField.key]) });
          return segments;
        }, [])
        .filter((segment) => segment.length > 1)
    : [];

  const inspect = (event) => {
    const svg = event.currentTarget;
    const matrix = svg.getScreenCTM();
    if (!matrix) return;
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    if (point.x < padLeft - 8 || point.x > plotWidth - padRight + 8 || point.y < plotTop || point.y > plotBottom) {
      setActiveIndex(-1);
      return;
    }
    const idx =
      series.length <= 1
        ? 0
        : Math.max(
            0,
            Math.min(series.length - 1, Math.round(((point.x - padLeft) / innerWidth) * (series.length - 1))),
          );
    setActiveIndex(idx);
  };

  return (
    <div className="admin-card analytics-chart-card">
      <div className="analytics-card-head">
        <div>
          <h3>Lượt truy cập &amp; tương tác sản phẩm</h3>
          <p className="analytics-card-sub">Bấm vào nhãn bên phải để bật/tắt từng đường dữ liệu</p>
        </div>
        <div className="analytics-legend" role="group" aria-label="Bật tắt đường dữ liệu truy cập">
          {TRAFFIC_FIELDS.map((field) => {
            const on = visibleKeys.includes(field.key);
            return (
              <button
                key={field.key}
                type="button"
                className={`analytics-legend-btn${on ? " is-on" : ""}`}
                aria-pressed={on}
                onClick={() => toggleField(field.key)}
              >
                <i style={{ background: field.color }} />
                {field.label}
              </button>
            );
          })}
        </div>
      </div>

      {!hasTraffic ? (
        <div className="analytics-empty">Chưa ghi nhận dữ liệu truy cập trong khoảng thời gian này.</div>
      ) : (
        <div className="analytics-chart-scroll" tabIndex="0" role="region" aria-label="Biểu đồ lượt truy cập theo ngày">
          <div
            className="analytics-plot"
            style={{ width: series.length > 30 ? `max(100%, ${plotWidth}px)` : "100%" }}
            onMouseLeave={() => setActiveIndex(-1)}
            onKeyDown={(event) => {
              if (event.key === "Escape") setActiveIndex(-1);
            }}
          >
            <svg
              className="analytics-chart"
              viewBox={`0 0 ${plotWidth} 230`}
              role="group"
              aria-label="Biểu đồ đường lượt xem, khách và bấm sản phẩm theo ngày"
              onMouseMove={inspect}
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={primaryField?.color || "#b8446d"} stopOpacity="0.16" />
                  <stop offset="100%" stopColor={primaryField?.color || "#b8446d"} stopOpacity="0.01" />
                </linearGradient>
              </defs>
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const tickVal = Math.round(max * ratio);
                const yPos = y(tickVal);
                return (
                  <g key={ratio}>
                    <line
                      x1={padLeft}
                      x2={plotWidth - padRight}
                      y1={yPos}
                      y2={yPos}
                      stroke={ratio === 0 ? "#dfc9d4" : "#f2e7ec"}
                      strokeDasharray={ratio === 0 ? undefined : "4 4"}
                    />
                    <text x={padLeft - 8} y={yPos + 4} textAnchor="end">
                      {compact(tickVal)}
                    </text>
                  </g>
                );
              })}

              {primarySegments.map((seg, i) => {
                const area = `M ${seg[0].x} ${plotBottom} ${seg.map((pt) => `L ${pt.x} ${pt.y}`).join(" ")} L ${seg.at(-1).x} ${plotBottom} Z`;
                return <path key={i} d={area} fill={`url(#${gradientId})`} pointerEvents="none" />;
              })}

              {active && (
                <g className="analytics-crosshair" pointerEvents="none" aria-hidden="true">
                  <line
                    x1={x(activeIndex)}
                    x2={x(activeIndex)}
                    y1={plotTop}
                    y2={plotBottom}
                    stroke="#b8446d"
                    strokeDasharray="4 4"
                    strokeOpacity="0.5"
                  />
                  <rect x={x(activeIndex) - 26} y="200" width="52" height="22" rx="6" fill="#b8446d" />
                  <text className="analytics-crosshair-label" x={x(activeIndex)} y="215" textAnchor="middle">
                    {shortDay(active.day)}
                  </text>
                </g>
              )}

              {activeFields.map((field) => (
                <g key={field.key}>
                  {series
                    .reduce((segments, day, i) => {
                      if (!Number.isFinite(day[field.key])) {
                        if (segments.at(-1)?.length) segments.push([]);
                        return segments;
                      }
                      if (!segments.length) segments.push([]);
                      segments.at(-1).push(`${x(i)},${y(day[field.key])}`);
                      return segments;
                    }, [])
                    .filter((segment) => segment.length > 1)
                    .map((segment, i) => (
                      <polyline
                        key={i}
                        fill="none"
                        stroke={field.color}
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={segment.join(" ")}
                      />
                    ))}
                  {series.map(
                    (day, i) =>
                      Number.isFinite(day[field.key]) && (
                        <circle
                          key={day.day}
                          cx={x(i)}
                          cy={y(day[field.key])}
                          r={activeIndex === i ? 5 : 3}
                          fill={activeIndex === i ? "#ffffff" : field.color}
                          stroke={field.color}
                          strokeWidth={activeIndex === i ? 2.5 : 0}
                          pointerEvents="none"
                        />
                      ),
                  )}
                </g>
              ))}

              {series.map((day, i) => (
                <rect
                  key={`hit-${day.day}`}
                  className="analytics-point-target"
                  x={x(i) - Math.max(8, innerWidth / Math.max(2, series.length * 2))}
                  y={plotTop}
                  width={Math.max(16, innerWidth / Math.max(1, series.length))}
                  height={plotHeight}
                  fill="transparent"
                  tabIndex="0"
                  role="button"
                  aria-describedby={activeIndex === i ? tooltipId : undefined}
                  aria-label={`${fullDay(day.day)}: ${activeFields.map((f) => `${f.label} ${day[f.key] ?? "chưa có"}`).join(", ")}`}
                  onFocus={() => setActiveIndex(i)}
                  onBlur={() => setActiveIndex(-1)}
                  onClick={() => setActiveIndex(i)}
                />
              ))}

              {series
                .map((_, i) => i)
                .filter((i) => i === 0 || i === series.length - 1 || i % labelEvery === 0)
                .map((i) => (
                  <text
                    style={activeIndex === i ? { visibility: "hidden" } : undefined}
                    key={i}
                    x={x(i)}
                    y="216"
                    textAnchor="middle"
                  >
                    {shortDay(series[i].day)}
                  </text>
                ))}
            </svg>

            {active && (
              <div
                id={tooltipId}
                className="analytics-tooltip"
                role="tooltip"
                style={{ left: `clamp(112px, ${(x(activeIndex) / plotWidth) * 100}%, calc(100% - 112px))` }}
              >
                <strong>{fullDay(active.day)}</strong>
                {activeFields.map((field) => (
                  <span key={field.key}>
                    <i style={{ background: field.color }} />
                    {field.label}
                    <b>
                      {Number.isFinite(active[field.key])
                        ? active[field.key].toLocaleString("vi-VN")
                        : "—"}
                    </b>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AnalyticsDashboard() {
  const [days, setDays] = useState(7);
  const [revision, setRevision] = useState(0);
  const [liveData, setData] = useState(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      (async () => {
        try {
          const token = await auth?.currentUser?.getIdToken();
          if (!token) throw Error("Vui lòng đăng nhập lại.");
          const response = await fetch(`/api/analytics?days=${days}`, {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
            cache: "no-store",
          });
          const result = await response.json().catch(() => {
            throw Error("Chưa kết nối được API thống kê. Vui lòng thử lại sau.");
          });
          if (!response.ok) throw Error(result.message || "Chưa tải được thống kê.");
          if (!validAnalyticsReport(result, days))
            throw Error("Dữ liệu thống kê chưa đầy đủ hoặc không hợp lệ. Vui lòng tải lại.");
          if (alive) setData(result);
        } catch (cause) {
          if (alive && cause.name !== "AbortError") setError(cause.message);
        } finally {
          if (alive) setBusy(false);
        }
      })();
    }, 150);
    return () => {
      alive = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [days, revision]);

  const data = liveData;
  const series = data?.series || [];
  const hasTraffic = series.some((day) => day.pageViews != null);
  const trafficDays = series.filter((day) => day.pageViews != null).length;
  const total = (key) => series.reduce((sum, day) => sum + (day[key] || 0), 0);
  const paidAmount = total("paidAmount");
  const paidOrders = total("paidOrders");
  const pageViews = total("pageViews");
  const visitors = total("visitors");
  const productClicks = total("productClicks");
  const orderDays = series.filter((day) => (day.paidOrders || 0) > 0).length;
  const aov = paidOrders > 0 ? Math.round(paidAmount / paidOrders) : 0;
  const avgViews = trafficDays > 0 ? Math.round(pageViews / trafficDays) : 0;
  const viewsPerVisitor = visitors > 0 ? (pageViews / visitors).toFixed(1) : "—";
  const clickRate = pageViews > 0 ? ((productClicks / pageViews) * 100).toFixed(1) : null;
  const conversionRate = hasTraffic && visitors > 0 ? ((paidOrders / visitors) * 100).toFixed(2) : null;
  const maxClicks = Math.max(1, ...(data?.products || []).map((p) => Math.max(p.clicks || 0, p.views || 0)));

  const selectRange = (nextDays) => {
    if (nextDays === days) return;
    setBusy(true);
    setError("");
    setData(null);
    setDays(nextDays);
  };

  const exportCsv = () => {
    if (!series.length) return;
    const header = ["Ngày", "Doanh thu (VND)", "Đơn đã thanh toán", "Lượt xem", "Khách/ngày", "Bấm sản phẩm"];
    const rows = [...series]
      .reverse()
      .map((day) => [
        fullDay(day.day),
        day.paidAmount || 0,
        day.paidOrders || 0,
        day.pageViews ?? "",
        day.visitors ?? "",
        day.productClicks ?? "",
      ]);
    const csv = `\uFEFF${[header, ...rows].map((row) => row.map(csvSafeCell).join(",")).join("\n")}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `orora-thong-ke-${days}ngay.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <section className="analytics-dashboard">
      <div className="analytics-toolbar">
        <p className="admin-muted analytics-meta" role={busy ? "status" : undefined}>
          {busy
            ? "Đang tổng hợp thống kê thực tế…"
            : data
              ? `Cập nhật ${new Date(data.updatedAt).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })} · Giờ Việt Nam${Number.isInteger(data.documentsRead) ? ` · ${data.documentsRead} tài liệu` : ""}`
              : "Số liệu thực tế theo ngày Việt Nam"}
        </p>
        <div className="analytics-controls">
          <div className="analytics-presets" role="group" aria-label="Chọn khoảng thời gian">
            {PRESETS.map((preset) => (
              <button
                key={preset.days}
                type="button"
                aria-pressed={days === preset.days}
                onClick={() => selectRange(preset.days)}
              >
                {preset.label}
              </button>
            ))}
          </div>
          {series.length > 0 && (
            <button type="button" className="admin-btn" onClick={exportCsv}>
              Xuất CSV
            </button>
          )}
          <button
            type="button"
            className="admin-btn"
            aria-busy={busy}
            disabled={busy}
            onClick={() => {
              setBusy(true);
              setError("");
              setData(null);
              setRevision((n) => n + 1);
            }}
          >
            Làm mới
          </button>
        </div>
      </div>

      {error && (
        <p className="admin-error" role="alert">
          {error}
        </p>
      )}

      {busy && !data && (
        <div className="analytics-skeleton" aria-hidden="true">
          <div className="analytics-kpis">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div className="admin-card analytics-skeleton-card" key={idx} />
            ))}
          </div>
          <div className="analytics-charts">
            <div className="admin-card analytics-skeleton-chart" />
            <div className="admin-card analytics-skeleton-chart" />
          </div>
        </div>
      )}

      {data && (
        <>
          <div className="analytics-kpis">
            {[
              [
                "Doanh thu đã thanh toán",
                formatVnd(paidAmount),
                paidOrders > 0 ? `TB ${formatVnd(aov)} / đơn` : "Chưa phát sinh đơn thanh toán",
                true,
              ],
              [
                "Đơn đã thanh toán",
                paidOrders.toLocaleString("vi-VN"),
                `${orderDays}/${series.length} ngày có đơn`,
                false,
              ],
              [
                "Lượt xem trang",
                hasTraffic ? pageViews.toLocaleString("vi-VN") : "—",
                hasTraffic ? `TB ${avgViews.toLocaleString("vi-VN")} lượt/ngày` : "Chưa có dữ liệu truy cập",
                false,
              ],
              [
                "Khách truy cập",
                hasTraffic ? visitors.toLocaleString("vi-VN") : "—",
                hasTraffic && visitors > 0 ? `${viewsPerVisitor} lượt xem/khách` : "Tính theo ngày Việt Nam",
                false,
              ],
              [
                "Lượt bấm sản phẩm",
                hasTraffic ? productClicks.toLocaleString("vi-VN") : "—",
                clickRate !== null ? `CTR ${clickRate}% trên lượt xem` : "Từ danh sách sản phẩm",
                false,
              ],
              [
                "Tỷ lệ chuyển đổi",
                conversionRate !== null ? `${conversionRate}%` : "—",
                "Đơn thanh toán / Khách",
                false,
              ],
            ].map(([label, value, sub, highlight]) => (
              <div className={`admin-card${highlight ? " is-primary" : ""}`} key={label}>
                <span className="admin-muted">{label}</span>
                <strong>{value}</strong>
                <small className="analytics-kpi-sub">{sub}</small>
              </div>
            ))}
          </div>

          {total("unpricedPaid") > 0 && (
            <p className="admin-context-note">
              Có {total("unpricedPaid")} đơn đã thanh toán nhưng chưa chốt tổng tiền (chưa cộng vào doanh thu).
            </p>
          )}

          <div className="analytics-charts">
            <RevenueBarChart series={series} />
            <TrafficLineChart series={series} />
          </div>

          <div className="admin-card">
            <div className="analytics-card-head">
              <div>
                <h3>Sản phẩm được quan tâm</h3>
                <p className="analytics-card-sub">Xếp hạng theo lượt bấm &amp; lượt xem trang chi tiết</p>
              </div>
              <span className="admin-muted">Top {Math.min(20, data.products.length)} sản phẩm</span>
            </div>
            {!data.products.length ? (
              <p className="admin-muted">Chưa ghi nhận lượt bấm hoặc xem sản phẩm trong khoảng này.</p>
            ) : (
              <div className="analytics-products">
                {data.products.map((product, index) => {
                  const score = Math.max(product.clicks || 0, product.views || 0);
                  const pct = Math.max(4, Math.round((score / maxClicks) * 100));
                  return (
                    <div className="analytics-product-row" key={product.id || product.path}>
                      <div className="analytics-product-title">
                        <span className="analytics-product-name">
                          <em className={`analytics-rank${index < 3 ? " is-top" : ""}`}>#{index + 1}</em>
                          {product.name}
                        </span>
                        <strong>
                          {(product.clicks || 0).toLocaleString("vi-VN")} bấm · {(product.views || 0).toLocaleString("vi-VN")} xem
                        </strong>
                      </div>
                      <div className="analytics-bar">
                        <i style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <details className="admin-filter-panel">
            <summary>Xem bảng số liệu chi tiết từng ngày ({series.length} ngày)</summary>
            <div className="analytics-data-scroll">
              <table className="admin-table analytics-table">
                <thead>
                  <tr>
                    <th>Ngày</th>
                    <th className="num">Doanh thu</th>
                    <th className="num">Đơn TT</th>
                    <th className="num">Lượt xem</th>
                    <th className="num">Khách</th>
                    <th className="num">Bấm SP</th>
                  </tr>
                </thead>
                <tbody>
                  {[...series].reverse().map((day) => (
                    <tr key={day.day}>
                      <td>{fullDay(day.day)}</td>
                      <td className="num">{formatVnd(day.paidAmount || 0)}</td>
                      <td className="num">{(day.paidOrders || 0).toLocaleString("vi-VN")}</td>
                      <td className="num">{day.pageViews != null ? day.pageViews.toLocaleString("vi-VN") : "—"}</td>
                      <td className="num">{day.visitors != null ? day.visitors.toLocaleString("vi-VN") : "—"}</td>
                      <td className="num">{day.productClicks != null ? day.productClicks.toLocaleString("vi-VN") : "—"}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th>Tổng cộng</th>
                    <th className="num">{formatVnd(paidAmount)}</th>
                    <th className="num">{paidOrders.toLocaleString("vi-VN")}</th>
                    <th className="num">{hasTraffic ? pageViews.toLocaleString("vi-VN") : "—"}</th>
                    <th className="num">{hasTraffic ? visitors.toLocaleString("vi-VN") : "—"}</th>
                    <th className="num">{hasTraffic ? productClicks.toLocaleString("vi-VN") : "—"}</th>
                  </tr>
                </tfoot>
              </table>
            </div>
          </details>

          <details className="analytics-notes">
            <summary>Ghi chú cách tính số liệu</summary>
            <p className="admin-muted">
              Toàn bộ biểu đồ hiển thị 100% số liệu thực tế từ hệ thống (không chèn số liệu minh họa).
              Doanh thu tính theo ngày đặt đối với đơn đã thanh toán (gồm phí giao hàng, loại đơn đã hủy).
              Dấu “—” là ngày chưa có dữ liệu truy cập. Không tính trang admin và bot tự động.{" "}
              {data.recordedSince
                ? `Bắt đầu ghi nhận truy cập từ ${fullDay(data.recordedSince)}.`
                : "Website sẽ tự ghi nhận khi khách ghé thăm."}
            </p>
          </details>
        </>
      )}
    </section>
  );
}

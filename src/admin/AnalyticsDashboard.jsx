import { chartDisplaySeries } from "../lib/analytics-demo";
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
const shortDay = (day) => `${day.slice(8)}/${day.slice(5, 7)}`;
const fullDay = (day) => day.split("-").reverse().join("/");
const compact = (n) =>
  new Intl.NumberFormat("vi-VN", { notation: "compact", maximumFractionDigits: 1 }).format(n);

function DailyChart({ series, fields, money = false, title, heading }) {
  const [activeField, setActiveField] = useState(null);
  const [activeDay, setActiveDay] = useState(null);
  const tooltipId = useId();
  const gradientId = useId();
  const activeIndex = series.findIndex((day) => day.day === activeDay);
  const active = series[activeIndex];

  if (!series.some((day) => fields.some((field) => Number.isFinite(day[field.key])))) {
    return (
      <div className="admin-card analytics-chart-card">
        <div className="analytics-card-head">
          <h3>{heading}</h3>
        </div>
        <p className="analytics-empty">Chưa có dữ liệu trong khoảng này.</p>
      </div>
    );
  }

  const peak = Math.max(1, ...series.flatMap((day) => fields.map((field) => day[field.key] || 0)));
  const max = money ? Math.max(1000, peak) : Math.max(2, Math.ceil(peak / 2) * 2);
  const plotWidth = series.length > 30 ? Math.max(600, 76 + (series.length - 1) * 22) : 600;
  const x = (i) => 54 + i * ((plotWidth - 76) / Math.max(1, series.length - 1));
  const y = (n) => 190 - (n / max) * 160;
  const activeValue = active?.[activeField || fields[0].key];

  const inspect = (event) => {
    const svg = event.currentTarget;
    const matrix = svg.getScreenCTM();
    if (!matrix) return;
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    if (point.x < 54 || point.x > plotWidth - 22 || point.y < 30 || point.y > 190) {
      setActiveDay(null);
      return;
    }
    const index = Math.max(
      0,
      Math.min(
        series.length - 1,
        Math.round(((point.x - 54) / (plotWidth - 76)) * Math.max(1, series.length - 1)),
      ),
    );
    const day = series[index];
    const available = fields.filter((field) => Number.isFinite(day[field.key]));
    if (!available.length) {
      setActiveDay(null);
      return;
    }
    const nearest = available.reduce((best, field) =>
      Math.abs(y(day[field.key]) - point.y) < Math.abs(y(day[best.key]) - point.y) ? field : best,
    );
    setActiveDay(day.day);
    setActiveField(nearest.key);
  };

  const primaryField = fields[0];
  const primarySegments = series.reduce((segments, day, i) => {
    if (!Number.isFinite(day[primaryField.key])) {
      if (segments.at(-1)?.length) segments.push([]);
      return segments;
    }
    if (!segments.length) segments.push([]);
    segments.at(-1).push({ x: x(i), y: y(day[primaryField.key]) });
    return segments;
  }, []).filter((segment) => segment.length > 1);

  return (
    <div className="admin-card analytics-chart-card">
      <div className="analytics-card-head">
        <h3>{heading}</h3>
        <div className="analytics-legend">
          {fields.map((field) => (
            <span key={field.key}>
              <i style={{ background: field.color }} />
              {field.label}
            </span>
          ))}
        </div>
      </div>
      <div className="analytics-chart-scroll" tabIndex="0" role="region" aria-label={`Biểu đồ: ${title}`}>
        <div
          className="analytics-plot"
          style={{ width: series.length > 30 ? `max(100%, ${plotWidth}px)` : "100%" }}
          onMouseLeave={() => setActiveDay(null)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setActiveDay(null);
          }}
        >
          <svg
            className="analytics-chart"
            viewBox={`0 0 ${plotWidth} 230`}
            role="group"
            aria-label={title}
            onMouseMove={inspect}
          >
            <title>{title}</title>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={primaryField.color} stopOpacity="0.18" />
                <stop offset="100%" stopColor={primaryField.color} stopOpacity="0.01" />
              </linearGradient>
            </defs>
            {[0, 0.5, 1].map((ratio) => (
              <g key={ratio}>
                <line
                  x1="54"
                  x2={plotWidth - 22}
                  y1={y(max * ratio)}
                  y2={y(max * ratio)}
                  stroke="#efe4e9"
                  strokeDasharray={ratio === 0 ? undefined : "4 4"}
                />
                <text x="46" y={y(max * ratio) + 4} textAnchor="end">
                  {compact(max * ratio)}
                </text>
              </g>
            ))}
            {primarySegments.map((seg, i) => {
              const area = `M ${seg[0].x} 190 ${seg.map((pt) => `L ${pt.x} ${pt.y}`).join(" ")} L ${seg.at(-1).x} 190 Z`;
              return <path key={i} d={area} fill={`url(#${gradientId})`} pointerEvents="none" />;
            })}
            {active && Number.isFinite(activeValue) && (
              <g className="analytics-crosshair" pointerEvents="none" aria-hidden="true">
                <line
                  x1={x(activeIndex)}
                  x2={x(activeIndex)}
                  y1="30"
                  y2="190"
                  stroke="#b8446d"
                  strokeDasharray="4 4"
                  strokeOpacity="0.55"
                />
                <rect x={x(activeIndex) - 26} y="200" width="52" height="22" rx="6" fill="#b8446d" />
                <text className="analytics-crosshair-label" x={x(activeIndex)} y="215" textAnchor="middle">
                  {shortDay(active.day)}
                </text>
              </g>
            )}
            {fields.map((field) => (
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
                  .filter((segment) => segment.length)
                  .map((segment, i) => (
                    <polyline
                      key={i}
                      fill="none"
                      stroke={field.color}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={segment.join(" ")}
                    />
                  ))}
                {series.map(
                  (day, i) =>
                    Number.isFinite(day[field.key]) && (
                      <g key={day.day}>
                        <circle
                          cx={x(i)}
                          cy={y(day[field.key])}
                          r={activeDay === day.day ? 5.5 : 3.5}
                          fill={activeDay === day.day ? "#ffffff" : field.color}
                          stroke={field.color}
                          strokeWidth={activeDay === day.day ? 2.5 : 0}
                          pointerEvents="none"
                        />
                        <circle
                          className="analytics-point-target"
                          cx={x(i)}
                          cy={y(day[field.key])}
                          r="12"
                          fill="transparent"
                          tabIndex="0"
                          role="button"
                          aria-describedby={activeDay === day.day ? tooltipId : undefined}
                          aria-label={`${day.day}: ${field.label} ${money ? formatVnd(day[field.key]) : day[field.key]}`}
                          onMouseEnter={() => {
                            setActiveDay(day.day);
                            setActiveField(field.key);
                          }}
                          onFocus={() => {
                            setActiveDay(day.day);
                            setActiveField(field.key);
                          }}
                          onBlur={() => setActiveDay(null)}
                          onClick={() => {
                            setActiveDay(day.day);
                            setActiveField(field.key);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              setActiveDay(day.day);
                            }
                          }}
                        />
                      </g>
                    ),
                )}
              </g>
            ))}
            {series
              .map((_, i) => i)
              .filter(
                (i) =>
                  i === 0 ||
                  i === series.length - 1 ||
                  i % Math.max(1, Math.ceil(series.length / Math.max(2, Math.floor(plotWidth / 85)))) === 0,
              )
              .map((i) => (
                <text
                  style={activeDay === series[i].day ? { visibility: "hidden" } : undefined}
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
              style={{ left: `clamp(110px, ${(x(activeIndex) / plotWidth) * 100}%, calc(100% - 110px))` }}
            >
              <strong>{fullDay(active.day)}</strong>
              {fields.map((field) => (
                <span key={field.key}>
                  <i style={{ background: field.color }} />
                  {field.label}
                  <b>
                    {Number.isFinite(active[field.key])
                      ? money
                        ? formatVnd(active[field.key])
                        : active[field.key].toLocaleString("vi-VN")
                      : "—"}
                  </b>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
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
  const total = (key) => series.reduce((sum, day) => sum + (day[key] || 0), 0);
  const maxClicks = Math.max(1, ...(data?.products || []).map((p) => p.clicks));
  const chartSeries = chartDisplaySeries(series);

  const selectRange = (nextDays) => {
    if (nextDays === days) return;
    setBusy(true);
    setError("");
    setData(null);
    setDays(nextDays);
  };

  return (
    <section className="analytics-dashboard">
      <div className="analytics-toolbar">
        <p className="admin-muted analytics-meta" role={busy ? "status" : undefined}>
          {busy
            ? "Đang tổng hợp thống kê…"
            : data
              ? `Cập nhật ${new Date(data.updatedAt).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })} · Giờ Việt Nam`
              : "Theo ngày Việt Nam"}
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

      {data && (
        <>
          <div className="analytics-kpis">
            {[
              ["Doanh thu đã thanh toán", formatVnd(total("paidAmount")), true],
              ["Đơn đã thanh toán", total("paidOrders").toLocaleString("vi-VN"), false],
              ["Lượt xem trang", hasTraffic ? total("pageViews").toLocaleString("vi-VN") : "—", false],
              ["Lượt bấm sản phẩm", hasTraffic ? total("productClicks").toLocaleString("vi-VN") : "—", false],
            ].map(([label, value, highlight]) => (
              <div className={`admin-card${highlight ? " is-primary" : ""}`} key={label}>
                <span className="admin-muted">{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>

          {total("unpricedPaid") > 0 && (
            <p className="admin-context-note">
              Có {total("unpricedPaid")} đơn đã thanh toán nhưng chưa chốt tổng tiền (chưa cộng vào doanh thu).
            </p>
          )}

          <div className="analytics-charts">
            <DailyChart
              series={chartSeries}
              heading="Doanh thu đã thanh toán"
              title="Giá trị đơn đã thanh toán theo ngày đặt"
              money
              fields={[{ key: "paidAmount", label: "Doanh thu (đ)", color: "#b8446d" }]}
            />
            <DailyChart
              series={chartSeries}
              heading="Lượt truy cập theo ngày"
              title="Lượt xem và khách theo ngày"
              fields={[
                { key: "pageViews", label: "Lượt xem", color: "#b8446d" },
                { key: "visitors", label: "Khách/ngày", color: "#6a89ae" },
              ]}
            />
          </div>

          <div className="admin-card">
            <div className="analytics-card-head">
              <h3>Sản phẩm được quan tâm</h3>
              <span className="admin-muted">Top 20 theo lượt bấm</span>
            </div>
            {!data.products.length ? (
              <p className="admin-muted">Chưa ghi nhận lượt bấm hoặc xem sản phẩm trong khoảng này.</p>
            ) : (
              <div className="analytics-products">
                {data.products.map((product, index) => (
                  <div key={product.id || product.path}>
                    <div className="analytics-product-title">
                      <span>
                        {index + 1}. {product.name}
                      </span>
                      <strong>
                        {product.clicks} bấm · {product.views} xem
                      </strong>
                    </div>
                    <div className="analytics-bar">
                      <i style={{ width: `${(product.clicks / maxClicks) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <details className="admin-filter-panel">
            <summary>Xem bảng số liệu từng ngày</summary>
            <div className="analytics-data-scroll">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Ngày</th>
                    <th>Doanh thu</th>
                    <th>Đơn thanh toán</th>
                    <th>Lượt xem</th>
                    <th>Khách</th>
                    <th>Bấm SP</th>
                  </tr>
                </thead>
                <tbody>
                  {[...series].reverse().map((day) => (
                    <tr key={day.day}>
                      <td>{fullDay(day.day)}</td>
                      <td>{formatVnd(day.paidAmount)}</td>
                      <td>{day.paidOrders}</td>
                      <td>{day.pageViews ?? "—"}</td>
                      <td>{day.visitors ?? "—"}</td>
                      <td>{day.productClicks ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>

          <details className="analytics-notes">
            <summary>Ghi chú cách tính số liệu</summary>
            <p className="admin-muted">
              Doanh thu tính theo ngày đặt đơn đối với đơn đã thanh toán (gồm phí giao hàng, loại đơn đã hủy).
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

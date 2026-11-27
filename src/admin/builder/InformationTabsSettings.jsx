import { useEffect, useId, useState } from "react";
import { ColorField, StyleTypographyBlock } from "./ui";
import { PRODUCT_CONTENT_GROUPS } from "../../lib/product-content";
import { informationTabSettings } from "../../lib/product-information";

const TABS = [
  ["tabs", "Tab"],
  ["media", "Khung ảnh"],
  ["caption", "Chú thích"],
  ["motion", "Hiệu ứng"],
];

const FRAME_PRESETS = [
  ["Tối giản", { imageRadius: 8, imageBorderWidth: 1, imageShadow: "none", blockGap: 20 }],
  ["Mềm mại", { imageRadius: 16, imageBorderWidth: 1, imageShadow: "soft", blockGap: 24 }],
  ["Sang trọng", { imageRadius: 20, imageBorderWidth: 1, imageShadow: "elevated", blockGap: 32 }],
  ["Tràn viền", { imageRadius: 0, imageBorderWidth: 0, imageShadow: "none", blockGap: 12 }],
];

const MOTION_PRESETS = [
  [
    "Mượt nhẹ",
    { skeletonEffect: "shimmer", tabTransition: "slide-up", revealEffect: "rise", captionEffect: "fade", motionDuration: 450 },
  ],
  [
    "Cao cấp",
    { skeletonEffect: "shimmer-rose", tabTransition: "blur-in", revealEffect: "blur-in", captionEffect: "stagger", motionDuration: 600 },
  ],
  [
    "Năng động",
    { skeletonEffect: "wave", tabTransition: "slide-left", revealEffect: "curtain", captionEffect: "slide-left", motionDuration: 400 },
  ],
  [
    "Tắt hiệu ứng",
    { skeletonEffect: "static", tabTransition: "none", revealEffect: "none", captionEffect: "none", motionDuration: 260 },
  ],
];

const replayMotion = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("orora:replay-info-motion"));
  }
};

export default function InformationTabsSettings({ value = {}, onChange, openSection = "" }) {
  const id = useId();
  const config = informationTabSettings(value);
  const initialTab = TABS.some(([key]) => key === openSection) ? openSection : "tabs";
  const [tab, setTab] = useState(initialTab);
  const [captionSub, setCaptionSub] = useState(() => {
    if (typeof window !== "undefined" && ["title", "body", "box"].includes(window.__ororaPendingCaptionSub)) {
      const next = window.__ororaPendingCaptionSub;
      window.__ororaPendingCaptionSub = null;
      return next;
    }
    return "title";
  });

  const [prevOpenSection, setPrevOpenSection] = useState(openSection);
  if (openSection !== prevOpenSection) {
    setPrevOpenSection(openSection);
    if (TABS.some(([key]) => key === openSection)) {
      setTab(openSection);
    }
  }

  useEffect(() => {
    const onSub = (event) => {
      if (["title", "body", "box"].includes(event.detail)) {
        if (typeof window !== "undefined") window.__ororaPendingCaptionSub = null;
        setTab("caption");
        setCaptionSub(event.detail);
      }
    };
    window.addEventListener("orora:info-caption-sub", onSub);
    return () => window.removeEventListener("orora:info-caption-sub", onSub);
  }, []);

  const updateWithReplay = (patch) => {
    onChange(patch);
    replayMotion();
  };

  return (
    <div className="info-builder-panel">
      <div className="info-builder-tabs" role="tablist" aria-label="Nhóm chỉnh nội dung sản phẩm">
        {TABS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            className={tab === key ? "is-active" : ""}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "tabs" && (
        <div className="info-builder-body">
          <div className="builder-field">
            <label htmlFor={id}>Tab mở mặc định</label>
            <select
              id={id}
              value={config.defaultTab}
              onChange={(e) => onChange({ defaultTab: e.target.value })}
            >
              {Object.entries(PRODUCT_CONTENT_GROUPS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          {Object.entries(PRODUCT_CONTENT_GROUPS).map(([key, label]) => (
            <label className="builder-field" key={key}>
              Tên tab {label}
              <input
                value={value.labels?.[key] ?? ""}
                placeholder={label}
                maxLength={80}
                onChange={(e) => onChange({ labels: { ...value.labels, [key]: e.target.value } })}
              />
            </label>
          ))}
          <label className="builder-field">
            Chữ khi chưa có nội dung
            <input
              value={value.emptyText ?? ""}
              placeholder="Thông tin đang được cập nhật."
              maxLength={200}
              onChange={(e) => onChange({ emptyText: e.target.value })}
            />
          </label>
          <details className="info-builder-subdetails">
            <summary>Màu thanh tab & tab đang chọn</summary>
            <ColorField
              label="Nền thanh tab"
              value={value.tabBarBg}
              fallback="#fff4f8"
              onChange={(tabBarBg) => onChange({ tabBarBg })}
            />
            <ColorField
              label="Nền tab đang chọn"
              value={value.tabActiveBg}
              fallback="#e2678f"
              onChange={(tabActiveBg) => onChange({ tabActiveBg })}
            />
            <ColorField
              label="Chữ tab đang chọn"
              value={value.tabActiveColor}
              fallback="#ffffff"
              onChange={(tabActiveColor) => onChange({ tabActiveColor })}
            />
            <ColorField
              label="Chữ tab chưa chọn"
              value={value.tabInactiveColor}
              fallback="#5a2e42"
              onChange={(tabInactiveColor) => onChange({ tabInactiveColor })}
            />
          </details>
        </div>
      )}

      {tab === "media" && (
        <div className="info-builder-body">
          <small className="builder-help">Ảnh nội dung chuẩn tỷ lệ 3:2 (1920 × 1280 px) dùng chung mọi sản phẩm.</small>
          <div className="info-preset-row" role="group" aria-label="Kiểu khung ảnh nhanh">
            {FRAME_PRESETS.map(([label, patch]) => (
              <button key={label} type="button" className="info-preset-chip" onClick={() => onChange(patch)}>
                {label}
              </button>
            ))}
          </div>
          <label className="builder-field">
            Cách hiển thị ảnh
            <select
              value={config.imageFit}
              onChange={(e) => onChange({ imageFit: e.target.value })}
            >
              <option value="cover">Lấp đầy khung (cover)</option>
              <option value="contain">Hiển thị nguyên ảnh (contain)</option>
            </select>
          </label>
          <div className="builder-field-row">
            <label className="builder-field">
              Bo góc ảnh (px)
              <input
                type="number"
                min={0}
                max={36}
                value={config.imageRadius}
                onChange={(e) => onChange({ imageRadius: Number(e.target.value) })}
              />
            </label>
            <label className="builder-field">
              Viền ảnh (px)
              <input
                type="number"
                min={0}
                max={6}
                value={config.imageBorderWidth}
                onChange={(e) => onChange({ imageBorderWidth: Number(e.target.value) })}
              />
            </label>
          </div>
          <div className="builder-field-row">
            <label className="builder-field">
              Đổ bóng
              <select
                value={config.imageShadow}
                onChange={(e) => onChange({ imageShadow: e.target.value })}
              >
                <option value="none">Không</option>
                <option value="soft">Nhẹ</option>
                <option value="medium">Vừa</option>
                <option value="elevated">Nổi bật</option>
              </select>
            </label>
            <label className="builder-field">
              Cách khối (px)
              <input
                type="number"
                min={0}
                max={64}
                value={config.blockGap}
                onChange={(e) => onChange({ blockGap: Number(e.target.value) })}
              />
            </label>
          </div>
          <ColorField
            label="Màu viền khung ảnh"
            value={value.imageBorderColor}
            fallback="#f3dce5"
            onChange={(imageBorderColor) => onChange({ imageBorderColor })}
          />
        </div>
      )}

      {tab === "caption" && (
        <div className="info-builder-body">
          <div className="info-preset-row" role="tablist" aria-label="Phần chú thích">
            {[
              ["title", "Đầu mục"],
              ["body", "Nội dung"],
              ["box", "Khung nền"],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={captionSub === key}
                className={`info-preset-chip${captionSub === key ? " is-active" : ""}`}
                onClick={() => setCaptionSub(key)}
              >
                {label}
              </button>
            ))}
          </div>

          {captionSub === "title" && (
            <StyleTypographyBlock
              title="Kiểu chữ Đầu mục"
              style={config.captionTitleStyle}
              onStyleChange={(patch) => onChange({ captionTitleStyle: { ...config.captionTitleStyle, ...patch } })}
            />
          )}

          {captionSub === "body" && (
            <StyleTypographyBlock
              title="Kiểu chữ Nội dung"
              style={config.captionStyle}
              onStyleChange={(patch) => onChange({ captionStyle: { ...config.captionStyle, ...patch } })}
            />
          )}

          {captionSub === "box" && (
            <>
              <label className="builder-field">
                Căn chữ chú thích
                <select
                  value={config.captionAlign}
                  onChange={(e) => onChange({ captionAlign: e.target.value })}
                >
                  <option value="left">Căn trái</option>
                  <option value="center">Căn giữa</option>
                  <option value="right">Căn phải</option>
                </select>
              </label>
              <ColorField
                label="Màu nền khung chú thích"
                value={value.captionBg === "transparent" ? "" : value.captionBg}
                fallback="#fff9fb"
                onChange={(captionBg) => onChange({ captionBg: captionBg || "transparent" })}
              />
              <div className="builder-field-row">
                <label className="builder-field">
                  Viền (px)
                  <input
                    type="number"
                    min={0}
                    max={4}
                    value={config.captionBorderWidth}
                    onChange={(e) => onChange({ captionBorderWidth: Number(e.target.value) })}
                  />
                </label>
                <label className="builder-field">
                  Bo góc (px)
                  <input
                    type="number"
                    min={0}
                    max={28}
                    value={config.captionRadius}
                    onChange={(e) => onChange({ captionRadius: Number(e.target.value) })}
                  />
                </label>
              </div>
              <ColorField
                label="Màu viền chú thích"
                value={value.captionBorderColor}
                fallback="#f3dce5"
                onChange={(captionBorderColor) => onChange({ captionBorderColor })}
              />
              <div className="builder-field-row">
                <label className="builder-field">
                  Đệm ngang (px)
                  <input
                    type="number"
                    min={0}
                    max={36}
                    value={config.captionPaddingX}
                    onChange={(e) => onChange({ captionPaddingX: Number(e.target.value) })}
                  />
                </label>
                <label className="builder-field">
                  Đệm dọc (px)
                  <input
                    type="number"
                    min={0}
                    max={36}
                    value={config.captionPaddingY}
                    onChange={(e) => onChange({ captionPaddingY: Number(e.target.value) })}
                  />
                </label>
              </div>
            </>
          )}
        </div>
      )}

      {tab === "motion" && (
        <div className="info-builder-body">
          <button type="button" className="info-replay-btn" onClick={replayMotion}>
            ▶ Xem thử hiệu ứng trên preview
          </button>

          <div className="info-preset-row" role="group" aria-label="Bộ hiệu ứng nhanh">
            {MOTION_PRESETS.map(([label, patch]) => (
              <button
                key={label}
                type="button"
                className="info-preset-chip"
                onClick={() => updateWithReplay(patch)}
              >
                {label}
              </button>
            ))}
          </div>

          <label className="builder-field">
            Hiệu ứng tải ảnh (Skeleton)
            <select
              value={config.skeletonEffect}
              onChange={(e) => updateWithReplay({ skeletonEffect: e.target.value })}
            >
              <option value="shimmer">Shimmer ánh sáng lướt</option>
              <option value="shimmer-rose">Shimmer hồng ngọc trai</option>
              <option value="pulse">Nhịp thở nhẹ</option>
              <option value="wave">Sóng lan mềm</option>
              <option value="static">Nền tĩnh</option>
            </select>
          </label>

          <label className="builder-field">
            Hiệu ứng chuyển tab
            <select
              value={config.tabTransition}
              onChange={(e) => updateWithReplay({ tabTransition: e.target.value })}
            >
              <option value="slide-up">Trượt nhẹ lên</option>
              <option value="slide-left">Lướt ngang</option>
              <option value="fade">Hiện dần</option>
              <option value="blur-in">Mờ sang rõ nét</option>
              <option value="zoom">Phóng nhẹ</option>
              <option value="none">Tắt hiệu ứng</option>
            </select>
          </label>

          <label className="builder-field">
            Hiệu ứng load ảnh khi hiện
            <select
              value={config.revealEffect}
              onChange={(e) => updateWithReplay({ revealEffect: e.target.value })}
            >
              <option value="rise">Trượt nhẹ lên</option>
              <option value="fade">Hiện dần</option>
              <option value="zoom">Phóng nhẹ</option>
              <option value="blur-in">Mờ sang rõ nét</option>
              <option value="curtain">Mở rèm mềm</option>
              <option value="slide-left">Lướt ngang</option>
              <option value="none">Tắt hiệu ứng</option>
            </select>
          </label>

          <label className="builder-field">
            Hiệu ứng load text (Đầu mục & Nội dung)
            <select
              value={config.captionEffect}
              onChange={(e) => updateWithReplay({ captionEffect: e.target.value })}
            >
              <option value="fade">Hiện dần</option>
              <option value="rise">Trượt nhẹ lên</option>
              <option value="blur-in">Mờ sang rõ nét</option>
              <option value="zoom">Phóng nhẹ</option>
              <option value="slide-left">Lướt ngang</option>
              <option value="stagger">Đầu mục trước · Nội dung sau</option>
              <option value="none">Tắt hiệu ứng</option>
            </select>
          </label>

          <label className="builder-field">
            Tốc độ hiệu ứng
            <select
              value={config.motionDuration}
              onChange={(e) => updateWithReplay({ motionDuration: Number(e.target.value) })}
            >
              <option value={260}>Nhanh (260 ms)</option>
              <option value={450}>Mượt (450 ms)</option>
              <option value={600}>Êm dịu (600 ms)</option>
              <option value={750}>Chậm sang trọng (750 ms)</option>
            </select>
          </label>

          <details className="info-builder-subdetails">
            <summary>Màu nền Skeleton & Ánh Shimmer</summary>
            <ColorField
              label="Màu nền Skeleton"
              value={value.skeletonBaseColor}
              fallback="#fcebf1"
              onChange={(skeletonBaseColor) => updateWithReplay({ skeletonBaseColor })}
            />
            <ColorField
              label="Màu ánh Shimmer"
              value={value.skeletonHighlightColor}
              fallback="#fff8fb"
              onChange={(skeletonHighlightColor) => updateWithReplay({ skeletonHighlightColor })}
            />
          </details>
        </div>
      )}
    </div>
  );
}

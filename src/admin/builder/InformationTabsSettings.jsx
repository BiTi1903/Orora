import { useId } from "react";
import { ColorField, SettingGroup, StyleTypographyBlock } from "./ui";
import { PRODUCT_CONTENT_GROUPS } from "../../lib/product-content";
import { informationTabSettings } from "../../lib/product-information";

export default function InformationTabsSettings({ value = {}, onChange, openSection = "" }) {
  const id = useId();
  const config = informationTabSettings(value);

  return (
    <SettingGroup title="Tab nội dung sản phẩm">
      <details open={openSection === "tabs" || undefined}>
        <summary>Nhãn tab và mục mở mặc định</summary>
        <small className="builder-help">
          Chỉ hiện nội dung của tab đang chọn trên cả mobile và desktop. Kiểu chữ chỉnh tại các mục Nút nội dung và Tiêu
          đề nội dung; nội dung từng sản phẩm chỉnh tại Sản phẩm.
        </small>
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
        <label className="builder-field">
          Số cột thông số ngắn trên máy tính
          <select
            value={config.specColumns}
            onChange={(e) => onChange({ specColumns: Number(e.target.value) })}
          >
            <option value={2}>2 cột</option>
            <option value={1}>1 cột</option>
          </select>
        </label>
        <label className="builder-field">
          Bo góc ô thông số (px)
          <input
            type="number"
            min={0}
            max={28}
            value={config.cardRadius}
            onChange={(e) => onChange({ cardRadius: Number(e.target.value) })}
          />
        </label>
        <small className="builder-help">
          Thành phần và nội dung dài luôn chiếm toàn chiều ngang; điện thoại dùng một cột. Chỉnh chữ và màu tại Nhãn
          thông số / Nội dung thông số.
        </small>
      </details>

      <details open={openSection === "media" || undefined}>
        <summary>Khung ảnh nội dung</summary>
        <label className="builder-field">
          Tỷ lệ khung ảnh
          <select
            value={config.imageRatio}
            onChange={(e) => onChange({ imageRatio: e.target.value })}
          >
            <option value="3 / 2">3 : 2 (Ngang chuẩn)</option>
            <option value="16 / 9">16 : 9 (Rộng)</option>
            <option value="4 / 3">4 : 3 (Cân đối)</option>
            <option value="4 / 5">4 : 5 (Dọc nhẹ)</option>
            <option value="1 / 1">1 : 1 (Vuông)</option>
            <option value="auto">Tự động theo ảnh</option>
          </select>
        </label>
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
        <ColorField
          label="Màu viền khung ảnh"
          value={value.imageBorderColor}
          fallback="#f3dce5"
          onChange={(imageBorderColor) => onChange({ imageBorderColor })}
        />
        <ColorField
          label="Màu nền khung ảnh"
          value={value.imageBg}
          fallback="#fff5f8"
          onChange={(imageBg) => onChange({ imageBg })}
        />
        <label className="builder-field">
          Đổ bóng khung ảnh
          <select
            value={config.imageShadow}
            onChange={(e) => onChange({ imageShadow: e.target.value })}
          >
            <option value="none">Không đổ bóng</option>
            <option value="soft">Nhẹ nhàng</option>
            <option value="medium">Vừa phải</option>
            <option value="elevated">Nổi bật</option>
          </select>
        </label>
        <label className="builder-field">
          Khoảng cách giữa các khối (px)
          <input
            type="number"
            min={0}
            max={64}
            value={config.blockGap}
            onChange={(e) => onChange({ blockGap: Number(e.target.value) })}
          />
        </label>
      </details>

      <details open={openSection === "caption" || undefined}>
        <summary>Khung chú thích dưới ảnh</summary>
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
            Viền chú thích (px)
            <input
              type="number"
              min={0}
              max={4}
              value={config.captionBorderWidth}
              onChange={(e) => onChange({ captionBorderWidth: Number(e.target.value) })}
            />
          </label>
          <label className="builder-field">
            Bo góc chú thích (px)
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
        <StyleTypographyBlock
          title="Kiểu chữ chú thích mặc định"
          style={config.captionStyle}
          onStyleChange={(patch) => onChange({ captionStyle: { ...config.captionStyle, ...patch } })}
        />
      </details>

      <details open={openSection === "motion" || openSection === "media" || undefined}>
        <summary>Hiệu ứng tải (Skeleton / Shimmer) & Chuyển cảnh</summary>
        <label className="builder-field">
          Hiệu ứng tải ảnh (Skeleton)
          <select
            value={config.skeletonEffect}
            onChange={(e) => onChange({ skeletonEffect: e.target.value })}
          >
            <option value="shimmer">Shimmer ánh sáng</option>
            <option value="pulse">Nhịp thở nhẹ</option>
            <option value="static">Nền tĩnh</option>
          </select>
        </label>
        <ColorField
          label="Màu nền Skeleton"
          value={value.skeletonBaseColor}
          fallback="#fcebf1"
          onChange={(skeletonBaseColor) => onChange({ skeletonBaseColor })}
        />
        <ColorField
          label="Màu ánh Shimmer"
          value={value.skeletonHighlightColor}
          fallback="#fff8fb"
          onChange={(skeletonHighlightColor) => onChange({ skeletonHighlightColor })}
        />
        <label className="builder-field">
          Hiệu ứng chuyển tab
          <select
            value={config.tabTransition}
            onChange={(e) => onChange({ tabTransition: e.target.value })}
          >
            <option value="slide-up">Trượt nhẹ lên</option>
            <option value="fade">Hiện dần</option>
            <option value="zoom">Phóng nhẹ</option>
            <option value="none">Tắt hiệu ứng</option>
          </select>
        </label>
        <label className="builder-field">
          Hiệu ứng hiện ảnh khi cuộn
          <select
            value={config.revealEffect}
            onChange={(e) => onChange({ revealEffect: e.target.value })}
          >
            <option value="rise">Trượt nhẹ lên</option>
            <option value="fade">Hiện dần</option>
            <option value="zoom">Phóng nhẹ</option>
            <option value="none">Tắt hiệu ứng</option>
          </select>
        </label>
        <label className="builder-field">
          Tốc độ hiệu ứng
          <select
            value={config.motionDuration}
            onChange={(e) => onChange({ motionDuration: Number(e.target.value) })}
          >
            <option value={260}>Nhanh (260 ms)</option>
            <option value={450}>Mượt (450 ms)</option>
            <option value={700}>Chậm êm (700 ms)</option>
          </select>
        </label>
      </details>
    </SettingGroup>
  );
}

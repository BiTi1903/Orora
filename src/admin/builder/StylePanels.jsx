import { NavbarSettings } from "./NavbarPanels";
import { PhilosophySettings } from "./PhilosophyPanels";
import { TickerSettings } from "./TickerPanels";
import { FeaturesSettings } from "./FeaturesPanels";
import { ReviewsSettings } from "./ReviewsPanels";
import { FooterSettings } from "./FooterPanels";
import { ProductDetailSettings } from "./ProductDetailPanels";
import { CollectionSettings } from "./CollectionPanels";
import { HeroSettings } from "./HeroPanels";
import { SectionSettings, ImageSettings, TextSettings, StatsSettings } from "./AboutPanels";
import { HERO_FIELD_MAP, COLLECTION_FIELD_MAP, PRODUCT_DETAIL_FIELD_MAP, FEATURES_TEXT_MAP, REVIEWS_TEXT_MAP, FOOTER_FIELD_MAP } from "./registry";

export function StylePanel({
  section,
  selected,
  data,
  about,
  hero,
  collection,
  productDetail,
  detailProduct,
  features,
  reviews,
  footer,
  ticker,
  navbar,
  philosophy,
  onChange,
  onStyleChange,
}) {
  if (!data) {
    return (
      <div className="builder-empty">
        Chọn một thành phần trên preview.
      </div>
    );
  }

  const aboutTitleMap = {
    section: "Phần Câu chuyện",
    label: "Nhãn nhỏ",
    title: "Tiêu đề",
    highlight: "Chữ nổi bật",
    text: "Nội dung",
    image: "Hình ảnh",
    stats: "Số liệu",
  };

  const statMatch =
    section === "about" &&
    typeof selected === "string" &&
    selected.match(/^(statValue|statLabel):(\d+)$/);

  const sideLabel =
    section === "hero"
      ? data.meta?.label || HERO_FIELD_MAP[selected]?.label || selected
      : section === "collection"
      ? data.meta?.label || COLLECTION_FIELD_MAP[selected]?.label || selected
      : section === "productdetail"
      ? data.meta?.label ||
        PRODUCT_DETAIL_FIELD_MAP[selected]?.label ||
        selected
      : section === "features"
      ? data.meta?.label || FEATURES_TEXT_MAP[selected]?.label || selected
      : section === "reviews"
      ? data.meta?.label || REVIEWS_TEXT_MAP[selected]?.label || selected
      : section === "footer"
      ? data.meta?.label || FOOTER_FIELD_MAP[selected]?.label || selected
      : section === "ticker"
      ? data.meta?.label || selected
      : statMatch
      ? `${statMatch[1] === "statValue" ? "Chữ lớn (đồng bộ)" : "Chữ nhỏ (đồng bộ)"} #${Number(statMatch[2]) + 1}`
      : aboutTitleMap[selected] || selected;

  return (
    <div className="builder-settings-inner">
      <div className="builder-panel-title">
        <span>Properties</span>
        <small>{sideLabel}</small>
      </div>

      {section === "hero" && (
        <HeroSettings
          selected={selected}
          data={data}
          hero={hero}
          onChange={onChange}
        />
      )}

      {section === "collection" && (
        <CollectionSettings
          selected={selected}
          data={data}
          collection={collection}
          onChange={onChange}
          onStyleChange={onStyleChange}
        />
      )}

      {section === "productdetail" && (
        <ProductDetailSettings
          selected={selected}
          data={data}
          productDetail={productDetail}
          detailProduct={detailProduct}
          onChange={onChange}
          onStyleChange={onStyleChange}
        />
      )}

      {section === "features" && (
        <FeaturesSettings
          selected={selected}
          data={data}
          features={features}
          onChange={onChange}
          onStyleChange={onStyleChange}
        />
      )}

      {section === "reviews" && (
        <ReviewsSettings
          selected={selected}
          data={data}
          reviews={reviews}
          onChange={onChange}
          onStyleChange={onStyleChange}
        />
      )}

      {section === "footer" && (
        <FooterSettings
          selected={selected}
          data={data}
          footer={footer}
          onChange={onChange}
          onStyleChange={onStyleChange}
        />
      )}

      {section === "navbar" && (
        <NavbarSettings
          selected={selected}
          navbar={navbar}
          onChange={onChange}
          onStyleChange={onStyleChange}
        />
      )}

      {section === "philosophy" && (
        <PhilosophySettings
          selected={selected}
          philosophy={philosophy}
          onChange={onChange}
          onStyleChange={onStyleChange}
        />
      )}

      {section === "ticker" && (
        <TickerSettings
          selected={selected}
          data={data}
          ticker={ticker}
          onChange={onChange}
          onStyleChange={onStyleChange}
        />
      )}

      {section === "about" && data.type === "section" && (
        <SectionSettings
          data={data.data}
          onChange={onChange}
        />
      )}

      {section === "about" && data.type === "image" && (
        <ImageSettings
          data={data.data}
          onChange={onChange}
        />
      )}

      {section === "about" && data.type === "stats" && (
        <StatsSettings
          stats={about.stats}
          about={about}
          onChange={onChange}
        />
      )}

      {section === "about" && data.type === "statText" && (
        <StatTextSettings
          data={data.data}
          onChange={onChange}
          onStyleChange={onStyleChange}
        />
      )}

      {section === "about" && data.type === "text" && (
        <TextSettings
          selected={selected}
          data={data.data}
          onChange={onChange}
          onStyleChange={onStyleChange}
        />
      )}
    </div>
  );
}

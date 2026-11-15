import {inspectorElements} from "./element-options";
import {PAGE_SECTIONS} from "../../lib/page-sections";
import Inspector,{InspectorGroup} from "./Inspector";
import HeroGlassSettings from "./HeroGlassSettings";
import InformationTabsSettings from "./InformationTabsSettings";
import MobileDetailSettings from "./MobileDetailSettings";
import DesktopCardSettings from './DesktopCardSettings';
import ReviewCardSettings from './ReviewCardSettings';
import CatalogFilterSettings from "./CatalogFilterSettings";
import ProductLoadErrorSettings from "./ProductLoadErrorSettings";
import CollectionCarouselSettings from "../CollectionCarouselSettings";
import { NavbarSettings,NavbarSectionSettings } from "./NavbarPanels";
import { PhilosophySettings } from "./PhilosophyPanels";
import { TickerSettings } from "./TickerPanels";
import { FeaturesSettings } from "./FeaturesPanels";
import { ReviewsSettings } from "./ReviewsPanels";
import { FooterSettings } from "./FooterPanels";
import { NewsletterSettings } from "./NewsletterPanels";
import { ProductDetailSettings } from "./ProductDetailPanels";
import { CollectionSettings } from "./CollectionPanels";
import { HeroSettings } from "./HeroPanels";
import { SectionSettings, ImageSettings, TextSettings, StatsSettings, StatTextSettings } from "./AboutPanels";
import { HERO_FIELD_MAP, COLLECTION_FIELD_MAP, PRODUCT_DETAIL_FIELD_MAP, FEATURES_TEXT_MAP, REVIEWS_TEXT_MAP, FOOTER_FIELD_MAP, NEWSLETTER_FIELD_MAP } from "./registry";

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
  newsletter,
  footer,
  ticker,
  navbar,
  philosophy,
  onChange,
  onStyleChange,
  selectionVersion=0,
  onSelect,
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
      : section === "newsletter"
      ? data.meta?.label || NEWSLETTER_FIELD_MAP[selected]?.label || selected
      : section === "ticker"
      ? data.meta?.label || selected
      : statMatch
      ? `${statMatch[1] === "statValue" ? "Chữ lớn (đồng bộ)" : "Chữ nhỏ (đồng bộ)"} #${Number(statMatch[2]) + 1}`
      : aboutTitleMap[selected] || selected;

  const settings=section==='navbar'?<NavbarSectionSettings navbar={navbar} onChange={onChange} includeCart={selected!=="navCart"}/>:section==='hero'?<HeroGlassSettings hero={hero} onChange={onChange}/>:section==='collection'?<><InspectorGroup title="Nút và giá thẻ sản phẩm"><DesktopCardSettings value={collection.productCardStyles?.desktopActions} onChange={patch=>onChange({_styleGroup:'productCardStyles',_styleKey:'desktopActions',style:patch})}/></InspectorGroup>
<InspectorGroup title="Bộ lọc sản phẩm"><CatalogFilterSettings value={collection.collectionStyles?.filters} onChange={patch=>onChange({_styleGroup:"collectionStyles",_styleKey:"filters",style:patch})}/></InspectorGroup>
<InspectorGroup title="Trạng thái tải sản phẩm"><ProductLoadErrorSettings value={collection.collectionStyles?.loadError} onChange={patch=>onChange({_styleGroup:"collectionStyles",_styleKey:"loadError",style:patch})}/></InspectorGroup>
<InspectorGroup title="Dãy sản phẩm trượt"><CollectionCarouselSettings value={collection.collectionStyles?.carousel} onChange={patch => onChange({ _styleGroup: "collectionStyles", _styleKey: "carousel", style: patch })} /></InspectorGroup></>:section==='productdetail'?<><InspectorGroup title="Trạng thái tải sản phẩm"><ProductLoadErrorSettings value={productDetail.loadError||{}} onChange={patch=>onChange({loadError:{...productDetail.loadError,...patch}})}/></InspectorGroup>
<InspectorGroup title="Các tab thông tin sản phẩm"><InformationTabsSettings value={productDetail.informationTabs} onChange={patch=>onChange({informationTabs:{...productDetail.informationTabs,...patch}})}/></InspectorGroup>
<InspectorGroup title="Bố cục và chữ trên điện thoại"><MobileDetailSettings value={productDetail.mobileLayout} onChange={patch=>onChange({mobileLayout:{...productDetail.mobileLayout,...patch}})}/></InspectorGroup></>:section==='reviews'?<><InspectorGroup title="Khung thẻ đánh giá"><ReviewCardSettings value={reviews.testimonialsStyles?.card} onChange={patch=>onChange({testimonialsStyles:{...reviews.testimonialsStyles,card:{...reviews.testimonialsStyles?.card,...patch}}})}/></InspectorGroup></>:null;
  return (
    <div className="builder-settings-inner">
      <Inspector sourceNote={(section==='productdetail'&&['pdName','pdPrice','pdDescription','pdImage','pdThumbs'].includes(selected))||(section==='collection'&&String(selected).startsWith('card'))?'Nội dung, ảnh và giá sản phẩm sửa trong mục Sản phẩm. Bộ chỉnh này thay đổi cách hiển thị.':undefined} elementOptions={inspectorElements(section,{navbar,about,features,reviews})} selectedElement={selected} onSelect={onSelect} sectionLabel={PAGE_SECTIONS.find(item=>item.key===section)?.label} title={section==='navbar'?(selected==='navLogo'?'Logo navbar':selected==='navCart'?'Giỏ hàng navbar':'Liên kết navbar'):sideLabel} selectionKey={`${section}:${selected}:${selectionVersion}`} settings={settings} selected={<>
      {section === "hero" && (
        <HeroSettings
          selected={selected}
          data={data}
          hero={hero}
          onChange={onChange}
        />
      )}

      {section === "collection" && (
        <>
        <CollectionSettings
          selected={selected}
          data={data}
          collection={collection}
          onChange={onChange}
          onStyleChange={onStyleChange}
        />
        </>
      )}

      {section === "productdetail" && (
        <>
        <ProductDetailSettings
          selected={selected}
          data={data}
          productDetail={productDetail}
          detailProduct={detailProduct}
          onChange={onChange}
          onStyleChange={onStyleChange}
        />
        </>
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
        <>
        <ReviewsSettings
          selected={selected}
          data={data}
          reviews={reviews}
          onChange={onChange}
          onStyleChange={onStyleChange}
        />
        </>
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

      {section === "newsletter" && (
        <NewsletterSettings
          selected={selected}
          data={data}
          newsletter={newsletter}
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
      </>}/>
    </div>
  );
}

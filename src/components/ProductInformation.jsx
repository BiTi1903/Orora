import { useId, useState } from "react";
import ProductContent from "./ProductContent";
import {informationTabSettings, isLongSpecification} from "../lib/product-information";
import { groupedProductSections, PRODUCT_CONTENT_GROUPS } from "../lib/product-content";

export default function ProductInformation({ sections, css, preview, select, selectedClass, textProps = () => ({}), settings={} }) {
  const groups = groupedProductSections(sections), id = useId(), config=informationTabSettings(settings);
  const [active, setActive] = useState(config.defaultTab);
  const keys=Object.keys(PRODUCT_CONTENT_GROUPS);
  const handleKey=(event)=>{
    const current=keys.indexOf(active);
    const next=event.key==='ArrowRight'?(current+1)%keys.length:event.key==='ArrowLeft'?(current+keys.length-1)%keys.length:event.key==='Home'?0:event.key==='End'?keys.length-1:null;
    if(next===null)return;
    event.preventDefault();setActive(keys[next]);
    event.currentTarget.parentElement.querySelectorAll('[role="tab"]')[next]?.focus({preventScroll:true});
  };
  return <div className="product-detail-sections product-information" aria-label="Thông tin chi tiết sản phẩm" style={{"--spec-columns":config.specColumns,"--spec-radius":`${config.cardRadius}px`}}>
    <div className="product-information-nav" role="tablist" aria-label="Nội dung sản phẩm">{keys.map(key=><button type="button" role="tab" key={key} id={`${id}-tab-${key}`} aria-selected={active===key} aria-controls={`${id}-${key}`} tabIndex={active===key?0:-1} onClickCapture={()=>setActive(key)} onKeyDown={handleKey}><strong {...textProps({description:"pdTabDescription",specifications:"pdTabSpecifications",usage:"pdTabUsage"}[key], "navigation")}>{config.labels[key]}</strong></button>)}</div>
    {Object.entries(PRODUCT_CONTENT_GROUPS).map(([key, title]) => <section key={key} id={`${id}-${key}`} data-content-group={key} role="tabpanel" hidden={active!==key} aria-labelledby={`${id}-tab-${key}`} tabIndex={0} className="product-section product-information-section" >
      <div className="product-information-heading"><h2 className={selectedClass("pdAboutTitle")} data-builder-key={preview ? "pdAboutTitle" : undefined} onClick={select("pdAboutTitle")} style={{ ...css("sectionTitle"), ...css("aboutTitle") }}>{config.labels[key]}</h2></div>
      {!groups[key].length && <p className="product-information-empty">{config.emptyText}</p>}
      <div className={key === "specifications" ? "product-specification-grid" : "product-information-prose"}>{groups[key].map((section, index) => key === "specifications" ? <div className={`product-detail-row${isLongSpecification(section) ? " product-detail-row--long" : ""}${section.title?.trim() ? "" : " product-detail-row--unlabeled"}`} key={section.id || index}>{section.title?.trim() && <span className={selectedClass("pdRowLabel")} data-builder-key={preview ? "pdRowLabel" : undefined} onClick={select("pdRowLabel")} style={css("rowLabel")}>{section.title}</span>}<div className={`product-detail-value ${selectedClass("pdRowValue")}`} data-builder-key={preview ? "pdRowValue" : undefined} onClick={select("pdRowValue")} style={css("rowValue")}><ProductContent text={section.content} /></div></div> : <div className="product-information-copy" key={section.id || index}>{section.title && section.title.toLocaleLowerCase("vi").trim() !== title.toLocaleLowerCase("vi") && <h3 {...textProps("pdSubheading", "subheading")}>{section.title}</h3>}<div className={`product-section-content ${selectedClass("pdBody")}`} data-builder-key={preview ? "pdBody" : undefined} onClick={select("pdBody")} style={css("body")}><ProductContent text={section.content} /></div></div>)}</div>
    </section>)}
  </div>;
}

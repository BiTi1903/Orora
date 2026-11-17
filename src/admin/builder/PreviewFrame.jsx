import {ButtonIconProvider} from "../../components/ButtonIcon";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {installButtonPressFeedback} from "../../lib/button-press";
import {applyGlassSurfaces,watchGlassTabs} from "../../lib/glass-surfaces";
import "../../styles/mobile-glass.css";

const STATIC_STYLE = `
*, *::before, *::after { animation: none !important; transition: none !important; scroll-behavior: auto !important; }
html { scrollbar-width: none; } body { margin: 0; }
[data-builder-key] { cursor: pointer; }
.builder-selected { outline: 2px solid #b8446d !important; outline-offset: 3px; }
.reveal, .hero-letter, .hero-title-line, .rotator-box em { opacity: 1 !important; transform: none !important; }
.gallery-item:hover, .gallery-image.tilt, .gallery-image:hover img, .gallery-item:hover .product-slideshow img, .hero-btn:hover { transform: none !important; }
.st-word { color: var(--st-on, var(--plum)); } .st-word.accent { color: var(--st-accent, var(--rose)); }
.gallery { padding: 14px 0 36px; } .gallery > :nth-child(n+4) { display: none; }
@media(max-width: 768px) { .gallery > :nth-child(n+3) { display: none; } }
`;

export default function PreviewFrame({ device, children, surfaces, zoom="fit", selectedKey }) {
  const host = useRef(null);
  const [frameDocument, setFrameDocument] = useState(null);
  const [availableWidth, setAvailableWidth] = useState(0);
  const width = device === "mobile" ? 390 : 1440;
  const height = 900;
  const scale = zoom==="actual" ? 1 : availableWidth > 0 ? Math.min(1, availableWidth / width) : 1;

  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      const nextWidth = Math.floor(entry.contentRect.width);
      if (nextWidth > 0) setAvailableWidth(previous => previous === nextWidth ? previous : nextWidth);
    });
    observer.observe(host.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!frameDocument) return;
    const mirrors = new Map();
    const staticStyle = frameDocument.createElement("style");
    staticStyle.setAttribute("data-preview-style", "");
    staticStyle.textContent = STATIC_STYLE;
    frameDocument.head.append(staticStyle);
    const syncStyles = () => {
      const sources = [...document.head.querySelectorAll('style, link[rel="stylesheet"]')];
      for (const [source, mirror] of mirrors) {
        if (!sources.includes(source)) { mirror.clone.remove(); mirrors.delete(source); }
      }
      let next = staticStyle;
      for (const source of sources.reverse()) {
        const signature = source.outerHTML;
        let mirror = mirrors.get(source);
        if (!mirror || mirror.signature !== signature) {
          const clone = source.cloneNode(true);
          clone.setAttribute("data-preview-style", "");
          if (mirror) mirror.clone.replaceWith(clone);
          mirror = { clone, signature };
          mirrors.set(source, mirror);
        }
        if (mirror.clone.nextSibling !== next) frameDocument.head.insertBefore(mirror.clone, next);
        next = mirror.clone;
      }
    };
    syncStyles();
    const observer = new MutationObserver(syncStyles);
    observer.observe(document.head, { childList: true, subtree: true, characterData: true, attributes:true, attributeFilter:["rel","href"] });
    const preventNavigation = (event) => { if (event.target.closest("a")) event.preventDefault(); };
    frameDocument.addEventListener("click", preventNavigation);
    return () => { observer.disconnect(); mirrors.forEach(({ clone }) => clone.remove()); staticStyle.remove(); frameDocument.removeEventListener("click", preventNavigation); };
  }, [frameDocument]);

  const surfaceKey=JSON.stringify(surfaces || {});
  useEffect(() => {
    if (!frameDocument) return;
    const clear=applyGlassSurfaces(frameDocument.documentElement, JSON.parse(surfaceKey));
    const stopTabs=watchGlassTabs(frameDocument);
    const stopPress=installButtonPressFeedback(frameDocument,JSON.parse(surfaceKey));
    return()=>{stopPress();stopTabs();clear();};
  }, [frameDocument, surfaceKey]);

  useEffect(()=>{
    if(!frameDocument||!selectedKey)return;
    const node=[...frameDocument.querySelectorAll('[data-builder-key]')].find(element=>element.dataset.builderKey===selectedKey);
    if(!node)return;
    const view=frameDocument.defaultView,box=node.getBoundingClientRect();
    if(box.top<0||box.top>view.innerHeight-60)view.scrollTo({top:Math.max(0,view.scrollY+box.top-60),behavior:'instant'});
  },[frameDocument,selectedKey]);

  return (
    <div className="builder-frame-host" ref={host}>
      <div style={{ width: width * scale, height: height * scale, margin: "0 auto", position: "relative", overflow: "hidden", flexShrink: 0 }}>
        <iframe title={`Xem trước ${device === "mobile" ? "Mobile 390px" : "Desktop 1440px"}`} className="builder-preview-frame"
          style={{ position: "absolute", top: 0, left: 0, width, height, transform: `scale(${scale})`, transformOrigin: "top left" }}
          srcDoc={'<!doctype html><html lang="vi"><head><meta name="viewport" content="width=device-width,initial-scale=1" /></head><body><div id="root"><main id="preview-root"></main></div></body></html>'}
          onLoad={(event) => setFrameDocument(event.currentTarget.contentDocument)} />
      </div>
      {frameDocument && createPortal(<ButtonIconProvider value={surfaces?.buttonIcons}>{children}</ButtonIconProvider>, frameDocument.getElementById("preview-root"))}
    </div>
  );
}

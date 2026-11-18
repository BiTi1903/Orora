import { useRef, useState } from 'react';
import ModalDialog from './ModalDialog';
import { cdnSrc } from '../lib/image-cdn';

const distance = ([first, second]) => Math.hypot(first.x - second.x, first.y - second.y);
const clampZoom = value => Math.min(4, Math.max(1, value));

export default function ProductImageLightbox({ src, name, onClose }) {
  const [zoom, setZoom] = useState(1);
  const [loadLarge, setLoadLarge] = useState(false);
  function changeZoom(value) {
    const next = clampZoom(value);
    if (next >= 2) setLoadLarge(true);
    setZoom(next);
  }
  const pointers = useRef(new Map());
  const pinch = useRef(null);
  function release(event) {
    pointers.current.delete(event.pointerId);
    pinch.current = null;
  }

  return <ModalDialog title={name} onClose={onClose} className="product-lightbox">
    <div className="product-lightbox-tools" aria-label="Điều khiển phóng to">
      <button type="button" disabled={zoom <= 1} onClick={() => changeZoom(zoom - .5)}>Thu nhỏ</button>
      <button type="button" disabled={zoom >= 4} onClick={() => changeZoom(zoom + .5)}>Phóng to</button>
      <button type="button" disabled={zoom === 1} onClick={() => setZoom(1)}>Về 100%</button>
    </div>
    <div className="product-lightbox-view" tabIndex={0} role="region" aria-label="Ảnh sản phẩm phóng to" data-zoomed={zoom > 1} onPointerDown={event => {
      if (event.pointerType !== 'touch' && (event.button !== 0 || zoom <= 1)) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (pointers.current.size === 2) pinch.current = { length: distance([...pointers.current.values()]), zoom };
    }} onPointerMove={event => {
      if (!pointers.current.has(event.pointerId)) return;
      const previous = pointers.current.get(event.pointerId);
      pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (pointers.current.size === 1 && zoom > 1) {
        event.currentTarget.scrollBy(previous.x - event.clientX, previous.y - event.clientY);
      }
      if (pinch.current?.length && pointers.current.size === 2) {
        changeZoom(pinch.current.zoom * distance([...pointers.current.values()]) / pinch.current.length);
      }
    }} onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release}>
      <img src={cdnSrc(src, { w: loadLarge ? 2400 : 1600, q: "auto:best" })} alt={name} draggable={false} style={{ width: `${zoom * 100}%` }} />
    </div>
  </ModalDialog>;
}

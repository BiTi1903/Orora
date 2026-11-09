import { useId } from "react";

export default function CollectionCarouselSettings({ value = {}, onChange }) {
  const id = useId();
  const interval = Number(value.intervalSeconds);
  const seconds = Number.isFinite(interval) && interval >= 1 && interval <= 30 ? interval : 3;
  return <fieldset className="slogan-design-editor collection-carousel-settings">
    <legend>Chuyển sản phẩm tự động</legend>
    <label className="admin-check" htmlFor={`${id}-enabled`}><input id={`${id}-enabled`} type="checkbox" checked={value.autoPlay !== false} onChange={event => onChange({ autoPlay: event.target.checked })} />Tự động chuyển sản phẩm khi cuộn tới</label>
    <div className="admin-field builder-field"><label htmlFor={`${id}-interval`}>Thời gian giữa hai lần chuyển (giây)</label><input id={`${id}-interval`} type="number" min={1} max={30} step={1} value={seconds} disabled={value.autoPlay === false} onChange={event => { const number = Number(event.target.value); onChange({ intervalSeconds: Number.isFinite(number) ? Math.min(30, Math.max(1, Math.round(number))) : 3 }); }} /></div>
    <small className="admin-muted">Mặc định 3 giây. Chỉ bắt đầu đếm khi khu vực sản phẩm xuất hiện trên màn hình; ra khỏi khu vực thì tạm dừng. Preview đứng yên để dễ chỉnh.</small>
  </fieldset>;
}

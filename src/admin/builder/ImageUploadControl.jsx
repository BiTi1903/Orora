import { lazy, Suspense, useState } from "react";

const ImageField = lazy(() => import("../ImageField"));

export default function ImageUploadControl(props) {
  const [opened, setOpened] = useState(false);
  return <details onToggle={event => { if (event.currentTarget.open) setOpened(true); }}>
    <summary>Tải ảnh lên · {props.label}</summary>
    {opened && <Suspense fallback={<p>Đang tải bộ chọn ảnh…</p>}><ImageField {...props}/></Suspense>}
  </details>;
}

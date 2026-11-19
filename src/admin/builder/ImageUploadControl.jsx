import { useState } from "react";
import ImageField from "../ImageField";

export default function ImageUploadControl(props) {
  const [opened, setOpened] = useState(false);
  return <details onToggle={event => { if (event.currentTarget.open) setOpened(true); }}>
    <summary>Tải ảnh lên · {props.label}</summary>
    {opened && <ImageField {...props}/>}
  </details>;
}

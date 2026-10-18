import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import "./index.css";

/* Các font tuỳ chọn trong admin (Playfair, Lora, Poppins...): nạp SAU khi trang đã hiện,
   để không chặn việc hiển thị. */
const EXTRA_FONTS =
  "https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&family=Lora:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Montserrat:wght@300;400;500;600;700&family=Mulish:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,500&family=Noto+Sans:wght@300;400;500;600;700&family=Noto+Serif:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Poppins:wght@300;400;500;600;700&family=Roboto:wght@300;400;500;700&display=swap";
const loadExtraFonts = () => {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = EXTRA_FONTS;
  document.head.appendChild(link);
};
if (document.readyState === "complete") loadExtraFonts();
else window.addEventListener("load", loadExtraFonts, { once: true });

ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>

    <BrowserRouter>
      <App />
    </BrowserRouter>

  </React.StrictMode>
);
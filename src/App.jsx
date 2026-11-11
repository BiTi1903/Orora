import SiteAnalytics from "./components/SiteAnalytics";

import { sectionIsEnabled } from "./lib/page-sections";
import ProductNeeds from "./components/ProductDiscovery";
import useHomeContent from "./hooks/useHomeContent";
import { lazy, Suspense, useEffect, useRef } from "react";
   import { Marquee, Features, Testimonials, Newsletter } from "./components/Extras";

import CursorSparkle from "./components/CursorSparkle"; 
import {
  Routes,
  Navigate,
  Route,
  useLocation,
} from "react-router-dom";
import BackToTop from "./components/BackToTop";
import ChatButton from "./components/ChatButton";

import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import About from "./components/About";
import Collection from "./components/Collection";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";
import Petals from "./components/Petals";
import Seo from "./components/Seo";
import ScrollText from "./components/ScrollText";
import "./App.css";
// Trang quản trị chỉ tải khi vào /admin
const ProductDetail=lazy(()=>import("./components/ProductDetail"));
const OrderTracking=lazy(()=>import("./components/OrderTracking"));
function RouteLoading(){return <section className="route-loading" role="status" aria-label="Đang tải trang"><div className="loading-placeholder"/><div className="loading-placeholder loading-line"/></section>;}
const AdminApp = lazy(() => import("./admin/AdminApp"));




function App() {

  const pageRef = useRef(null);

  const location = useLocation();
  const home = useHomeContent();
  const visibility = JSON.stringify(home.sectionVisibility || {});
  const visible = (key) => (!home.loading || (home.shellReady && ["navbar","hero","ticker"].includes(key))) && sectionIsEnabled(home,key);


  useEffect(()=>{
    if(location.pathname!=="/"||home.loading||!window.matchMedia("(min-width: 769px) and (pointer: fine) and (prefers-reduced-motion: no-preference)").matches)return;
    let cancelled=false,stop,started=false;
    const start=()=>{
      if(started)return;started=true;
      import("./lib/home-animations").then(({startHomeAnimations})=>{if(!cancelled&&pageRef.current)stop=startHomeAnimations(pageRef.current);}).catch(()=>{});
    };
    // Below-fold scroll effects need no runtime until the visitor actually scrolls.
    window.addEventListener('scroll',start,{passive:true,once:true});
    if(window.scrollY>0)start();
    return()=>{cancelled=true;window.removeEventListener('scroll',start);stop?.();};
  },[location.pathname,home.loading,visibility]);


  return (
    <>

      <SiteAnalytics />
      <Seo />
      <ScrollToTop />

      <Routes>
<Route
          path="/admin"
          element={
            <Suspense fallback={<RouteLoading/>}>
              <AdminApp />
            </Suspense>
          }
        />
        {/* =========================
            HOME
        ========================= */}

        <Route
          path="/"
          element={
            <main ref={pageRef}>

              {visible("navbar") && <Navbar />}

              <div className={visible("hero") ? "home-first-screen" : undefined}>
                {visible("hero") && <Hero />}
                {visible("ticker") && <Marquee />}
              </div>

              {visible("about") && <About />}

              {visible("productneeds") && <ProductNeeds />}
              {visible("collection") && <Collection />}
              {visible("philosophy") && <ScrollText />}

              {visible("features") && <Features />}
              {/* <Ritual /> */}
                 {visible("reviews") && <Testimonials />}
   {visible("newsletter") && <Newsletter />}
              {visible("footer") && <Footer />}
<BackToTop />
<CursorSparkle />
<Petals />
            </main>
          }
        />


        <Route path="/tra-cuu-don-hang" element={<main>{visible("navbar") && <Navbar />}<Suspense fallback={<RouteLoading/>}><OrderTracking /></Suspense>{visible("footer") && <Footer />}</main>} />
        <Route path="/san-pham" element={<Navigate to="/#shop" replace />} />
        <Route path="/ve-orora" element={<Navigate to="/#about" replace />} />
        <Route path="/lien-he" element={<Navigate to="/#contact" replace />} />
        <Route path="*" element={<main>{visible("navbar") && <Navbar />}<h1 className="page-heading">Trang không tồn tại</h1>{visible("footer") && <Footer />}</main>} />

        {/* =========================
            PRODUCT DETAIL
        ========================= */}

        <Route
          path="/product/:id"
          element={
            <main>

              {visible("navbar") && <Navbar />}

              {visible("productdetail") ? <Suspense fallback={<RouteLoading/>}><ProductDetail /></Suspense> : !home.loading && <section className="product-not-found"><h1>Trang chi tiết sản phẩm đang tạm ẩn</h1><a href="/">← Về trang chủ</a></section>}

              {visible("footer") && <Footer />}
            </main>
          }
        />


      </Routes>
      {!location.pathname.startsWith("/admin") && <ChatButton />}

    </>
  );
}


export default App;

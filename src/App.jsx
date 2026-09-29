import { useLayoutEffect, useRef } from "react";
   import { Marquee, Features, Ritual, Testimonials, Newsletter } from "./components/Extras";
     import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import {
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import ProductDetail from "./components/ProductDetail";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import About from "./components/About";
import Collection from "./components/Collection";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";

import "./App.css";

gsap.registerPlugin(ScrollTrigger);


function App() {

  const pageRef = useRef(null);

  const location = useLocation();


  useLayoutEffect(() => {

    // Chỉ chạy animation ở trang chủ
    if (location.pathname !== "/") {
      return;
    }


    const ctx = gsap.context(() => {


      /* =========================
         HERO INTRO
      ========================= */

      const intro = gsap.timeline({
        defaults: {
          ease: "power4.out",
        },
      });

      intro
        .from(".navbar", {
          y: -50,
          opacity: 0,
          duration: 1,
        })

        .from(
          ".small-text",
          {
            y: 50,
            opacity: 0,
            duration: 0.8,
          },
          "-=0.5"
        )

        .from(
          ".hero-title-line",
          {
            y: 140,
            opacity: 0,
            duration: 1.1,
            stagger: 0.15,
          },
          "-=0.5"
        )

        .from(
          ".description",
          {
            y: 40,
            opacity: 0,
            duration: 0.8,
          },
          "-=0.6"
        )

        .from(
          ".explore",
          {
            y: 40,
            opacity: 0,
            duration: 0.8,
          },
          "-=0.5"
        )

        .from(
          ".scroll",
          {
            opacity: 0,
            duration: 1,
          },
          "-=0.3"
        );


      /* =========================
         HERO PARALLAX
      ========================= */

      gsap.to(".hero", {
        backgroundPosition: "50% 70%",

        scrollTrigger: {
          trigger: ".hero",
          start: "top top",
          end: "bottom top",
          scrub: 1,
        },
      });


      /* =========================
         ABOUT IMAGE
      ========================= */

      gsap.from(".about-image", {
        scale: 1.3,

        scrollTrigger: {
          trigger: ".about",
          start: "top bottom",
          end: "center center",
          scrub: 1,
        },
      });


      /* =========================
         ABOUT TEXT
      ========================= */

      gsap.from(".about-content", {
        y: 120,
        opacity: 0,

        scrollTrigger: {
          trigger: ".about",
          start: "top 80%",
          end: "center 45%",
          scrub: 1,
        },
      });


      /* =========================
         ABOUT LABEL
      ========================= */

      gsap.from(".about-label", {
        x: -80,
        opacity: 0,

        scrollTrigger: {
          trigger: ".about",
          start: "top 80%",
          end: "center 50%",
          scrub: 1,
        },
      });


      /* =========================
         COLLECTION TITLE
      ========================= */

      const collectionTitle = gsap.timeline({
        scrollTrigger: {
          trigger: ".collection",
          start: "top 75%",
          end: "top 30%",
          scrub: 1,
        },
      });

      collectionTitle

        .from(".collection-label", {
          x: -80,
          opacity: 0,
        })

        .from(
          ".collection-title-line",
          {
            y: 130,
            opacity: 0,
            stagger: 0.15,
          },
          "-=0.2"
        );


      /* =========================
         GALLERY IMAGE
      ========================= */

      gsap.utils
        .toArray(".gallery-item")
        .forEach((item) => {

          gsap.from(item, {
            y: 150,
            opacity: 0,

            scrollTrigger: {
              trigger: item,
              start: "top 90%",
              end: "top 55%",
              scrub: 1,
            },
          });


          const image = item.querySelector("img");

          if (image) {

            gsap.fromTo(
              image,

              {
                scale: 1.25,
              },

              {
                scale: 1,

                scrollTrigger: {
                  trigger: item,
                  start: "top 90%",
                  end: "top 40%",
                  scrub: 1,
                },
              }
            );

          }


          const info = item.querySelector(".gallery-info");

          if (info) {

            gsap.from(info, {
              y: 40,
              opacity: 0,

              scrollTrigger: {
                trigger: item,
                start: "top 70%",
                end: "top 45%",
                scrub: 1,
              },
            });

          }

        });


      /* =========================
         COLLECTION BOTTOM
      ========================= */

      gsap.from(".collection-bottom", {
        y: 60,
        opacity: 0,

        scrollTrigger: {
          trigger: ".collection-bottom",
          start: "top 90%",
          end: "top 60%",
          scrub: 1,
        },
      });


      /* =========================
         REFRESH SCROLLTRIGGER
      ========================= */

      requestAnimationFrame(() => {
        ScrollTrigger.refresh();
      });


    }, pageRef);


    return () => {
      ctx.revert();
    };


  }, [location.pathname]);


  return (
    <>

      <ScrollToTop />

      <Routes>


        {/* =========================
            HOME
        ========================= */}

        <Route
          path="/"
          element={
            <main ref={pageRef}>

              <Navbar />

              <Hero />
   <Marquee />

              <About />

              <Collection />
              <Features />
              <Ritual />
                 <Testimonials />
   <Newsletter />
              <Footer />

            </main>
          }
        />


        {/* =========================
            PRODUCT DETAIL
        ========================= */}

        <Route
          path="/product/:id"
          element={
            <main>

              <Navbar />

              <ProductDetail />

              <Footer />

            </main>
          }
        />


      </Routes>

    </>
  );
}


export default App;
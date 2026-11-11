# PageSpeed follow-up — 11 November 2026

User-provided reports:
- https://pagespeed.web.dev/analysis/https-ororavn-com/4q009ym0wu?form_factor=mobile
- https://pagespeed.web.dev/analysis/https-ororavn-com/4q009ym0wu?form_factor=desktop

Screenshots show mobile performance 78 (FCP 1.5 s, LCP 4.9 s, TBT 0 ms, CLS 0) and desktop 94 (FCP/LCP 0.2 s, TBT 40 ms, CLS 0). Audits estimate 438/419 KiB image opportunities and 137/138 KiB unused JS. These are provided baseline results, not measurements of this patch. The execution proxy denies access to PageSpeed, so the detailed LCP element and image list were not independently inspected.

Changes:
- Responsive hero candidates share the same `srcset`/`sizes` in the early preload and final picture. Mobile no longer always downloads the 900px rendition; the browser chooses by viewport and density. The 900px mobile and 1920px desktop upper renditions remain available. Existing decode/opacity handling and self-hosted fonts remain intact.
- Story/card slideshows use bounded Cloudinary renditions. Extra story slides wait until the slideshow enters view; autoplay pauses outside the viewport and respects reduced motion. Need-result images and review avatars also use bounded renditions; non-Cloudinary URLs are unchanged.
- Moved detail/tracking CSS out of the mandatory home stylesheet. Shared discovery styles retain their own stylesheet; admin previews and both routes import their required styles.
- Desktop scroll animations initialize on the first scroll, rather than idle time while the visitor is still viewing the hero. The effects runtime (113,602 raw bytes across its GSAP/ScrollTrigger chunks in this build) is deferred, not deleted. Mobile continues to skip that runtime.

Build comparison against parent commit f6a18b6:
- Entry CSS: 163,752 → 111,918 raw bytes (about 32% less).
- Entry CSS gzip: 27,889 → 19,913 bytes.
- This is an asset comparison, not a new Lighthouse score or an LCP prediction.

Browser regressions cover slideshow image gating, autoplay, one shared 800px hero request at a 390px/1.75x viewport, scroll-runtime deferral, cold/refresh font consistency, card alignment, checkout, lookup, and mobile overflow. All APIs used in these checks are mocked; no real customer records are created. A fresh production PageSpeed run after Vercel is Ready is needed to establish the actual LCP/score change.

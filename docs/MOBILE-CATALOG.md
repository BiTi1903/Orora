# Mobile navigation and catalog filters

Mobile (up to 768px) has four fixed links: Trang chủ, Danh mục, Sản phẩm, Tra cứu. Categories open a bottom sheet backed by the existing category records. The bar accounts for safe areas and its actual height, reserves space under the page, moves floating controls above it and hides while dialogs/chat are open.

Admin locations:
- Visual Builder → Navbar → Thanh điều hướng dưới — mobile: enable/disable, individual links, labels, colors, typography and sizes, with an embedded preview.
- Visual Builder → Sản phẩm / Collection → Tìm kiếm và bộ lọc sản phẩm: enable/disable, criteria, labels, typography, colors, layout and page size. Existing save flow persists nested navStyles.mobile and collectionStyles.filters.
- Category records remain managed in the existing product/category admin.

Filters support accent-insensitive product name/ID search, categories, volume, numeric price ranges, quote-only prices, sorting, and grid/carousel views. URLs retain filters and unrelated query parameters. Filtering compares actual variant prices; a 100k/500k product does not match a 200k–300k range. Unknown prices are never interpreted as zero. Grid mode paginates (12 products by default); automatic layout uses a grid when filtering or when the catalog exceeds 12 products. Filtering does not rewrite product identities or URLs.

No database migration or additional API endpoint is required. Catalog filtering currently uses the existing downloaded product list; server-side indexed pagination can be added if the catalog grows enough to make that download expensive.

Validation: 217 unit tests, ESLint, production build and bundle budget passed. Browser coverage includes the new navigation, category routing, floating chat spacing, filter combinations, pagination, and admin preview at 320/390/768/1440px. Production Firebase saves and Vercel deployment status require verification in the connected production account.

const ORIGIN = "https://ororavn.com";
const escapeXml = (value) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
export function createSitemapHandler({ getDb }) {
  return async (req, res) => {
    if (!["GET", "HEAD"].includes(req.method)) {
      res.setHeader("Allow", "GET, HEAD");
      return res.status(405).end();
    }
    try {
      const snapshot = await getDb().collection("products").get();
      const paths = ["/", "/san-pham", "/ve-orora", "/lien-he", ...snapshot.docs.filter((item) => item.data().active !== false).map((item) => `/product/${encodeURIComponent(item.id)}`)];
      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[...new Set(paths)].map((path) => `\n  <url><loc>${escapeXml(ORIGIN + path)}</loc></url>`).join("")}\n</urlset>`;
      res.setHeader("Content-Type", "application/xml; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400");
      return res.status(200).end(req.method === "HEAD" ? "" : xml);
    } catch {
      res.setHeader("Cache-Control", "no-store");
      return res.status(503).end("Sitemap temporarily unavailable");
    }
  };
}

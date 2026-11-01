const sequence = (value) => {
  const text = String(value ?? "").trim();
  const number = /^\d+$/.test(text) ? Number(text) : 0;
  return Number.isSafeInteger(number) && number > 0 && number <= 999_999_999 ? number : 0;
};
export const productNameSlug = (value) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 140).replace(/-+$/g, "");
export function nextProductSequence(products, lastNumber = 0) {
  const highest = Math.max(sequence(lastNumber), ...products.flatMap((product) => [sequence(product.number), sequence(product.id)]), 0);
  if (highest >= 999_999_999) throw new Error("Đã hết mã số sản phẩm.");
  return highest + 1;
}
const storedNumber = (product) => sequence(product.number) || sequence(product.publicId) || sequence(product.id);
export function productPublicId(product, catalog = []) {
  const existing = storedNumber(product);
  if (existing) return String(existing);
  const missing = catalog.filter((item) => !storedNumber(item)).sort((a, b) => String(a.id || a.slug || "").localeCompare(String(b.id || b.slug || "")));
  const index = missing.findIndex((item) => item.id === product.id || item === product);
  const firstUnused = Math.max(nextProductSequence(catalog), ...catalog.map((item) => storedNumber(item) + 1));
  return index < 0 ? "" : String(firstUnused + index);
}
export const productNumber = (product, catalog = []) => { const id = productPublicId(product, catalog); return id ? id.padStart(2, "0") : ""; };
const baseSlug = (product, catalog) => productNameSlug(product.name) || `san-pham-${productPublicId(product, catalog) || productNameSlug(product.id) || "orora"}`;
const aliases = (product) => [product.id, product.slug, ...(Array.isArray(product.slugAliases) ? product.slugAliases : [])].filter((value) => typeof value === "string" && value);
const canonicalSlug = (product, catalog) => {
  const base = baseSlug(product, catalog);
  const peers = catalog.filter((item) => item.id !== product.id);
  if (!peers.some((item) => baseSlug(item, catalog) === base || aliases(item).includes(base) || productPublicId(item, catalog) === base || productNumber(item, catalog) === base)) return base;
  const number = productPublicId(product, catalog) || productNameSlug(product.id);
  let suffix = `${base}-${number}`;
  if (peers.some((item) => `${baseSlug(item, catalog)}-${productPublicId(item, catalog) || productNameSlug(item.id)}` === suffix || aliases(item).includes(suffix))) {
    // Duplicate legacy sequence numbers must not produce duplicate canonical URLs.
    let hash = 2166136261;
    for (const char of String(product.id || "")) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
    suffix += `-${(hash >>> 0).toString(36)}`;
  }
  return suffix;
};
export function productSlug(product, catalog = []) {
  if (typeof product.canonicalSlug === "string" && /^[a-z0-9-]+$/.test(product.canonicalSlug)) return product.canonicalSlug;
  return canonicalSlug(product, catalog);
}
export const productPath = (product, catalog = []) => `/product/${encodeURIComponent(productSlug(product, catalog))}`;
export function withProductIdentity(products) {
  return products.map((product) => ({ ...product, publicId: productPublicId(product, products), canonicalSlug: productSlug(product, products) })).sort((a, b) => Number(a.publicId) - Number(b.publicId) || String(a.id).localeCompare(String(b.id)));
}
export function matchesProductRoute(product, identifier) {
  return aliases(product).includes(identifier) || product.canonicalSlug === identifier || productPublicId(product) === identifier || productNumber(product) === identifier;
}
export function findProductByRoute(products, identifier) {
  if (typeof identifier !== "string" || !identifier || identifier.length > 200 || (/[/\\]/.test(identifier) || identifier.includes("\0"))) return null;
  const catalog = withProductIdentity(products);
  return catalog.find((product) => product.id === identifier)
    || catalog.find((product) => product.slug === identifier || (Array.isArray(product.slugAliases) && product.slugAliases.includes(identifier)))
    || catalog.find((product) => product.canonicalSlug === identifier)
    || catalog.find((product) => product.publicId === identifier || productNumber(product) === identifier)
    || catalog.find((product) => baseSlug(product, catalog) === identifier)
    || null;
}

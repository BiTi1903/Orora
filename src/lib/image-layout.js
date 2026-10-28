export function mobileImageVars(layout = {}) {
  const height = Math.max(0, Number(layout.mobileHeight) || 0);
  const ratio = /^\d+(?:\.\d+)?\s*\/\s*\d+(?:\.\d+)?$/.test(layout.mobileAspectRatio || "") ? layout.mobileAspectRatio : "1 / 1";
  const radius = Math.max(0, Number(layout.mobileRadius ?? layout.radius ?? 16) || 0);
  const fit = ["cover", "contain", "fill"].includes(layout.mobileObjectFit) ? layout.mobileObjectFit : layout.objectFit || "cover";
  return {
    "--mobile-image-height": height > 0 ? `${height}px` : "auto",
    "--mobile-image-aspect": height > 0 ? "auto" : ratio,
    "--mobile-image-radius": `${radius}px`,
    "--mobile-image-fit": fit,
  };
}

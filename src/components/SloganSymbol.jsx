const paths = {
  sparkle: ["M12 2 15 9 22 12 15 15 12 22 9 15 2 12 9 9Z"],
  star: ["m12 2 3.1 6.3 7 .9-5.1 5 1.2 7-6.2-3.3-6.2 3.3 1.2-7-5.1-5 7-.9Z"],
  heart: ["M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"],
  flower: ["M12 8C4-3 0 9 8 12c-11 8 1 12 4 4 8 11 12-1 4-4 11-8-1-12-4-4Z", "M14 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z"],
  leaf: ["M21 3C8 1 0 9 6 17s17 2 15-14Z", "M4 21 17 8"],
  sun: ["M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0Z", "M12 1v2m0 18v2M1 12h2m18 0h2M4.2 4.2l1.4 1.4m12.8 12.8 1.4 1.4M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"],
  moon: ["M21 13A9 9 0 0 1 11 3a9 9 0 1 0 10 10Z"],
  diamond: ["m3 8 4-5h10l4 5-9 13Z", "M3 8h18M7 3l5 18 5-18"],
  quote: ["M3 12C3 7 5 4 9 3v4c-2 1-3 2-3 4h4v9H3Zm12 0c0-5 2-8 6-9v4c-2 1-3 2-3 4h4v9h-7Z"],
  crown: ["m3 6 5 5 4-8 4 8 5-5-2 14H5Z", "M5 16h14"],
  butterfly: ["M12 12C1-5-3 12 8 14c-10 7 3 11 4 1 1 10 14 6 4-1C27 12 23-5 12 12Z", "M12 10v9m0-9-2-5m2 5 2-5"],
  bow: ["M10 10C-1 0-1 20 10 14Zm4 0C25 0 25 20 14 14Zm-4 0h4v4h-4Z", "m10 14-3 7 4-1 1 2 2-8m0 0 3 7-4-1-1 2-2-8"],
  smile: ["M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z", "M8 9h.01M16 9h.01M7 14q5 6 10 0"],
  infinity: ["M12 10C9 4 1 4 1 12s8 8 11 2c3 6 11 6 11-2S15 4 12 10Zm-1 2c-4 6-8 4-8 0s4-6 8 0Zm2 0c4-6 8-4 8 0s-4 6-8 0Z"],
};

export default function SloganSymbol({ name = "sparkle", solid = true, custom = "" }) {
  if (name === "none") return null;
  if (name === "custom") return <span className="slogan-custom-symbol">{custom || "✦"}</span>;
  return <svg viewBox="0 0 24 24" fill={solid ? "currentColor" : "none"} fillRule="evenodd" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{(paths[name] || paths.sparkle).map((d, index) => <path key={d} d={d} fill={index > 0 ? "none" : undefined} stroke={index > 0 && solid && name !== "sun" ? "#fff" : undefined} />)}</svg>;
}

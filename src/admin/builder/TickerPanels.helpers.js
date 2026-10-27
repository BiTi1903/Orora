export function getTickerSelectedData(ticker, selected) {
  const map = {
    text: { label: "Câu chạy" },
    star: { label: "Dấu ✦" },
    band: { label: "Nền dải" },
  };
  const meta = map[selected] || map.text;
  return { type: selected === "band" ? "tickerBand" : "tickerText", data: ticker, meta };
}

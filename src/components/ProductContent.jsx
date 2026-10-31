import { parseProductContent } from "../lib/product-content";
export default function ProductContent({ text }) {
  return <div className="product-content">{parseProductContent(text).map((block, index) => block.type === "text" ? <div className="product-content-lines" key={index}>{block.lines.map((line, i) => <span key={i}>{i > 0 && <br />}{line.text}</span>)}</div> : block.type === "number" ? <ol key={index} start={block.lines[0].number}>{block.lines.map((line, i) => <li value={line.number} key={i}>{line.text}</li>)}</ol> : <ul key={index} className={block.type === "dash" ? "product-content-dashes" : undefined}>{block.lines.map((line, i) => <li key={i}>{line.text}</li>)}</ul>)}</div>;
}

import { parseProductContent,parseProductInline } from "../lib/product-content";
const tags={b:"strong",i:"em",u:"u",s:"s"};
function inline(nodes){return nodes.map((node,index)=>{if(typeof node==="string")return node;const Tag=tags[node.mark];return <Tag key={index}>{inline(node.children)}</Tag>;});}
export default function ProductContent({ text }) {
  return <div className="product-content">{parseProductContent(text).map((block, index) => block.type === "text" ? <div className="product-content-lines" key={index}>{block.lines.map((line, i) => <span key={i}>{i > 0 && <br />}{inline(parseProductInline(line.text))}</span>)}</div> : block.type === "number" ? <ol key={index} start={block.lines[0].number}>{block.lines.map((line, i) => <li value={line.number} key={i}>{inline(parseProductInline(line.text))}</li>)}</ol> : <ul key={index} className={block.type === "dash" ? "product-content-dashes" : undefined}>{block.lines.map((line, i) => <li key={i}>{inline(parseProductInline(line.text))}</li>)}</ul>)}</div>;
}

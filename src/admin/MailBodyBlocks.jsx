export default function MailBodyBlocks({ text, onChange, disabled }) {
  const blocks = text.trim().split(/\r?\n\s*\r?\n/).filter(Boolean);
  if (blocks.length < 2) return null;
  function move(index, direction) {
    const next = [...blocks];
    [next[index], next[index + direction]] = [next[index + direction], next[index]];
    onChange(next.join("\n\n"));
  }
  return <details className="admin-filter-panel">
    <summary>Sắp xếp các đoạn nội dung</summary>
    <ol>{blocks.map((block, index) => <li key={index} style={{marginBottom:12}}>
      <span style={{overflowWrap:"anywhere"}}>{block.length > 90 ? block.slice(0, 90) + "…" : block}</span>
      <div className="admin-actions">
        <button type="button" className="admin-btn" disabled={disabled || index === 0} aria-label={`Đưa đoạn ${index + 1} lên`} onClick={() => move(index,-1)}>↑ Lên</button>
        <button type="button" className="admin-btn" disabled={disabled || index === blocks.length - 1} aria-label={`Đưa đoạn ${index + 1} xuống`} onClick={() => move(index,1)}>↓ Xuống</button>
      </div>
    </li>)}</ol>
  </details>;
}

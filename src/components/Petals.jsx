import "../styles/petals.css";

const PETALS = Array.from({ length: 10 }, (_, i) => ({
  left: `${(i * 71) % 100}%`,
  size: 10 + ((i * 5) % 12),
  delay: `${-(i * 1.7)}s`,
  dur: `${20+ ((i * 3) % 10)}s`,
  sway: `${30 + ((i * 13) % 60)}px`,
  tone: i % 3,
}));

function Petals() {
  return (
    <div className="petals" aria-hidden="true">
      {PETALS.map((p, i) => (
        <i
          key={i}
          className={`petal tone-${p.tone}`}
          style={{
            left: p.left,
            width: p.size,
            height: p.size * 1.3,
            animationDelay: p.delay,
            animationDuration: p.dur,
            "--sway": p.sway,
          }}
        />
      ))}
    </div>
  );
}

export default Petals;
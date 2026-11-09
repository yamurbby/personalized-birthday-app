// Doğum günü pastası: SVG gövde + DOM alevler (tek tek söndürülebilsin diye).

/** Mum uçlarının SVG içindeki yeri (viewBox 160×120'ye göre yüzde) */
export const CANDLES = [
  { x: 40.6, y: 5 },
  { x: 51.9, y: 3.5 },
  { x: 63.1, y: 5 },
];

export function Cake({ out = [] as boolean[] }) {
  return (
    <div class="cake2">
      <svg viewBox="0 0 160 120" aria-hidden="true">
        <ellipse cx="80" cy="113" rx="74" ry="7" fill="#fff" stroke="#f0d3db" stroke-width="2" />
        {/* alt kat */}
        <rect x="14" y="64" width="132" height="46" rx="10" fill="#ffc4d2" />
        <rect x="14" y="94" width="132" height="16" rx="8" fill="#ffb0c4" />
        <rect x="14" y="61" width="132" height="12" rx="6" fill="#fff6ec" />
        {[26, 47, 68, 92, 113, 134].map((x) => <circle key={x} cx={x} cy="73" r="6" fill="#fff6ec" />)}
        <path d="M80 86 c-4 -5 -11 -1 -7 5 l7 6 7 -6 c4 -6 -3 -10 -7 -5z" fill="#ff7b93" />
        {[[30, 88, '#8fd3ff'], [52, 100, '#ffd36e'], [108, 98, '#b8f0a8'], [128, 86, '#c8a8ff'], [40, 104, '#ff8fa8'], [118, 104, '#8fd3ff']].map(([x, y, c]) => (
          <rect key={`${x}`} x={x as number} y={y as number} width="6" height="2.5" rx="1.2" fill={c as string} transform={`rotate(${(x as number) % 40} ${x} ${y})`} />
        ))}
        {/* üst kat */}
        <rect x="40" y="34" width="80" height="32" rx="8" fill="#ffd9e2" />
        <rect x="40" y="31" width="80" height="9" rx="4.5" fill="#fff6ec" />
        {[50, 66, 82, 98, 112].map((x) => <circle key={x} cx={x} cy="40" r="4" fill="#fff6ec" />)}
        <circle cx="46" cy="30" r="5" fill="#ff5f7e" /><circle cx="114" cy="30" r="5" fill="#ff5f7e" />
        <path d="M44 26 l2 -3 2 3 M112 26 l2 -3 2 3" stroke="#6bbf6b" stroke-width="1.6" fill="none" />
        {/* mumlar */}
        {CANDLES.map((c, i) => {
          const x = (c.x / 100) * 160 - 3;
          const top = (c.y / 100) * 120 + 4;
          return (
            <g key={i}>
              <rect x={x} y={top} width="6" height={34 - top} rx="2" fill="#fff" />
              <path d={`M${x} ${top + 6} l6 -3 M${x} ${top + 13} l6 -3 M${x} ${top + 20} l6 -3`} stroke="#ff8fa8" stroke-width="2.2" />
              <path d={`M${x + 3} ${top} v-4`} stroke="#5a3d4a" stroke-width="1.4" />
            </g>
          );
        })}
      </svg>
      {CANDLES.map((c, i) => (
        <span key={i} class={`cake-flame ${out[i] ? 'out' : ''}`} style={{ left: `${c.x}%`, top: `${c.y}%` }}>
          <i class="flame-core" />
          <i class="smoke" />
        </span>
      ))}
    </div>
  );
}

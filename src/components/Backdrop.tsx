const GROOVES = Array.from({ length: 14 }, (_, i) => 120 + i * 26);
// A fixed, hand-shaped waveform: deterministic so server and browser render the same.
const BARS = Array.from({ length: 96 }, (_, i) => {
  const x = i / 95;
  const env = Math.sin(Math.PI * x) ** 0.6;
  const h = env * (0.35 + 0.65 * Math.abs(Math.sin(i * 0.9) * Math.cos(i * 0.37)));
  return Math.round(Math.max(0.04, h) * 1000) / 1000;
});

export function Backdrop() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full"
      viewBox="0 0 1600 1000"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <radialGradient id="bd-sky" cx="0.5" cy="0.45" r="0.75">
          <stop offset="0" stopColor="#f3f1ec" />
          <stop offset="1" stopColor="#dcd8cf" />
        </radialGradient>
      </defs>
      <rect width="1600" height="1000" fill="url(#bd-sky)" />

      {/* record grooves bleeding off the bottom-left and top-right corners */}
      <g fill="none" stroke="#1d1b18" strokeOpacity="0.07">
        {GROOVES.map((r) => (
          <circle key={`a${r}`} cx="140" cy="900" r={r} strokeWidth={r % 52 === 0 ? 2 : 1} />
        ))}
        {GROOVES.map((r) => (
          <circle key={`b${r}`} cx="1480" cy="90" r={r * 0.8} strokeWidth={r % 52 === 0 ? 2 : 1} />
        ))}
      </g>
      <circle cx="140" cy="900" r="88" fill="#ff3d3d" fillOpacity="0.10" />
      <circle cx="1480" cy="90" r="70" fill="#1d1b18" fillOpacity="0.06" />

      {/* waveform across the middle */}
      <g fill="#1d1b18" fillOpacity="0.08">
        {BARS.map((h, i) => {
          const bh = h * 260;
          return <rect key={i} x={80 + i * 15} y={500 - bh / 2} width="7" height={bh} rx="3.5" />;
        })}
      </g>

      {/* red diamonds, as in the logo */}
      <g fill="#ff3d3d">
        {[
          [260, 170, 14, 0.5],
          [1360, 820, 18, 0.45],
          [1500, 420, 9, 0.4],
          [520, 880, 8, 0.35],
          [980, 120, 7, 0.35],
        ].map(([x, y, s, o]) => (
          <rect key={`${x}-${y}`} x={x - s / 2} y={y - s / 2} width={s} height={s} transform={`rotate(45 ${x} ${y})`} fillOpacity={o} />
        ))}
      </g>
    </svg>
  );
}

"use client";

import { usePlayer } from "@/context/PlayerContext";
import { trackHue } from "./Cover";

const CX = 300;
const CY = 240;
const GROOVES = Array.from({ length: 26 }, (_, i) => 82 + i * 5);

/**
 * Record + tonearm, drawn as one scalable SVG. The record spins only while
 * the audio element reports "playing", and the arm tracks real progress.
 */
export function Platter({ className = "h-auto w-full max-w-125" }: { className?: string }) {
  const { state, currentTrack, artist } = usePlayer();
  const spinning = state.status === "playing";
  const progress =
    currentTrack && Number.isFinite(state.duration) && state.duration > 0
      ? Math.min(1, state.currentTime / state.duration)
      : 0;
  // Rest = 0°; outer groove ≈ 22°, near the label ≈ 34°.
  const armDeg = currentTrack ? 22 + 12 * progress : 0;

  const hue = currentTrack ? trackHue(currentTrack) : 0;
  const labelBg = currentTrack ? `hsl(${hue} 45% 58%)` : "#3a3c43";
  const labelInk = currentTrack ? `hsl(${hue} 60% 12%)` : "#c9ccd2";
  const title = currentTrack?.title ?? "No record";

  return (
    <svg
      viewBox="0 0 600 480"
      className={className}
      role="img"
      aria-label={currentTrack ? `Record: ${title}, ${spinning ? "spinning" : "stopped"}` : "Turntable, no record playing"}
    >
      {/* platter */}
      <circle cx={CX} cy={CY} r={226} fill="#2a2622" />
      <circle cx={CX} cy={CY} r={220} fill="#101010" />

      {/* record */}
      <g className="record-spin" style={{ animationPlayState: spinning ? "running" : "paused" }}>
        <circle cx={CX} cy={CY} r={210} fill="#161616" />
        {GROOVES.map((r, i) => (
          <circle key={r} cx={CX} cy={CY} r={r} fill="none" stroke={i % 2 ? "#1e1e1e" : "#121212"} strokeWidth={1.5} />
        ))}
        <circle cx={CX} cy={CY} r={75} fill={labelBg} />
        {/* The producer name in the logo's typeface, with plain dots: the diamonds belong to the header logo only. */}
        <text
          x={CX}
          y={CY - 24}
          textAnchor="middle"
          fill={labelInk}
          fontSize={10}
          fontWeight={800}
          letterSpacing="0.04em"
          fontFamily="var(--font-sans)"
          style={{ fontStretch: "125%" }}
        >
          {artist}
        </text>
        <text
          x={CX}
          y={CY + 28}
          textAnchor="middle"
          fill={labelInk}
          fontSize={title.length > 12 ? 13 : 17}
          fontWeight={800}
          fontFamily="var(--font-sans)"
        >
          {title}
        </text>
        {currentTrack?.bpm && (
          <text x={CX} y={CY + 46} textAnchor="middle" fill={labelInk} fontSize={11} fontFamily="var(--font-mono)">
            {currentTrack.bpm} BPM
          </text>
        )}
        <circle cx={CX} cy={CY} r={4} fill="#0b0c0e" />
      </g>

      {/* static reflections stay put while the record turns */}
      <path d="M351 99 A150 150 0 0 1 430 165" stroke="rgba(255,255,255,0.06)" strokeWidth={30} fill="none" />
      <path d="M249 381 A150 150 0 0 1 170 315" stroke="rgba(255,255,255,0.04)" strokeWidth={30} fill="none" />

      {/* tonearm */}
      <circle cx={550} cy={50} r={30} fill="#2b2f36" stroke="#3a3f47" strokeWidth={2} />
      <circle cx={550} cy={50} r={12} fill="#8b9099" />
      <g
        style={{
          transformOrigin: "550px 50px",
          transform: `rotate(${armDeg}deg)`,
          transition: "transform 0.9s ease",
        }}
      >
        <rect x={538} y={2} width={24} height={30} rx={4} fill="#4a4f57" />
        <line x1={550} y1={50} x2={550} y2={350} stroke="#c9ccd2" strokeWidth={7} strokeLinecap="round" />
        <line x1={550} y1={350} x2={532} y2={384} stroke="#c9ccd2" strokeWidth={7} strokeLinecap="round" />
        <rect x={516} y={378} width={30} height={20} rx={3} fill="#2b2f36" stroke="#8b9099" strokeWidth={1.5} transform="rotate(-28 531 388)" />
      </g>
      <rect x={580} y={300} width={12} height={70} rx={4} fill="#2b2f36" />
    </svg>
  );
}

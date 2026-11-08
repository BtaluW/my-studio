import type { Track } from "@/lib/types";
import { hueFor } from "@/lib/utils";

export const trackHue = (t: Track) => t.hue ?? hueFor(t.title);

/** Small square tile: the track's colour with its BPM. */
export function Cover({ track, size = 48 }: { track?: Track; size?: number }) {
  const hue = track ? trackHue(track) : 0;
  if (track?.cover) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- remote CDN image, already resized by Sanity
      <img
        src={track.cover}
        alt=""
        aria-hidden="true"
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        className="shrink-0 rounded-lg object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      aria-hidden="true"
      className="grid shrink-0 place-items-center rounded-lg font-mono font-semibold"
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.27),
        background: track ? `hsl(${hue} 42% 20%)` : "var(--color-raised)",
        color: track ? `hsl(${hue} 75% 78%)` : "var(--color-faint)",
      }}
    >
      {track?.bpm ?? ""}
    </div>
  );
}

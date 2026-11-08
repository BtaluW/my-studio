"use client";

import { usePlayer } from "@/context/PlayerContext";
import { Platter } from "./Platter";

/**
 * The large card on the left: the record spinning over the current beat's
 * cover art (darkened so the record stands out), or over a light grey studio
 * backdrop when the beat has no cover. Covers cross-fade when the beat changes.
 */
export function NowPlaying() {
  const { currentTrack } = usePlayer();
  const cover = currentTrack?.cover;

  return (
    <section
      aria-label="Now playing"
      // The grey backdrop shows when there's no cover; the track's colour lives on the record label.
      className="relative isolate flex flex-1 items-center justify-center overflow-hidden rounded-[22px] bg-[radial-gradient(110%_85%_at_50%_40%,#c4c6c8_0%,#a9abae_45%,#7d7f83_100%)] px-6 py-6 lg:min-h-0"
    >
      {cover && (
        // key: a new element per cover, so each one fades in instead of swapping abruptly.
        <div key={cover} aria-hidden="true" className="cover-in absolute inset-0 -z-10">
          {/* eslint-disable-next-line @next/next/no-img-element -- remote CDN image, already resized by Sanity */}
          <img src={cover} alt="" className="h-full w-full scale-105 object-cover" decoding="async" />
          <div className="absolute inset-0 bg-[radial-gradient(70%_70%_at_50%_45%,rgba(0,0,0,0.15)_0%,rgba(0,0,0,0.55)_100%)]" />
        </div>
      )}
      <Platter className="h-full max-h-130 w-full max-w-150 drop-shadow-[0_30px_40px_rgba(0,0,0,0.5)]" />
    </section>
  );
}

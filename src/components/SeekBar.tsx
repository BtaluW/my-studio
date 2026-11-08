"use client";

import { useState } from "react";
import { usePlayer } from "@/context/PlayerContext";
import { formatTime } from "@/lib/utils";

export function SeekBar() {
  const { state, currentTrack, controls } = usePlayer();
  const [scrub, setScrub] = useState<number | null>(null);

  const live = currentTrack?.isLive || !Number.isFinite(state.duration);
  const duration = live ? 0 : state.duration;
  const shown = scrub ?? state.currentTime;
  const pct = duration > 0 ? (shown / duration) * 100 : 0;
  const bufPct = duration > 0 ? Math.min(100, (state.bufferedEnd / duration) * 100) : 0;
  const disabled = !currentTrack || live || duration <= 0;

  const commit = () => {
    if (scrub !== null) controls.seek(scrub);
    setScrub(null);
  };

  return (
    <div className="flex w-full items-center gap-2 font-mono text-[11px] text-muted">
      <span className="w-10 text-right tabular-nums">{formatTime(currentTrack ? shown : undefined)}</span>
      <div className="group relative h-4 flex-1 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent rounded">
        <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 overflow-hidden rounded-full bg-line">
          <div className="absolute inset-y-0 left-0 bg-faint/60" style={{ width: `${bufPct}%` }} />
          <div className={`absolute inset-y-0 left-0 ${live ? "bg-danger/70" : "bg-accent"}`} style={{ width: live ? "100%" : `${pct}%` }} />
        </div>
        {!disabled && (
          <div
            className="pointer-events-none absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fg opacity-0 shadow transition-opacity group-hover:opacity-100 group-has-focus-visible:opacity-100"
            style={{ left: `${pct}%` }}
          />
        )}
        <label htmlFor="seek" className="sr-only">Seek</label>
        <input
          id="seek"
          type="range"
          min={0}
          max={duration || 1}
          step={0.1}
          value={Math.min(shown, duration || 1)}
          disabled={disabled}
          aria-valuetext={`${formatTime(shown)} of ${formatTime(duration)}`}
          onChange={(e) => setScrub(Number(e.target.value))}
          onPointerUp={commit}
          onKeyUp={commit}
          onBlur={commit}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-default"
        />
      </div>
      <span className="w-10 tabular-nums">{live && currentTrack ? <span className="text-danger">LIVE</span> : formatTime(currentTrack ? duration : undefined)}</span>
    </div>
  );
}

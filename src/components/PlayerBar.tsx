"use client";

import { usePlayer } from "@/context/PlayerContext";
import { describePlayback } from "@/lib/status";
import { Cover } from "./Cover";
import { NextIcon, PauseIcon, PlayIcon, PrevIcon, RepeatIcon, ShuffleIcon, VolumeIcon } from "./Icons";
import { SeekBar } from "./SeekBar";

/** The full-width player along the bottom of the page. */
export function PlayerBar({ producer }: { producer: string }) {
  const { state, currentTrack, controls } = usePlayer();
  const wantsPlay = state.intent === "play";
  const busy = wantsPlay && (state.status === "loading" || state.status === "buffering");
  const status = describePlayback(state);
  const vol = state.muted ? 0 : state.volume;

  const toggleCls = (on: boolean) =>
    `relative grid size-10 place-items-center rounded-full ${on ? "text-accent" : "text-muted hover:text-fg"}`;

  return (
    <div
      role="group"
      aria-label="Player controls"
      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_minmax(0,1fr)]"
    >
      {/* now playing */}
      <div className="col-start-1 row-start-1 flex min-w-0 items-center gap-3">
        <Cover track={currentTrack} size={44} />
        <div className="min-w-0">
          <p className="truncate text-base font-semibold">{currentTrack?.title ?? "Nothing playing"}</p>
          <p className="truncate text-sm text-muted">{currentTrack ? producer : "Pick a beat"}</p>
        </div>
      </div>

      {/* transport + seek */}
      <div className="col-span-2 col-start-1 row-start-2 flex flex-col items-center gap-1 md:col-span-1 md:col-start-2 md:row-start-1">
        <div className="flex items-center gap-3">
          <button type="button" onClick={controls.prev} disabled={!currentTrack} aria-label="Previous track" title="Previous (Shift+←)" className="grid size-11 place-items-center rounded-full text-fg hover:text-accent disabled:opacity-30">
            <PrevIcon size={24} />
          </button>
          <button
            type="button"
            onClick={controls.toggle}
            aria-label={wantsPlay ? "Pause" : "Play"}
            title="Play / pause (Space)"
            className="relative grid size-12 place-items-center rounded-full bg-fg text-ground transition-transform hover:scale-105 active:scale-95"
          >
            {wantsPlay ? <PauseIcon size={20} /> : <PlayIcon size={20} className="translate-x-px" />}
            {busy && (
              <svg className="absolute -inset-1 size-14 animate-spin text-accent" viewBox="0 0 64 64" aria-hidden="true">
                <circle cx="32" cy="32" r="30" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="40 160" strokeLinecap="round" />
              </svg>
            )}
          </button>
          <button type="button" onClick={controls.next} disabled={!currentTrack} aria-label="Next track" title="Next (Shift+→)" className="grid size-11 place-items-center rounded-full text-fg hover:text-accent disabled:opacity-30">
            <NextIcon size={24} />
          </button>
        </div>
        <div className="w-full max-w-140">
          <SeekBar />
        </div>
        <p className="sr-only" role="status" aria-live="polite">
          {status.label}
          {status.hint ? `. ${status.hint}` : ""}
        </p>
      </div>

      {/* modes + volume */}
      <div className="col-start-2 row-start-1 flex items-center justify-end gap-1 text-muted md:col-start-3">
        <button type="button" onClick={controls.toggleShuffle} aria-pressed={state.shuffle} aria-label="Shuffle" title="Shuffle (S)" className={toggleCls(state.shuffle)}>
          <ShuffleIcon size={18} />
        </button>
        <button type="button" onClick={controls.cycleRepeat} aria-label={`Repeat: ${state.repeat}`} title="Repeat (R)" className={toggleCls(state.repeat !== "off")}>
          <RepeatIcon size={18} />
          {state.repeat === "one" && (
            <span className="absolute right-0.5 top-0.5 grid size-3.5 place-items-center rounded-full bg-accent font-mono text-[9px] font-bold text-accent-ink">1</span>
          )}
        </button>
        <button
          type="button"
          onClick={controls.toggleMute}
          aria-label={state.muted ? "Unmute" : "Mute"}
          aria-pressed={state.muted}
          title="Mute (M)"
          className="hidden size-10 place-items-center rounded-full hover:text-fg sm:grid"
        >
          <VolumeIcon size={20} level={state.volume} muted={state.muted} />
        </button>
        <label htmlFor="volume" className="sr-only">Volume</label>
        <input
          id="volume"
          type="range"
          min={0}
          max={100}
          value={Math.round(vol * 100)}
          onChange={(e) => controls.setVolume(Number(e.target.value) / 100)}
          aria-valuetext={`${Math.round(vol * 100)}%`}
          className="hidden w-24 accent-fg scheme-dark lg:block lg:w-28"
        />
      </div>
    </div>
  );
}

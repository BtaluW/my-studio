"use client";

import { usePlayer } from "@/context/PlayerContext";
import { currentTrackId } from "@/lib/playerReducer";
import type { Track } from "@/lib/types";
import { formatTime } from "@/lib/utils";
import { Cover } from "./Cover";
import { PauseIcon, PlayIcon } from "./Icons";

const metaOf = (t: Track) => [t.genre, t.bpm && `${t.bpm} BPM`, t.musicalKey].filter(Boolean).join(" · ");

/** The "Library" heading, genre tabs and the scrolling list of beats. */
export function TrackList() {
  const { state, visibleIds, genres, controls } = usePlayer();
  const playingId = currentTrackId(state);
  const spinning = state.status === "playing" || state.status === "buffering";
  // Progress of the current beat, drawn as a ring around its play/pause button (mirrors the seek bar).
  const progress = Number.isFinite(state.duration) && state.duration > 0 ? Math.min(1, state.currentTime / state.duration) : 0;
  const RING = 2 * Math.PI * 15;

  // Only genres that have at least one beat get a tab (src/lib/genres.ts).
  const tabs: (string | null)[] = [null, ...genres];
  const active = state.view.kind === "genre" ? state.view.genre : null;

  const ids = visibleIds;

  return (
    <section aria-labelledby="library-h" className="flex min-h-0 flex-1 flex-col">
      <div className="mb-4 flex items-baseline justify-between gap-3 max-lg:sr-only">
        <h2 id="library-h" className="text-2xl font-extrabold tracking-tight font-stretch-118%">Library</h2>
        <span className="font-mono text-xs tracking-[0.14em] text-muted">
          {ids.length} {ids.length === 1 ? "BEAT" : "BEATS"}
        </span>
      </div>
      <div role="group" aria-label="Filter by genre" className="flex gap-6 overflow-x-auto border-b border-white/6 scrollbar-none">
        {tabs.map((g) => {
          const on = g === active;
          return (
            <button
              key={g ?? "all"}
              type="button"
              aria-pressed={on}
              onClick={() => (g ? controls.showGenre(g) : controls.showLibrary())}
              className={`relative min-h-11 shrink-0 whitespace-nowrap text-[15px] transition-colors ${
                on ? "font-semibold text-fg" : "text-muted hover:text-fg"
              }`}
            >
              {g ?? "All beats"}
              {on && <span aria-hidden="true" className="absolute inset-x-0 -bottom-px h-0.75 rounded-full bg-fg" />}
            </button>
          );
        })}
      </div>

      <ol className="-mx-2 mt-2 min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 [scrollbar-color:rgba(255,255,255,0.15)_transparent] scrollbar-thin">
        {ids.map((id, i) => {
          const t = state.tracks[id];
          if (!t) return null;
          const isCur = id === playingId;
          const isSpinning = isCur && spinning;
          const meta = metaOf(t);
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => controls.playTrack(id, ids)}
                aria-current={isCur ? "true" : undefined}
                aria-label={`${isCur && state.intent === "play" ? "Pause" : "Play"} ${t.title}`}
                className={`group grid min-h-16 w-full grid-cols-[32px_44px_minmax(0,1fr)_auto] items-center gap-4 rounded-xl px-2 py-2 text-left transition-colors ${
                  isCur ? "bg-white/6" : "hover:bg-white/4"
                }`}
              >
                <span className="grid place-items-center font-mono text-sm text-faint">
                  {isCur ? (
                    <span className="relative grid size-8 place-items-center text-fg">
                      <svg viewBox="0 0 32 32" className="absolute inset-0 size-8 -rotate-90" aria-hidden="true">
                        <circle cx="16" cy="16" r="15" fill="none" stroke="var(--color-line)" strokeWidth="2" />
                        <circle
                          cx="16"
                          cy="16"
                          r="15"
                          fill="none"
                          stroke="var(--color-accent)"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeDasharray={RING}
                          strokeDashoffset={RING * (1 - progress)}
                        />
                      </svg>
                      {state.intent === "play" ? <PauseIcon size={13} /> : <PlayIcon size={13} className="translate-x-px" />}
                    </span>
                  ) : (
                    <>
                      <span className="group-hover:hidden">{i + 1}</span>
                      <PlayIcon size={14} className="hidden text-fg group-hover:block" />
                    </>
                  )}
                </span>
                <Cover track={t} size={44} />
                <span className="flex min-w-0 flex-col">
                  <span className={`truncate text-[15px] font-semibold leading-tight ${isCur ? "text-accent" : "text-fg"}`}>{t.title}</span>
                  {meta && <span className="truncate text-sm leading-tight text-muted">{meta}</span>}
                </span>
                <span className="flex items-center gap-3 font-mono text-sm text-muted">
                  {isCur && (
                    <span className="flex h-3 items-end gap-0.5" aria-hidden="true">
                      {[0, 0.2, 0.4].map((d) => (
                        <span
                          key={d}
                          className={`h-full w-0.75 rounded-sm bg-accent ${isSpinning ? "eq-bar" : "scale-y-50"}`}
                          style={{ animationDelay: `${d}s`, transformOrigin: "bottom" }}
                        />
                      ))}
                    </span>
                  )}
                  {formatTime(t.duration)}
                </span>
                {isCur && <span className="sr-only">{isSpinning ? "Now playing" : "Paused"}</span>}
              </button>
            </li>
          );
        })}
        {ids.length === 0 && (
          <li className="px-2 py-8 text-sm text-muted">No beats here yet.</li>
        )}
      </ol>
    </section>
  );
}

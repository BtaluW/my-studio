"use client";

import { useEffect, useRef } from "react";

export interface ShortcutHandlers {
  toggle: () => void;
  seekBy: (d: number) => void;
  next: () => void;
  prev: () => void;
  volumeBy: (d: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
}

export const SHORTCUTS: [string, string][] = [
  ["Space", "Play / pause"],
  ["← →", "Seek 5 s"],
  ["Shift + ← →", "Previous / next"],
  ["↑ ↓", "Volume"],
  ["M", "Mute"],
  ["S", "Shuffle"],
  ["R", "Repeat mode"],
];

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable) return true;
  if (tag === "INPUT") {
    const type = (target as HTMLInputElement).type;
    // Range sliders keep their own arrow-key behaviour.
    return type !== "checkbox" && type !== "button";
  }
  return false;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  const h = useRef(handlers);
  h.current = handlers;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTyping(e.target)) return;
      // Let buttons handle Space/Enter themselves.
      if (e.key === " " && e.target instanceof HTMLButtonElement) return;

      switch (e.key) {
        case " ":
          e.preventDefault();
          h.current.toggle();
          break;
        case "ArrowRight":
          e.preventDefault();
          if (e.shiftKey) h.current.next();
          else h.current.seekBy(5);
          break;
        case "ArrowLeft":
          e.preventDefault();
          if (e.shiftKey) h.current.prev();
          else h.current.seekBy(-5);
          break;
        case "ArrowUp":
          e.preventDefault();
          h.current.volumeBy(0.05);
          break;
        case "ArrowDown":
          e.preventDefault();
          h.current.volumeBy(-0.05);
          break;
        case "m":
        case "M":
          h.current.toggleMute();
          break;
        case "s":
        case "S":
          h.current.toggleShuffle();
          break;
        case "r":
        case "R":
          h.current.cycleRepeat();
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}

"use client";

import type { ReactNode } from "react";

/**
 * Mobile: a "Library" handle that opens the beat list in place, so the list is the
 * only thing that scrolls. Desktop: the list is always shown and the handle is hidden.
 */
export function LibrarySheet({ open, onToggle, children }: { open: boolean; onToggle: () => void; children: ReactNode }) {
  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls="library-sheet"
        aria-label={open ? "Close library" : "Open library"}
        className="flex min-h-8 w-full flex-col items-center justify-center gap-1.5 lg:hidden"
      >
        <span aria-hidden="true" className="h-1 w-10 rounded-full bg-white/20" />
        {!open && <span className="text-[15px] font-semibold">Library</span>}
      </button>
      <div id="library-sheet"
        className={`flex min-h-0 flex-1 flex-col transition-[opacity,visibility] duration-300 motion-reduce:transition-none ${
          open ? "" : "max-lg:invisible max-lg:opacity-0"
        }`}>
        {children}
      </div>
    </>
  );
}

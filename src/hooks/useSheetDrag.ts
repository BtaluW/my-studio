"use client";

import { useLayoutEffect, useRef, type PointerEvent, type MouseEvent, type RefObject } from "react";

const START_PX = 8; // movement before a touch counts as a drag, so taps stay taps
const FLICK = 0.5; // px per ms: a flick this fast decides the direction on its own

interface Drag {
  id: number;
  x0: number;
  y0: number;
  p0: number;
  p: number;
  range: number;
  lastY: number;
  lastT: number;
  v: number;
  active: boolean;
}

/**
 * Swipe the library sheet open or closed on mobile. While dragging, the frame's --p
 * (0 closed, 1 open) follows the finger with transitions off; on release it snaps to
 * the flick's direction or the nearer state, and the CSS transition finishes the move.
 */
export function useSheetDrag(frameRef: RefObject<HTMLElement | null>, open: boolean, setOpen: (open: boolean) => void) {
  const drag = useRef<Drag | null>(null);
  const suppressClick = useRef(false);

  // Once React has applied the new data-library value, the inline --p is redundant.
  useLayoutEffect(() => {
    frameRef.current?.style.removeProperty("--p");
  }, [open, frameRef]);

  const onPointerDown = (e: PointerEvent<HTMLElement>) => {
    suppressClick.current = false;
    const frame = frameRef.current;
    if (!frame || !e.isPrimary || window.matchMedia("(min-width: 1024px)").matches) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const p = open ? 1 : 0;
    drag.current = {
      id: e.pointerId,
      x0: e.clientX,
      y0: e.clientY,
      p0: p,
      p,
      // Roughly the distance the sheet travels; dragging this far goes all the way.
      range: frame.clientHeight * 0.4,
      lastY: e.clientY,
      lastT: e.timeStamp,
      v: 0,
      active: false,
    };
  };

  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    const d = drag.current;
    const frame = frameRef.current;
    if (!d || !frame || e.pointerId !== d.id) return;
    const dx = e.clientX - d.x0;
    const dy = e.clientY - d.y0;
    if (!d.active) {
      // Horizontal first (scrolling the genre tabs): not ours.
      if (Math.abs(dx) > START_PX && Math.abs(dx) > Math.abs(dy)) {
        drag.current = null;
        return;
      }
      if (Math.abs(dy) < START_PX) return;
      d.active = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      frame.dataset.dragging = "";
    }
    d.p = Math.min(1, Math.max(0, d.p0 - dy / d.range));
    const dt = e.timeStamp - d.lastT;
    if (dt > 0) d.v = (e.clientY - d.lastY) / dt;
    d.lastY = e.clientY;
    d.lastT = e.timeStamp;
    frame.style.setProperty("--p", String(d.p));
  };

  const end = () => {
    const d = drag.current;
    const frame = frameRef.current;
    drag.current = null;
    if (!d?.active || !frame) return;
    // Upward flick opens, downward closes; otherwise go to whichever state is nearer.
    const next = Math.abs(d.v) > FLICK ? d.v < 0 : d.p > 0.5;
    frame.style.setProperty("--p", next ? "1" : "0");
    delete frame.dataset.dragging; // transitions back on, so the snap animates
    suppressClick.current = true; // the click that ends a drag shouldn't also toggle
    if (next === open) frame.style.removeProperty("--p");
    else setOpen(next);
  };

  const onClickCapture = (e: MouseEvent<HTMLElement>) => {
    if (!suppressClick.current) return;
    suppressClick.current = false;
    e.preventDefault();
    e.stopPropagation();
  };

  return { onPointerDown, onPointerMove, onPointerUp: end, onPointerCancel: end, onClickCapture };
}

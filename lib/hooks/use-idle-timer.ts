"use client";

import { useEffect, useRef } from "react";

export function useIdleTimer(ms: number, onIdle: () => void, onWake?: () => void) {
  const timer = useRef<number | null>(null);
  const idle = useRef(false);

  useEffect(() => {
    const reset = () => {
      if (idle.current) {
        idle.current = false;
        onWake?.();
      }
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        idle.current = true;
        onIdle();
      }, ms);
    };
    const events: (keyof WindowEventMap)[] = [
      "pointerdown",
      "pointermove",
      "keydown",
      "wheel",
      "touchstart",
    ];
    events.forEach((ev) => window.addEventListener(ev, reset));
    reset();
    return () => {
      events.forEach((ev) => window.removeEventListener(ev, reset));
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [ms, onIdle, onWake]);
}

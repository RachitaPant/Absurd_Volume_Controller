"use client";

import { useEffect } from "react";
import { useVolumeStore } from "@/lib/state/use-volume-store";
import { useEasterEggStore } from "@/lib/state/use-easter-egg-store";
import { play } from "@/lib/audio/presets";

// Keyboard shortcuts that live outside scene/dashboard logic.
// Easter-egg triggers (chai, pawri, Konami, Sharma strike) are in BhaiBhaiEasterEggs.
export function GlobalShortcuts() {
  const setRetroMode = useVolumeStore((s) => s.setRetroMode);
  const pushToast = useEasterEggStore((s) => s.pushToast);
  const unlock = useEasterEggStore((s) => s.unlock);

  // Ctrl+Shift+L → retro 1998 mode
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "l") {
        e.preventDefault();
        const html = document.documentElement;
        const next = !html.classList.contains("retro-1998");
        html.classList.toggle("retro-1998", next);
        setRetroMode(next);
        pushToast({
          text: next
            ? "RETRO 1998 MODE engaged. Bhai was still in college."
            : "1998 dismissed. back to the present.",
          flavor: next ? "warn" : "info",
        });
        play(next ? "buzz" : "shimmer", 0.5);
        if (next) unlock("retro-1998");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setRetroMode, pushToast, unlock]);

  // Triple-click on logo → retro mode
  useEffect(() => {
    const logo = document.querySelector<HTMLElement>("[data-logo]");
    if (!logo) return;
    let clicks = 0;
    let timer: number | null = null;
    const onClick = () => {
      clicks++;
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => { clicks = 0; }, 600);
      if (clicks >= 3) {
        clicks = 0;
        const next = !useVolumeStore.getState().retroMode;
        setRetroMode(next);
        pushToast({
          text: next ? "RETRO 1998 MODE. Sharma Sir was young once." : "1998 dismissed.",
          flavor: "achievement",
        });
        unlock("retro-1998");
        play("glass-shatter", 0.4);
      }
    };
    logo.addEventListener("click", onClick);
    return () => logo.removeEventListener("click", onClick);
  }, [setRetroMode, pushToast, unlock]);

  return null;
}

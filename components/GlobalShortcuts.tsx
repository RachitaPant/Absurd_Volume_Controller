"use client";

import { useEffect, useRef } from "react";
import { useKonami } from "@/lib/hooks/use-konami";
import { useTypeWatcher } from "@/lib/hooks/use-type-watcher";
import { useVolumeStore } from "@/lib/state/use-volume-store";
import { useEasterEggStore } from "@/lib/state/use-easter-egg-store";
import { play } from "@/lib/audio/presets";

// Wires every always-on easter egg trigger that lives outside scene logic.
export function GlobalShortcuts() {
  const setGodMode = useVolumeStore((s) => s.setGodMode);
  const setRetroMode = useVolumeStore((s) => s.setRetroMode);
  const godMode = useVolumeStore((s) => s.godMode);
  const retroMode = useVolumeStore((s) => s.retroMode);
  const unlock = useEasterEggStore((s) => s.unlock);
  const pushToast = useEasterEggStore((s) => s.pushToast);
  const tabCount = useRef(0);
  const tabResetT = useRef<number | null>(null);

  // Konami → god mode
  useKonami(() => {
    setGodMode(!useVolumeStore.getState().godMode);
    if (unlock("konami-believer")) {
      pushToast({
        text: useVolumeStore.getState().godMode
          ? "GOD MODE engaged. cap raised to nine thousand and one."
          : "god mode dismissed. for now.",
        flavor: "achievement",
      });
    }
    play("ascend", 0.7);
  });

  // typed-word triggers
  useTypeWatcher({
    boss: () => {
      pushToast({
        text: "boss battle: not yet awakened. (phase 4 portal sealed.)",
        flavor: "warn",
      });
      play("buzz", 0.4);
    },
    void: () => {
      pushToast({
        text: "the void is locked. (phase 3.) it sees you anyway.",
        flavor: "warn",
      });
      play("descend", 0.4);
    },
    "sudo make me a sandwich": () => {
      pushToast({ text: "what? make it yourself.", flavor: "warn" });
      play("ping", 0.5);
    },
    "do not press": () => {
      pushToast({
        text: "the forbidden button does not yet exist. you press at thin air.",
        flavor: "warn",
      });
      play("thud", 0.4);
    },
  });

  // Ctrl+Shift+L → toggle late-stage capitalism mode for real
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "l") {
        e.preventDefault();
        const html = document.documentElement;
        const next = !html.classList.contains("late-stage-capitalism");
        html.classList.toggle("late-stage-capitalism", next);
        pushToast({
          text: next
            ? "LATE STAGE CAPITALISM MODE engaged. resist the upgrade prompt."
            : "the cookies have been declined. for now.",
          flavor: next ? "warn" : "info",
        });
        play(next ? "buzz" : "shimmer", 0.5);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pushToast]);

  // Tab x7 → reveal achievements list
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        tabCount.current++;
        if (tabResetT.current) window.clearTimeout(tabResetT.current);
        tabResetT.current = window.setTimeout(() => {
          tabCount.current = 0;
        }, 1500);
        if (tabCount.current >= 7) {
          tabCount.current = 0;
          pushToast({
            text: "DEBUG PANEL // unlocked. (full leva surface in phase 5.)",
            flavor: "achievement",
          });
          play("achievement", 0.6);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pushToast]);

  // Wednesday party hat / midnight / inverted UI as DOM-class toggles
  useEffect(() => {
    const apply = () => {
      const d = new Date();
      const isWed = d.getDay() === 3;
      const isMidnight = d.getHours() === 0;
      document.documentElement.classList.toggle("party-hat", isWed);
      document.documentElement.classList.toggle("witching-hour", isMidnight);
      if (isWed && useEasterEggStore.getState().unlock("wednesday-hat")) {
        pushToast({
          text: "the knob is wearing a tiny party hat. it is wednesday.",
          flavor: "achievement",
        });
      }
      if (isMidnight && useEasterEggStore.getState().unlock("midnight-witness")) {
        pushToast({
          text: "the witching hour. the knob has horns.",
          flavor: "achievement",
        });
      }
    };
    apply();
    const id = window.setInterval(apply, 60_000);
    return () => window.clearInterval(id);
  }, [pushToast]);

  // sub-zero inversion
  const master = useVolumeStore((s) => s.master);
  useEffect(() => {
    document.documentElement.classList.toggle("subzero", master < 0);
  }, [master]);

  // god mode glow
  useEffect(() => {
    document.documentElement.classList.toggle("god-mode", godMode);
  }, [godMode]);

  // retro mode
  useEffect(() => {
    document.documentElement.classList.toggle("retro-1998", retroMode);
  }, [retroMode]);

  // overload state — drive CSS variable for shake
  const overloaded = useVolumeStore((s) => s.isOverloaded);
  useEffect(() => {
    if (!overloaded) {
      document.documentElement.style.setProperty("--shake-x", "0px");
      document.documentElement.style.setProperty("--shake-y", "0px");
      return;
    }
    let raf = 0;
    const tick = () => {
      const v = useVolumeStore.getState().master;
      const intensity = Math.max(0, Math.min(8, (v - 100) / 12));
      const x = (Math.random() - 0.5) * intensity;
      const y = (Math.random() - 0.5) * intensity;
      document.documentElement.style.setProperty("--shake-x", `${x.toFixed(2)}px`);
      document.documentElement.style.setProperty("--shake-y", `${y.toFixed(2)}px`);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [overloaded]);

  // triple-click logo handled in HudCorner via DOM listener on logo element
  useEffect(() => {
    const logo = document.querySelector<HTMLElement>("[data-logo]");
    if (!logo) return;
    let clicks = 0;
    let timer: number | null = null;
    const onClick = () => {
      clicks++;
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        clicks = 0;
      }, 600);
      if (clicks >= 3) {
        clicks = 0;
        const next = !useVolumeStore.getState().retroMode;
        setRetroMode(next);
        pushToast({
          text: next ? "RETRO 1998 MODE engaged." : "1998 dismissed. back to the future.",
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

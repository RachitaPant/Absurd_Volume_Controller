"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useKonami } from "@/lib/hooks/use-konami";
import { useTypeWatcher } from "@/lib/hooks/use-type-watcher";
import { useVolumeStore } from "@/lib/state/use-volume-store";
import { useBhaiStore } from "@/lib/state/use-bhai-store";
import { useEasterEggStore } from "@/lib/state/use-easter-egg-store";
import { play } from "@/lib/audio/presets";
import { SUMAN } from "@/lib/copy/suman";
import { SHARMA_SIR } from "@/lib/copy/characters";

export function BhaiBhaiEasterEggs() {
  const master = useVolumeStore((s) => s.master);
  const setMaster = useVolumeStore((s) => s.setMaster);
  const pushToast = useEasterEggStore((s) => s.pushToast);
  const unlock = useEasterEggStore((s) => s.unlock);
  const showSuman = useBhaiStore((s) => s.showSuman);
  const setSaxena = useBhaiStore((s) => s.setSaxena);
  const saxenaActive = useBhaiStore((s) => s.saxenaActive);
  const setPawri = useBhaiStore((s) => s.setPawri);
  const setChai = useBhaiStore((s) => s.setChai);
  const chaiActive = useBhaiStore((s) => s.chaiActive);
  const setSharmaStrike = useBhaiStore((s) => s.setSharmaStrike);
  const sharmaStrikeActive = useBhaiStore((s) => s.sharmaStrikeActive);

  // ── Konami → Saxena Sir sequence ──────────────────────────────────────────
  useKonami(() => {
    setSaxena(true);
    play("tabla", 0.5);
    window.setTimeout(() => play("shehnai", 0.4), 400);
    window.setTimeout(() => {
      setSaxena(false);
      pushToast({ text: "Saxena Sir: theek hai.", flavor: "diary" });
    }, 4200);
    if (unlock("konami-believer")) {
      pushToast({ text: "★ Saxena Sir has noticed you.", flavor: "achievement" });
    }
  });

  // ── Type "chai" → planets pause, ☕ floats up, BP drops ──────────────────
  useTypeWatcher({
    chai: () => {
      if (chaiActive) return;
      setChai(true);
      showSuman(SUMAN.chai);
      play("tabla", 0.3);
      pushToast({ text: "Chai aa gaya. Sab karo thoda rest ☕", flavor: "diary" });
      window.setTimeout(() => setChai(false), 8000);
    },
    // ── Type "pawri ho rahi hai" → 8s disco mode ─────────────────────────
    "pawri ho rahi hai": () => {
      setPawri(true);
      play("dholak-loop", 0.6);
      pushToast({ text: "PAWRI HO RAHI HAI 🎉 (8 seconds only, phir kaam)", flavor: "achievement" });
      window.setTimeout(() => setPawri(false), 8000);
    },
  });

  // ── Hold at 100% for 10s → Sharma Sir strike ─────────────────────────────
  const at100StartRef = useRef<number | null>(null);
  const strikeFiredRef = useRef(false);
  useEffect(() => {
    const near100 = master >= 98 && master <= 102;
    if (near100 && !strikeFiredRef.current) {
      if (at100StartRef.current === null) {
        at100StartRef.current = performance.now();
      } else if (performance.now() - at100StartRef.current > 10_000) {
        strikeFiredRef.current = true;
        setSharmaStrike(true);
        play("tabla", 0.6);
      }
    } else if (!near100) {
      at100StartRef.current = null;
      if (strikeFiredRef.current) {
        strikeFiredRef.current = false;
        setSharmaStrike(false);
      }
    }
  }, [master, setSharmaStrike]);

  // ── Power cut CSS flicker driver ──────────────────────────────────────────
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

  // ── Sub-zero, god mode, retro CSS class toggles ───────────────────────────
  const godMode = useVolumeStore((s) => s.godMode);
  const retroMode = useVolumeStore((s) => s.retroMode);
  useEffect(() => {
    document.documentElement.classList.toggle("subzero", master < 0);
  }, [master]);
  useEffect(() => {
    document.documentElement.classList.toggle("god-mode", godMode);
  }, [godMode]);
  useEffect(() => {
    document.documentElement.classList.toggle("retro-1998", retroMode);
  }, [retroMode]);

  // ── Wednesday party hat + midnight ───────────────────────────────────────
  useEffect(() => {
    const apply = () => {
      const d = new Date();
      document.documentElement.classList.toggle("party-hat", d.getDay() === 3);
      document.documentElement.classList.toggle("witching-hour", d.getHours() === 0);
      if (d.getDay() === 3 && useEasterEggStore.getState().unlock("wednesday-hat")) {
        pushToast({ text: "the solar system is wearing a tiny party hat. it is wednesday.", flavor: "achievement" });
      }
    };
    apply();
    const id = window.setInterval(apply, 60_000);
    return () => window.clearInterval(id);
  }, [pushToast]);

  // ── Chai overlay ─────────────────────────────────────────────────────────
  // Rendered below

  return (
    <>
      {/* Saxena Sir overlay */}
      <AnimatePresence>
        {saxenaActive && (
          <motion.div
            key="saxena"
            className="fixed inset-0 z-[180] flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              className="flex flex-col items-center gap-4"
              initial={{ scale: 0.8, rotate: -5 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 1.2 }}
            >
              <div className="text-[120px] drop-shadow-2xl" style={{ filter: "drop-shadow(0 0 40px #C57CFF)" }}>
                🪷
              </div>
              <motion.div
                className="font-display italic text-4xl text-bone"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.6 }}
              >
                theek hai.
              </motion.div>
              <motion.div
                className="hud text-bone/40 text-[10px] tracking-[0.3em]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.4 }}
              >
                — Saxena Sir (leaves)
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sharma Sir strike overlay */}
      <AnimatePresence>
        {sharmaStrikeActive && (
          <motion.div
            key="sharma-strike"
            className="fixed inset-0 z-[170] flex items-center justify-center bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="flex flex-col items-center gap-6 text-center px-8"
              initial={{ y: 40 }}
              animate={{ y: 0 }}
            >
              <div className="text-8xl">☀️</div>
              <div
                className="font-display text-bone text-5xl font-bold"
                style={{ textShadow: "0 0 40px rgba(255,155,86,0.8)" }}
              >
                {SHARMA_SIR.strikeSign}
              </div>
              <div className="hud text-bone/60 text-[11px] tracking-[0.25em] max-w-sm">
                Sharma Sir is on strike. He holds a sign. He has earned this.
              </div>
              <div
                className="hud text-[10px] tracking-[0.2em] px-4 py-2 rounded-sm"
                style={{
                  background: "rgba(255,155,86,0.1)",
                  border: "1px solid rgba(255,155,86,0.3)",
                  color: "#FF9B56",
                }}
              >
                {SHARMA_SIR.apologyPrompt}
              </div>
              <button
                className="hud text-bone/30 text-[9px] hover:text-bone/60 underline"
                onClick={() => {
                  useBhaiStore.getState().setSharmaStrike(false);
                  setMaster(Math.max(0, master - 30));
                  pushToast({ text: "Apology accepted. Sharma Sir resumes orbital operations.", flavor: "diary" });
                  play("shehnai", 0.3);
                }}
              >
                (sorry sir, it won't happen again)
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chai ☕ floating emoji */}
      <AnimatePresence>
        {chaiActive && (
          <motion.div
            key="chai"
            className="fixed top-1/3 left-1/2 -translate-x-1/2 z-[60] pointer-events-none text-6xl"
            initial={{ opacity: 0, y: 0, scale: 0.5 }}
            animate={{ opacity: [0, 1, 1, 0], y: -80, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.5 }}
          >
            ☕
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

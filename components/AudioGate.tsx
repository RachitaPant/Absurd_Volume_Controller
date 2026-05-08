"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useSceneStore } from "@/lib/state/use-scene-store";
import { getAudioEngine } from "@/lib/audio/audio-engine";
import { easings } from "@/lib/utils/easings";

// Browsers require a user gesture before AudioContext makes sound. This is
// the only time we admit it — to the user, this looks like a single, tasteful
// invitation. Click anywhere to enter.
export function AudioGate() {
  const audioReady = useSceneStore((s) => s.audioReady);
  const setAudioReady = useSceneStore((s) => s.setAudioReady);
  const [hint, setHint] = useState(false);

  useEffect(() => {
    if (audioReady) return;
    const id = window.setTimeout(() => setHint(true), 1200);
    return () => window.clearTimeout(id);
  }, [audioReady]);

  useEffect(() => {
    if (audioReady) return;
    const enter = async () => {
      // Race resume() against a 1.5s timer — some headless / synthetic
      // user-gesture flows leave AudioContext.resume() pending forever, and
      // we don't want the entire app to stall on it.
      const settle = (p: Promise<unknown>) =>
        Promise.race([
          p,
          new Promise((r) => setTimeout(r, 1500)),
        ]);
      try {
        const engine = getAudioEngine();
        engine.init();
        await settle(engine.resume());
      } catch {
        // graceful fallback — visuals only
      }
      setAudioReady(true);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return;
      void enter();
    };
    const onPointer = () => void enter();
    window.addEventListener("pointerdown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [audioReady, setAudioReady]);

  return (
    <AnimatePresence>
      {!audioReady && (
        <motion.div
          key="gate"
          className="fixed inset-0 z-[300] bg-void flex flex-col items-center justify-center"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: easings.cinematic }}
        >
          <motion.div
            className="w-32 h-px bg-bone breathe-hairline"
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.7, ease: easings.cinematic }}
          />
          <motion.p
            className="hud mt-12 text-bone/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: hint ? 1 : 0 }}
            transition={{ duration: 0.6 }}
          >
            tap. click. press any key. enter the loud.
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

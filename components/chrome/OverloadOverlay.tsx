"use client";

import { motion, AnimatePresence } from "motion/react";
import { useEffect } from "react";
import { useVolumeStore } from "@/lib/state/use-volume-store";
import { play } from "@/lib/audio/presets";

// Visual chromatic-aberration ring around the viewport when > 100%.
// Bhai Bhai escalation content (banners, modals, email) lives in OverloadEscalation.
export function OverloadOverlay() {
  const master = useVolumeStore((s) => s.master);
  const overloaded = master > 100;
  const past130 = master > 130;
  const past160 = master > 160;

  useEffect(() => {
    if (typeof document === "undefined") return;
    const original = "Bhai Bhai Enterprises — Volume Manager";
    document.title = overloaded
      ? "🔊 SHARMA SIR KA BP 180/110 🔊"
      : original;
    return () => { document.title = original; };
  }, [overloaded]);

  useEffect(() => {
    if (overloaded) play("glass-shatter", 0.45);
  }, [overloaded]);

  const glowColor = past160
    ? "#ff0000"
    : past130
      ? "#ff4444"
      : "#ff4d6d";

  return (
    <AnimatePresence>
      {overloaded && (
        <motion.div
          key="overload"
          className="fixed inset-0 pointer-events-none z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* pulsing inner glow ring */}
          <motion.div
            aria-hidden
            className="absolute inset-0"
            style={{
              boxShadow: `inset 0 0 100px ${glowColor}, inset 0 0 200px rgba(0,0,0,0.5)`,
              mixBlendMode: "screen",
            }}
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

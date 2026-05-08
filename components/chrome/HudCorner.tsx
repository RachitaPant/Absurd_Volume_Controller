"use client";

import { motion } from "motion/react";
import { useVolumeStore } from "@/lib/state/use-volume-store";
import { useEasterEggStore } from "@/lib/state/use-easter-egg-store";
import { useSceneStore } from "@/lib/state/use-scene-store";
import { NumberTicker } from "./NumberTicker";

// The four corners. Quiet, monospace, full of self-importance.
export function HudCorner() {
  const adjustments = useVolumeStore((s) => s.adjustmentCount);
  const taxCents = useVolumeStore((s) => s.taxCents);
  const godMode = useVolumeStore((s) => s.godMode);
  const retroMode = useVolumeStore((s) => s.retroMode);
  const unlocked = useEasterEggStore((s) => s.unlocked);
  const scene = useSceneStore((s) => s.scene);

  return (
    <>
      <motion.div
        className="fixed top-6 left-6 hud z-40 space-y-1.5"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        <div
          className="text-bone/60 font-bold tracking-[0.22em] cursor-pointer select-none"
          data-logo
        >
          VOLUMETRIC HUBRIS
        </div>
        <div className="text-bone/30">v4.7.0 // {scene.replace(/-/g, " ")}</div>
        {godMode && (
          <div className="text-[var(--accent)] tracking-[0.3em]">★ GOD MODE</div>
        )}
        {retroMode && (
          <div className="text-bone/70">RETRO 1998 MODE</div>
        )}
      </motion.div>

      <motion.div
        className="fixed top-6 right-6 hud z-40 text-right space-y-1.5"
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        <div className="text-bone/60">
          ADJUSTMENTS: <NumberTicker value={adjustments} width={4} />
        </div>
        <div className="text-bone/40 tnum">
          VOLUME TAX: ${(taxCents / 100).toFixed(4)}
        </div>
        <div className="text-bone/30">
          ACHIEVEMENTS: <NumberTicker value={unlocked.size} width={2} />/30
        </div>
      </motion.div>
    </>
  );
}

"use client";

import { motion } from "motion/react";
import { useVolumeStore } from "@/lib/state/use-volume-store";
import { useEasterEggStore } from "@/lib/state/use-easter-egg-store";
import { useSceneStore } from "@/lib/state/use-scene-store";
// Bhai Bhai Enterprises HUD — built properly in Step 9
export function HudCorner() {
  const adjustments = useVolumeStore((s) => s.adjustmentCount);
  const godMode = useVolumeStore((s) => s.godMode);

  return (
    <>
      <motion.div
        className="fixed top-4 left-5 hud z-40 space-y-1"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        <div className="text-bone/60 font-bold tracking-[0.18em] cursor-pointer select-none text-[11px]" data-logo>
          BHAI BHAI ENTERPRISES PVT. LTD.
        </div>
        <div className="text-bone/30 text-[10px]">solar system operations // fy 2024-25</div>
        {godMode && <div className="text-[var(--accent)] tracking-[0.3em] text-[10px]">★ GOD MODE</div>}
      </motion.div>

      <motion.div
        className="fixed top-4 right-5 hud z-40 text-right space-y-1"
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        <div className="text-bone/50 text-[10px]">ADJUSTMENTS: {adjustments}</div>
        <div className="text-bone/30 text-[10px]">Senior Volume Manager (Probation)</div>
      </motion.div>
    </>
  );
}

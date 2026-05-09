"use client";

import { motion, AnimatePresence } from "motion/react";
import { useBhaiStore } from "@/lib/state/use-bhai-store";
import { useVolumeStore } from "@/lib/state/use-volume-store";

export function SharmaBetaWidget() {
  const sharmaCount = useBhaiStore((s) => s.sharmaAdjustments);
  const yourCount = useVolumeStore((s) => s.adjustmentCount);

  // User is always behind Sharma ji ka beta
  const behind = Math.max(0, sharmaCount - yourCount);

  return (
    <motion.div
      className="fixed top-16 left-5 z-30 hud text-[9px] leading-relaxed max-w-[200px]"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 1.2, duration: 0.6 }}
    >
      <div className="text-bone/25 tracking-[0.2em] mb-0.5">SHARMA JI KA BETA</div>
      <div className="flex flex-col gap-0.5">
        <div className="flex justify-between gap-4">
          <span className="text-bone/50">sharma ji ka beta:</span>
          <span className="text-[#5CE5FF] font-bold tnum">{sharmaCount} adj</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-bone/50">you:</span>
          <span className="text-bone/70 tnum">{yourCount} adj</span>
        </div>
        <AnimatePresence>
          {behind > 0 && (
            <motion.div
              key="behind"
              className="text-[#FF4D6D] text-[8px] mt-0.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              you are {behind} behind. as usual.
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

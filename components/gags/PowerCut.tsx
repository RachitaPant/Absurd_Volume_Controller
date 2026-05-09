"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useBhaiStore } from "@/lib/state/use-bhai-store";
import { useEasterEggStore } from "@/lib/state/use-easter-egg-store";
import { play } from "@/lib/audio/presets";

const POWER_CUT_INTERVAL = 15 * 60 * 1000; // every 15 minutes

export function PowerCut() {
  const active = useBhaiStore((s) => s.powerCutActive);
  const setPowerCut = useBhaiStore((s) => s.setPowerCut);
  const showSuman = useBhaiStore((s) => s.showSuman);
  const pushToast = useEasterEggStore((s) => s.pushToast);

  useEffect(() => {
    const trigger = () => {
      setPowerCut(true);
      // inverter beep synthesized
      play("ping", 0.6);
      pushToast({
        text: "Current chala gaya. 4 ghante backup hai.",
        flavor: "warn",
      });
      window.setTimeout(() => {
        import("@/lib/copy/suman").then(({ SUMAN }) => {
          showSuman(SUMAN.powerCut);
        });
      }, 1200);
      // restore after 2.5s
      window.setTimeout(() => {
        setPowerCut(false);
      }, 2500);
    };

    const id = window.setInterval(trigger, POWER_CUT_INTERVAL);
    return () => window.clearInterval(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="power-cut"
          className="fixed inset-0 z-[150] pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.85, 0, 0.7, 0, 0.5, 0] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, times: [0, 0.1, 0.3, 0.45, 0.6, 0.75, 1] }}
          style={{ background: "#000", mixBlendMode: "multiply" }}
        />
      )}
    </AnimatePresence>
  );
}

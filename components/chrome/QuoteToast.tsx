"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useVolumeStore } from "@/lib/state/use-volume-store";
import { quoteForVolume } from "@/lib/utils/quotes";
import { easings } from "@/lib/utils/easings";

// Whenever the volume LANDS on an integer (and stays for ~280ms), show the
// quote for that integer. Volume changes that blow past a value don't fire.
export function QuoteToast() {
  const [shown, setShown] = useState<{ v: number; text: string } | null>(null);
  const lastFired = useRef<number | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    const unsub = useVolumeStore.subscribe((s) => {
      const v = Math.round(s.master);
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        if (lastFired.current === v) return;
        lastFired.current = v;
        setShown({ v, text: quoteForVolume(v) });
      }, 280);
    });
    return () => {
      unsub();
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  // auto-clear
  useEffect(() => {
    if (!shown) return;
    const id = window.setTimeout(() => setShown(null), 1900);
    return () => window.clearTimeout(id);
  }, [shown]);

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 bottom-[26%] z-30 pointer-events-none"
      aria-live="polite"
    >
      <AnimatePresence>
        {shown && (
          <motion.div
            key={`${shown.v}-${shown.text}`}
            initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
            transition={{ duration: 0.45, ease: easings.cinematic }}
            className="font-display italic text-bone/85 text-xl md:text-2xl tracking-tight"
          >
            {shown.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

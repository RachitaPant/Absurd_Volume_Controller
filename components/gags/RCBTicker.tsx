"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

const BASE_SCORE = "RCB 47/4 (8.2 ov) | KKR 89/2 (12.0 ov) | RCB 47/4 (8.2 ov)";
const CHAMPION_FLASH = "★ RCB ARE CHAMPIONS ★ IPL 2025 ★ WE DID IT ★";

export function RCBTicker() {
  const [flashChampion, setFlashChampion] = useState(false);
  const timerRef = useRef<number | null>(null);

  // 1% chance every 30 seconds to briefly show the truth
  useEffect(() => {
    const id = window.setInterval(() => {
      if (Math.random() < 0.01) {
        setFlashChampion(true);
        timerRef.current = window.setTimeout(() => {
          setFlashChampion(false);
        }, 2800);
      }
    }, 30_000);
    return () => {
      window.clearInterval(id);
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div
      className="fixed bottom-0 left-0 right-0 h-6 overflow-hidden z-30 flex items-center"
      style={{
        background: "linear-gradient(90deg, #cc0000 0%, #1a0000 100%)",
        borderTop: "1px solid rgba(204,0,0,0.4)",
      }}
    >
      <AnimatePresence mode="wait">
        {flashChampion ? (
          <motion.div
            key="champion"
            className="absolute inset-0 flex items-center justify-center gap-2 hud text-[10px] font-bold tracking-[0.2em] text-yellow-300"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ background: "linear-gradient(90deg, #7a5c00, #cc9900, #7a5c00)" }}
          >
            {CHAMPION_FLASH}
          </motion.div>
        ) : (
          <motion.div
            key="normal"
            className="absolute inset-0 flex items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* scrolling ticker */}
            <motion.div
              className="whitespace-nowrap hud text-[10px] text-white/80 tracking-[0.12em]"
              animate={{ x: ["100vw", "-200%"] }}
              transition={{
                duration: 22,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              {BASE_SCORE}&nbsp;&nbsp;&nbsp;·&nbsp;&nbsp;&nbsp;{BASE_SCORE}
            </motion.div>
            {/* ...sorry, was that out loud? -- after champion flash */}
          </motion.div>
        )}
      </AnimatePresence>

      {/* LIVE badge */}
      <div
        className="absolute right-2 hud text-[8px] text-white/70 flex items-center gap-1"
      >
        <span
          className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block"
          style={{ animation: "pulse 1.2s ease-in-out infinite" }}
        />
        LIVE
      </div>
    </div>
  );
}

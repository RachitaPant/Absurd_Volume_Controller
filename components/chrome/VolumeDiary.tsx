"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useEasterEggStore } from "@/lib/state/use-easter-egg-store";
import { easings } from "@/lib/utils/easings";
import { play } from "@/lib/audio/presets";

// A side panel listing every diary entry the cursed knob ever wrote about you.
export function VolumeDiary() {
  const [open, setOpen] = useState(false);
  const diary = useEasterEggStore((s) => s.diary);

  return (
    <>
      <button
        className="fixed top-1/2 right-0 -translate-y-1/2 z-30 px-3 py-2 rounded-l-md hud bg-smoke/60 backdrop-blur border border-r-0 border-bone/15 text-bone/55 hover:text-bone"
        onClick={() => {
          setOpen((o) => !o);
          play("knob-tick", 0.3);
        }}
        aria-expanded={open}
      >
        DIARY
        <span className="ml-2 tnum text-bone">{diary.length}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.aside
            className="fixed top-0 right-0 bottom-0 w-[min(92vw,28rem)] z-40 bg-smoke/85 backdrop-blur-md border-l border-bone/15 flex flex-col"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.5, ease: easings.cinematic }}
            aria-label="Volume diary"
          >
            <div className="flex items-baseline justify-between px-5 py-4 border-b border-bone/10">
              <h2 className="font-display italic text-bone text-2xl">the diary</h2>
              <button
                className="hud text-bone/40 hover:text-bone"
                onClick={() => setOpen(false)}
                aria-label="Close diary"
              >
                CLOSE
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 text-bone/85">
              {diary.length === 0 && (
                <p className="hud text-bone/40 text-center mt-12">
                  the knob has not yet been moved to write.
                </p>
              )}
              {diary.map((entry) => (
                <div key={entry.ts} className="border-b border-bone/5 pb-3">
                  <div className="hud text-bone/40 mb-1">
                    {new Date(entry.ts).toLocaleString()}
                  </div>
                  <p className="font-display italic text-base leading-relaxed">
                    {entry.text}
                  </p>
                </div>
              ))}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}

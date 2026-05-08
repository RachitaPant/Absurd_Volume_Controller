"use client";

import { motion, AnimatePresence } from "motion/react";
import { useEffect } from "react";
import { useVolumeStore } from "@/lib/state/use-volume-store";
import { play } from "@/lib/audio/presets";

// Past 100% the UI starts to crack. Full crash sequence and physics-blown
// shards are the Phase 4 promise; for now we ship the language and the
// chromatic aberration so it FEELS like the world is breaking.
export function OverloadOverlay() {
  const master = useVolumeStore((s) => s.master);
  const overloaded = master > 100;
  const past150 = master > 150;
  const past200 = master > 200;

  // change document title when overloaded
  useEffect(() => {
    if (typeof document === "undefined") return;
    const original = "VOLUMETRIC HUBRIS // v4.7.0";
    document.title = overloaded ? "🔊 EVERYONE CAN HEAR THIS 🔊" : original;
    return () => {
      document.title = original;
    };
  }, [overloaded]);

  // sfx burst when crossing 100
  useEffect(() => {
    if (overloaded) play("glass-shatter", 0.55);
  }, [overloaded]);

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
          {/* chromatic aberration overlay */}
          <motion.div
            aria-hidden
            className="absolute inset-0"
            style={{
              boxShadow: `inset 0 0 120px ${past200 ? "#ff1a1a" : "#ff4d6d"}, inset 0 0 240px rgba(0,0,0,0.6)`,
              mixBlendMode: "screen",
            }}
            animate={{ opacity: [0.55, 0.75, 0.55] }}
            transition={{ duration: 0.4, repeat: Infinity }}
          />

          {/* fake stack overflow */}
          {overloaded && (
            <motion.div
              className="absolute top-24 left-1/2 -translate-x-1/2 max-w-[640px] w-[min(92vw,640px)]"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="bg-[#202225] border border-white/10 rounded font-mono text-xs text-[#e7e7e7] shadow-2xl">
                <div className="px-3 py-1.5 border-b border-white/10 flex items-center gap-2 text-[#9aa0a6]">
                  <span className="w-2 h-2 rounded-full bg-[#ff5f56]" />
                  <span className="w-2 h-2 rounded-full bg-[#ffbd2e]" />
                  <span className="w-2 h-2 rounded-full bg-[#27c93f]" />
                  <span className="ml-2">DevTools — Console</span>
                </div>
                <div className="p-3 leading-snug">
                  <div className="text-[#ff8a8a]">
                    Uncaught RangeError: Volume exceeded representable bounds
                  </div>
                  <div className="text-[#9aa0a6] pl-4">
                    at GainNode.gain (<span className="text-[#82aaff]">audio-engine.ts</span>:88:17)
                    <br />
                    at AudioEngineImpl.setDisplayVolume (<span className="text-[#82aaff]">audio-engine.ts</span>:104:9)
                    <br />
                    at <span className="text-[#82aaff]">VolumeStore</span>.subscribe.cb (<span className="text-[#82aaff]">use-audio-bridge.ts</span>:14:13)
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* macOS HR notification at 150 */}
          <AnimatePresence>
            {past150 && (
              <motion.div
                className="absolute top-6 right-6 max-w-sm bg-white/95 text-black rounded-2xl shadow-2xl p-4 backdrop-blur"
                initial={{ x: 320, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 320, opacity: 0 }}
                transition={{ duration: 0.45 }}
              >
                <div className="text-[10px] uppercase tracking-wider text-zinc-500">
                  System Notification
                </div>
                <div className="text-sm font-semibold mt-1">
                  Your speakers have requested a meeting with HR.
                </div>
                <div className="text-xs mt-1 text-zinc-600">
                  They will be available between 4:00 PM and 4:15 PM. They are
                  unionized.
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* full takeover at 200 */}
          <AnimatePresence>
            {past200 && (
              <motion.div
                className="absolute inset-0 bg-void flex items-center justify-center pointer-events-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1 }}
              >
                <div className="text-center max-w-2xl px-6">
                  <p className="font-display text-6xl md:text-7xl text-bone">
                    you did this.
                  </p>
                  <button
                    className="mt-12 hud text-bone/40 hover:text-bone underline underline-offset-4"
                    onClick={() => useVolumeStore.getState().setMaster(50)}
                  >
                    i learn nothing from this →
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

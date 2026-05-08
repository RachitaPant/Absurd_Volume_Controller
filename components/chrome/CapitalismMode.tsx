"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useVolumeStore } from "@/lib/state/use-volume-store";
import { useEasterEggStore } from "@/lib/state/use-easter-egg-store";
import { easings } from "@/lib/utils/easings";

const ADS = [
  "PROMOTED ▶ a louder version of yourself awaits at $9.99/mo.",
  "FROM OUR PARTNERS ▶ are your eardrums working hard or hardly working?",
  "NEW ▶ Premium Volume Plus™ — adds the number 4 to your range.",
  "DID YOU HEAR? ▶ this banner is sponsored by perception itself.",
];

// Ctrl+Shift+L toggles a class on <html>. This component reads it and renders
// the full late-stage capitalism layer when active: cookie banner, banner ad,
// premium-volume paywall.
export function CapitalismMode() {
  const [active, setActive] = useState(false);
  const [cookieAccepted, setCookieAccepted] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const master = useVolumeStore((s) => s.master);
  const pushToast = useEasterEggStore((s) => s.pushToast);

  // Listen for class toggle on html.late-stage-capitalism (set by GlobalShortcuts)
  if (typeof document !== "undefined") {
    const cls = document.documentElement.classList;
    const observed = cls.contains("late-stage-capitalism");
    if (observed !== active) {
      // Defer state update so it doesn't run during render
      queueMicrotask(() => setActive(observed));
    }
  }

  // Show paywall when user crosses 50 in capitalism mode.
  if (active && !paywallOpen && master > 50) {
    queueMicrotask(() => {
      setPaywallOpen(true);
      pushToast({
        text: "PREMIUM VOLUME REQUIRED past 50%. (just click 'no thanks'.)",
        flavor: "warn",
      });
    });
  }

  if (!active) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="capitalism"
        className="fixed inset-0 pointer-events-none z-[140]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* banner ad strip */}
        <motion.div
          className="absolute top-0 inset-x-0 px-4 py-3 pointer-events-auto"
          style={{
            background: "linear-gradient(90deg, #ff4d6d, #f5b56a)",
            color: "#08080a",
          }}
          initial={{ y: -50 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.5, ease: easings.cinematic }}
        >
          <div className="text-center font-bold tracking-wide text-sm">
            {ADS[Math.floor((master / 100) * ADS.length) % ADS.length]}
          </div>
        </motion.div>

        {/* cookie banner */}
        <AnimatePresence>
          {!cookieAccepted && (
            <motion.div
              className="absolute bottom-6 left-1/2 -translate-x-1/2 max-w-[640px] w-[min(92vw,640px)] bg-bone text-void rounded-lg shadow-2xl p-4 flex items-center gap-4 pointer-events-auto"
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex-1 text-sm leading-snug">
                <strong>We use 47 cookies</strong> to ensure that this volume
                experience is even louder than it appears. By scrolling,
                clicking, or breathing, you consent to all 47.
              </div>
              <button
                className="px-4 py-2 rounded bg-void text-bone hud whitespace-nowrap"
                onClick={() => setCookieAccepted(true)}
              >
                ACCEPT ALL
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* paywall */}
      <AnimatePresence>
        {paywallOpen && (
          <motion.div
            key="paywall"
            className="fixed inset-0 z-[170] bg-void/90 backdrop-blur flex items-center justify-center p-4 pointer-events-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-smoke border border-bone/15 rounded p-8 w-[min(92vw,520px)] text-center"
              initial={{ y: 30, scale: 0.94 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 30, scale: 0.94 }}
              transition={{ duration: 0.5, ease: easings.cinematic }}
            >
              <div className="hud text-bone/40 tracking-[0.3em]">UPGRADE REQUIRED</div>
              <h3 className="font-display italic text-3xl text-bone mt-3">
                premium volume
              </h3>
              <p className="text-bone/70 mt-3 mb-6 leading-relaxed">
                you have exceeded the free volume tier (50%). subscribe for{" "}
                <span className="text-bone font-bold">$9.99/mo</span> to
                continue, or click below to abandon the bit.
              </p>
              <div className="flex gap-3 justify-center">
                <button className="px-5 py-3 rounded-full bg-bone text-void font-bold tracking-wider">
                  UPGRADE
                </button>
                <button
                  className="hud text-bone/40 hover:text-bone underline"
                  onClick={() => setPaywallOpen(false)}
                >
                  no thanks →
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
}

"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useBhaiStore } from "@/lib/state/use-bhai-store";
import { useEasterEggStore } from "@/lib/state/use-easter-egg-store";
import { MOM } from "@/lib/copy/mom";
import { play } from "@/lib/audio/presets";

export function WhatsAppMomCall() {
  const callActive = useBhaiStore((s) => s.momCallActive);
  const declineCount = useBhaiStore((s) => s.momDeclineCount);
  const setMomCallActive = useBhaiStore((s) => s.setMomCallActive);
  const incrementDecline = useBhaiStore((s) => s.incrementMomDecline);
  const pushToast = useEasterEggStore((s) => s.pushToast);
  const timerRef = useRef<number | null>(null);

  // Trigger call every 4 minutes
  useEffect(() => {
    const schedule = () => {
      timerRef.current = window.setTimeout(() => {
        setMomCallActive(true);
        play("whatsapp-thunk", 0.7);
        // schedule next regardless of answer/decline
        schedule();
      }, MOM.intervalMs);
    };
    // First call after 4 minutes (not immediately)
    schedule();
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAnswer = () => {
    setMomCallActive(false);
    pushToast({ text: MOM.answerDismiss, flavor: "info" });
    play("whatsapp-thunk", 0.4);
  };

  const handleDecline = () => {
    setMomCallActive(false);
    incrementDecline();
    const newCount = useBhaiStore.getState().momDeclineCount;
    if (newCount >= 5) {
      pushToast({ text: MOM.declineTiers[4], flavor: "warn" });
      play("shehnai", 0.3);
    }
  };

  return (
    <AnimatePresence>
      {callActive && (
        <motion.div
          key="mom-call"
          className="fixed bottom-32 left-4 z-50 w-72 rounded-2xl overflow-hidden shadow-2xl"
          initial={{ x: -320, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -320, opacity: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 28 }}
          style={{
            background: "linear-gradient(135deg, #1a3a2a 0%, #0d1f18 100%)",
            border: "1px solid rgba(37,211,102,0.3)",
          }}
        >
          {/* WhatsApp green header */}
          <div
            className="px-4 py-2 flex items-center gap-2"
            style={{ background: "rgba(37,211,102,0.15)" }}
          >
            <div className="text-[10px] tracking-wider font-bold" style={{ color: "#25d366" }}>
              WHATSAPP
            </div>
            <div className="text-[9px] text-white/50 ml-auto">incoming video call</div>
          </div>

          {/* Avatar + name */}
          <div className="px-4 py-4 flex items-center gap-3">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-3xl shrink-0"
              style={{ background: "rgba(37,211,102,0.12)", border: "2px solid rgba(37,211,102,0.4)" }}
            >
              👩
            </div>
            <div>
              <div className="text-white font-semibold text-base leading-tight">
                {MOM.callerId}
              </div>
              <div className="text-white/50 text-xs mt-0.5">{MOM.callSubtitle}</div>
              {declineCount > 0 && (
                <div className="text-white/35 text-[9px] mt-1 italic">
                  {MOM.declineTiers[Math.min(declineCount - 1, 3)]}
                </div>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex">
            <button
              className="flex-1 py-3 text-sm font-semibold tracking-wide border-t flex flex-col items-center gap-1"
              style={{
                borderColor: "rgba(37,211,102,0.2)",
                color: "rgba(255,255,255,0.4)",
                borderRight: "1px solid rgba(37,211,102,0.2)",
              }}
              onClick={handleDecline}
            >
              <span className="text-xl">📵</span>
              <span className="text-[10px]">{MOM.declineLabel}</span>
            </button>
            <button
              className="flex-1 py-3 text-sm font-semibold tracking-wide border-t flex flex-col items-center gap-1"
              style={{
                borderColor: "rgba(37,211,102,0.2)",
                color: "#25d366",
              }}
              onClick={handleAnswer}
            >
              <span className="text-xl">📞</span>
              <span className="text-[10px]">{MOM.answerLabel}</span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

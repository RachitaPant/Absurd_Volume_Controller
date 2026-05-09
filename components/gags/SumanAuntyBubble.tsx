"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useBhaiStore } from "@/lib/state/use-bhai-store";
import { SUMAN } from "@/lib/copy/suman";

export function SumanAuntyBubble() {
  const visible = useBhaiStore((s) => s.sumanVisible);
  const message = useBhaiStore((s) => s.sumanMessage);
  const hideSuman = useBhaiStore((s) => s.hideSuman);

  // Auto-dismiss after 6s
  useEffect(() => {
    if (!visible) return;
    const id = window.setTimeout(() => hideSuman(), 6000);
    return () => window.clearTimeout(id);
  }, [visible, message, hideSuman]);

  return (
    <AnimatePresence>
      {visible && message && (
        <motion.div
          key={message}
          className="fixed bottom-32 right-4 z-50 max-w-[280px]"
          initial={{ x: 320, opacity: 0, scale: 0.85 }}
          animate={{ x: 0, opacity: 1, scale: 1 }}
          exit={{ x: 320, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {/* WhatsApp-green speech bubble */}
          <div
            className="relative rounded-2xl rounded-br-sm px-4 py-3 shadow-2xl"
            style={{
              background: "#1a3a2a",
              border: "1px solid rgba(37,211,102,0.35)",
            }}
          >
            {/* sender header */}
            <div className="flex items-center gap-2 mb-2 pb-1.5" style={{ borderBottom: "1px solid rgba(37,211,102,0.15)" }}>
              <span className="text-xl">{SUMAN.avatar}</span>
              <div>
                <div className="text-[11px] font-semibold" style={{ color: "#25d366" }}>
                  {SUMAN.name}
                </div>
                <div className="text-[9px] text-white/40">HR Department</div>
              </div>
              <button
                className="ml-auto text-white/30 hover:text-white/60 text-xs"
                onClick={hideSuman}
              >
                ✕
              </button>
            </div>

            <p className="text-white/90 text-sm leading-relaxed">{message}</p>

            {/* timestamp */}
            <div className="text-right mt-1.5">
              <span className="text-[9px] text-white/30">
                {new Date().toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                ✓✓
              </span>
            </div>

            {/* tail */}
            <div
              className="absolute bottom-0 right-0 translate-x-1/2 translate-y-0"
              style={{
                width: 0,
                height: 0,
                borderLeft: "8px solid transparent",
                borderTop: "8px solid #1a3a2a",
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

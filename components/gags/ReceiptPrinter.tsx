"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useBhaiStore } from "@/lib/state/use-bhai-store";
import { useVolumeStore } from "@/lib/state/use-volume-store";
import {
  RECEIPT_REASONS,
  RECEIPT_HEADER,
  RECEIPT_TAGLINE,
  RECEIPT_FOOTER,
} from "@/lib/copy/receipts";
import { play } from "@/lib/audio/presets";

export function ReceiptPrinter() {
  const addReceipt = useBhaiStore((s) => s.addReceipt);
  const removeReceipt = useBhaiStore((s) => s.removeReceipt);
  const receipts = useBhaiStore((s) => s.receipts);
  const lastReceiptVolume = useBhaiStore((s) => s.lastReceiptVolume);
  const setLastReceiptVolume = useBhaiStore((s) => s.setLastReceiptVolume);
  const master = useVolumeStore((s) => s.master);
  const lastMasterRef = useRef(master);

  // Print receipt when volume changes by >= 5%
  useEffect(() => {
    const diff = Math.abs(master - lastReceiptVolume);
    if (diff >= 5) {
      const reason =
        RECEIPT_REASONS[Math.floor(Math.random() * RECEIPT_REASONS.length)];
      addReceipt(reason, Math.round(master));
      setLastReceiptVolume(master);
      play("printer-brrr", 0.5);
    }
    lastMasterRef.current = master;
  }, [master, lastReceiptVolume, addReceipt, setLastReceiptVolume]);

  // Auto-remove receipts after 8s
  useEffect(() => {
    if (!receipts.length) return;
    const oldest = receipts[0];
    const age = Date.now() - oldest.ts;
    const remaining = Math.max(0, 8000 - age);
    const id = window.setTimeout(() => removeReceipt(oldest.id), remaining);
    return () => window.clearTimeout(id);
  }, [receipts, removeReceipt]);

  return (
    <div className="fixed left-4 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-2 max-w-[200px]">
      <AnimatePresence>
        {receipts.map((r) => (
          <motion.div
            key={r.id}
            className="font-mono text-[9px] leading-tight cursor-pointer"
            style={{
              background: "#f5f2e8",
              color: "#1a1a1a",
              padding: "8px 10px",
              borderRadius: 2,
              boxShadow: "3px 3px 0 rgba(0,0,0,0.25)",
              // torn paper top edge
              clipPath:
                "polygon(0 3px,4px 0,8px 3px,12px 0,16px 3px,20px 0,24px 3px,28px 0,32px 3px,100% 2px,100% 100%,0 100%)",
            }}
            initial={{ y: -60, opacity: 0, scaleY: 0.2, originY: 0 }}
            animate={{ y: 0, opacity: 1, scaleY: 1 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ type: "spring", stiffness: 240, damping: 22 }}
            onClick={() => removeReceipt(r.id)}
          >
            <div className="text-center font-bold tracking-wider border-b border-dashed border-black/20 pb-1 mb-1">
              {RECEIPT_HEADER}
            </div>
            <div className="text-center text-[8px] text-black/50 mb-1">{RECEIPT_TAGLINE}</div>
            <div className="border-b border-dashed border-black/20 pb-1 mb-1">
              <div className="flex justify-between">
                <span>VOL CHANGE</span>
                <span className="font-bold">{r.volume}%</span>
              </div>
              <div className="flex justify-between">
                <span>REASON</span>
              </div>
              <div className="text-[8px] text-black/70 mt-0.5">{r.reason}</div>
            </div>
            <div className="text-center text-[7px] text-black/40 space-y-0.5">
              {RECEIPT_FOOTER.map((l, i) => (
                <div key={i}>{l}</div>
              ))}
            </div>
            <div className="text-center text-[8px] text-black/30 mt-1">
              {new Date(r.ts).toLocaleTimeString("en-IN")}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

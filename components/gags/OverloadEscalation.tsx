"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useVolumeStore } from "@/lib/state/use-volume-store";
import { useBhaiStore } from "@/lib/state/use-bhai-store";
import { useEasterEggStore } from "@/lib/state/use-easter-egg-store";
import { OVERLOAD } from "@/lib/copy/overload";
import { play } from "@/lib/audio/presets";

export function OverloadEscalation() {
  const master = useVolumeStore((s) => s.master);
  const setMaster = useVolumeStore((s) => s.setMaster);
  const showSuman = useBhaiStore((s) => s.showSuman);
  const pushToast = useEasterEggStore((s) => s.pushToast);
  const [showModal, setShowModal] = useState(false);
  const [showPivot, setShowPivot] = useState(false);
  const [modalAccepted, setModalAccepted] = useState(false);

  const over101 = master > 101 && master < 130;
  const over130 = master >= 130 && master < 160;
  const over160 = master >= 160;

  // 101% banner
  useEffect(() => {
    if (over101) {
      pushToast({ text: OVERLOAD.bp.banner, flavor: "warn" });
      showSuman(OVERLOAD.bp.sub);
    }
  }, [over101]); // eslint-disable-line react-hooks/exhaustive-deps

  // 130% modal
  useEffect(() => {
    if (over130 && !modalAccepted) {
      setShowModal(true);
      play("shehnai", 0.4);
    }
  }, [over130]); // eslint-disable-line react-hooks/exhaustive-deps

  // 160% pivot sequence
  useEffect(() => {
    if (!over160) return;
    setShowModal(false);
    setShowPivot(true);
    play("supernova", 0.5);

    // After 4s silence → reset to 23%
    const id = window.setTimeout(() => {
      setMaster(OVERLOAD.pivot.resetVolume);
      setShowPivot(false);
      setModalAccepted(false);
      window.setTimeout(() => {
        showSuman(OVERLOAD.pivot.sumanAfter);
      }, 800);
    }, 4000);
    return () => window.clearTimeout(id);
  }, [over160]); // eslint-disable-line react-hooks/exhaustive-deps

  const acceptModal = () => {
    setShowModal(false);
    setModalAccepted(true);
  };

  return (
    <>
      {/* 101% BP banner — fixed top center */}
      <AnimatePresence>
        {over101 && (
          <motion.div
            key="bp-banner"
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 hud text-[10px] tracking-[0.18em] px-5 py-2 rounded-sm"
            style={{
              background: "rgba(255,77,109,0.15)",
              border: "1px solid rgba(255,77,109,0.5)",
              color: "#FF4D6D",
            }}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
          >
            {OVERLOAD.bp.banner}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 130% offer letter modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            key="offer-modal"
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="max-w-md w-[min(90vw,28rem)] bg-[#f5f2e8] text-[#1a1a1a] rounded-sm shadow-2xl overflow-hidden"
              initial={{ scale: 0.85, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.85, y: 20 }}
              style={{ fontFamily: "monospace" }}
            >
              {/* letterhead */}
              <div
                className="px-6 py-3 text-center"
                style={{ background: "#cc2200", color: "#fff" }}
              >
                <div className="text-xs tracking-[0.4em] font-bold">
                  BHAI BHAI ENTERPRISES PVT. LTD.
                </div>
                <div className="text-[9px] tracking-[0.2em] opacity-70">
                  HUMAN RESOURCES DIVISION
                </div>
              </div>

              <div className="px-6 py-5 space-y-3 text-xs leading-relaxed">
                <div className="text-center font-bold tracking-[0.3em] text-sm border-b border-dashed border-black/20 pb-3">
                  {OVERLOAD.offerLetter.heading}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-black/50">New Designation:</span>
                    <span className="font-bold text-red-700">
                      {OVERLOAD.offerLetter.newTitle}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-black/50">Revised CTC:</span>
                    <span className="font-bold">
                      {OVERLOAD.offerLetter.newSalary}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-black/50">Salary Note:</span>
                    <span className="italic text-black/60">
                      {OVERLOAD.offerLetter.salaryNote}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-black/50">Benefits:</span>
                    <span>{OVERLOAD.offerLetter.benefits}</span>
                  </div>
                </div>

                <div className="border-t border-dashed border-black/20 pt-3 text-[10px] italic text-black/60">
                  {OVERLOAD.offerLetter.sumanNote}
                </div>

                <div className="text-right text-[10px] text-black/40">
                  — {OVERLOAD.offerLetter.signatoryName},{" "}
                  {OVERLOAD.offerLetter.signatoryTitle}
                </div>

                <button
                  className="w-full py-2.5 text-xs tracking-[0.2em] font-bold mt-2 rounded-sm"
                  style={{ background: "#cc2200", color: "#fff" }}
                  onClick={acceptModal}
                >
                  {OVERLOAD.offerLetter.ctaLabel}
                </button>
                <div className="text-center text-[8px] text-black/30">
                  {OVERLOAD.offerLetter.ctaSubtext}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 160% pivot sequence */}
      <AnimatePresence>
        {showPivot && (
          <motion.div
            key="pivot"
            className="fixed inset-0 z-[200] bg-void flex flex-col items-center justify-center pointer-events-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.0 }}
          >
            <motion.div
              className="max-w-lg w-full mx-6 font-mono"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              {/* email client mockup */}
              <div
                className="rounded-sm overflow-hidden shadow-2xl"
                style={{ background: "#1c1c22", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                <div
                  className="px-4 py-2 flex gap-2 items-center text-[9px] text-white/40"
                  style={{ background: "#141418", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <span className="w-2 h-2 rounded-full bg-[#ff5f56]" />
                  <span className="w-2 h-2 rounded-full bg-[#ffbd2e]" />
                  <span className="w-2 h-2 rounded-full bg-[#27c93f]" />
                  <span className="ml-2 tracking-wider">Gmail — Inbox</span>
                </div>
                <div className="px-5 py-4 space-y-2 text-xs text-white/70">
                  <div className="flex gap-2 text-[10px] text-white/40">
                    <span className="text-white/25">FROM</span>
                    <span>{OVERLOAD.pivot.emailFrom}</span>
                  </div>
                  <div className="flex gap-2 text-[10px] text-white/40">
                    <span className="text-white/25">DATE</span>
                    <span>{OVERLOAD.pivot.emailDate}</span>
                  </div>
                  <div className="flex gap-2 text-[10px] text-white/40">
                    <span className="text-white/25">SUBJ</span>
                    <span className="text-white/60">{OVERLOAD.pivot.emailSubject}</span>
                  </div>
                  <div
                    className="mt-3 pt-3 text-white/80 leading-relaxed"
                    style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    {OVERLOAD.pivot.emailBody}
                  </div>
                </div>
              </div>
              <div className="text-center mt-6 hud text-bone/30 text-[10px] tracking-[0.3em]">
                {OVERLOAD.pivot.fadeText}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

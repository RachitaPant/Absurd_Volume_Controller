"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useDecibels } from "@/lib/hooks/use-decibels";
import { useVolumeStore } from "@/lib/state/use-volume-store";
import { useBhaiStore } from "@/lib/state/use-bhai-store";
import { getVuLabel } from "@/lib/copy/vu-meter";
import { play } from "@/lib/audio/presets";

export function MicButton() {
  const [granted, setGranted] = useState(false);
  const [holding, setHolding] = useState(false);
  const decibels = useDecibels(granted);

  const setMaster = useVolumeStore((s) => s.setMaster);
  const setScream = useVolumeStore((s) => s.setScream);
  const selectedPlanet = useBhaiStore((s) => s.selectedPlanet);
  const showSuman = useBhaiStore((s) => s.showSuman);
  const sumanVisible = useBhaiStore((s) => s.sumanVisible);

  const screamStartRef = useRef<number | null>(null);
  const firstScreamRef = useRef(false);
  const firstSumanRef = useRef(false);
  const sustainedSumanRef = useRef(false);

  // Drive volume while button is held + mic is live
  useEffect(() => {
    if (!granted) return;
    const id = window.setInterval(() => {
      const lvl = decibels.level;
      setScream(lvl);

      if (!holding) return;

      const cur = useVolumeStore.getState().master;

      if (lvl > 0.04) {
        const tgt = Math.min(120, 30 + lvl * 320);
        setMaster(cur + (tgt - cur) * 0.18);

        // First scream → Suman Aunty welcome
        if (!firstSumanRef.current && !sumanVisible) {
          firstSumanRef.current = true;
          window.setTimeout(() => {
            const { sumanVisible: sv } = useBhaiStore.getState();
            if (!sv) {
              import("@/lib/copy/suman").then(({ SUMAN }) => {
                useBhaiStore.getState().showSuman(SUMAN.welcome);
              });
            }
          }, 600);
        }

        // Sustained scream > 3s → Suman Aunty tier 2
        if (lvl > 0.14) {
          if (screamStartRef.current === null) {
            screamStartRef.current = performance.now();
          } else if (
            performance.now() - screamStartRef.current > 3000 &&
            !sustainedSumanRef.current
          ) {
            sustainedSumanRef.current = true;
            import("@/lib/copy/suman").then(({ SUMAN }) => {
              useBhaiStore.getState().showSuman(SUMAN.sustainedScream);
            });
            play("tabla", 0.3);
          }
        } else {
          screamStartRef.current = null;
        }
      } else if (lvl < 0.012 && holding) {
        // Drift back gently to 23 if screaming but silent
        setMaster(cur + (23 - cur) * 0.04);
      }
    }, 80);
    return () => window.clearInterval(id);
  }, [granted, holding, decibels.level, setMaster, setScream, sumanVisible]);

  const handlePress = () => {
    if (!granted) {
      setGranted(true);
      firstScreamRef.current = true;
    }
    setHolding(true);
    play("tabla", 0.2);
  };

  const handleRelease = () => {
    setHolding(false);
    sustainedSumanRef.current = false;
    screamStartRef.current = null;
  };

  const vuInfo = getVuLabel(Math.min(1, decibels.level * 6));
  const meterPct = Math.min(100, decibels.level * 600);

  return (
    <div className="flex flex-col items-center gap-2 select-none">
      {/* VU meter */}
      <div className="w-48 flex flex-col items-center gap-1">
        <div
          className="hud text-[9px] tracking-[0.2em] transition-colors duration-200"
          style={{ color: vuInfo.color }}
        >
          {granted ? vuInfo.label : "—"}
        </div>
        <div className="w-full h-1.5 rounded-full bg-bone/10 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: vuInfo.color }}
            animate={{ width: `${granted ? meterPct : 0}%` }}
            transition={{ duration: 0.05 }}
          />
        </div>
      </div>

      {/* The button */}
      <motion.button
        className="relative flex flex-col items-center justify-center gap-1 rounded-full border-2 focus:outline-none cursor-pointer"
        style={{
          width: 88,
          height: 88,
          borderColor: holding ? "#FF4D6D" : "rgba(245,242,234,0.25)",
          background: holding
            ? "radial-gradient(circle, rgba(255,77,109,0.18) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(245,242,234,0.05) 0%, transparent 70%)",
          boxShadow: holding
            ? "0 0 32px rgba(255,77,109,0.5), 0 0 64px rgba(255,77,109,0.25)"
            : "none",
        }}
        animate={{ scale: holding ? 0.94 : 1 }}
        transition={{ duration: 0.12 }}
        onPointerDown={handlePress}
        onPointerUp={handleRelease}
        onPointerLeave={handleRelease}
        onPointerCancel={handleRelease}
        aria-label="Hold to yell"
      >
        <span className="text-2xl">{granted ? "🎙️" : "🎤"}</span>
        <span
          className="hud text-[8px] tracking-[0.18em] text-center leading-tight"
          style={{ color: holding ? "#FF4D6D" : "rgba(245,242,234,0.5)" }}
        >
          {!granted
            ? "GRANT MIC"
            : holding
              ? selectedPlanet !== null
                ? "YELLING AT\nPLANET"
                : "YELLING..."
              : "BOL BHAI\nBOL"}
        </span>

        {/* pulse ring while holding */}
        <AnimatePresence>
          {holding && (
            <motion.span
              key="ring"
              className="absolute inset-0 rounded-full border-2 border-[#FF4D6D]"
              initial={{ scale: 1, opacity: 0.7 }}
              animate={{ scale: 1.6, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
          )}
        </AnimatePresence>
      </motion.button>

      {/* hint */}
      {!granted && (
        <div className="hud text-bone/30 text-[9px] text-center">
          microphone required · nothing is recorded
        </div>
      )}
      {granted && !holding && (
        <div className="hud text-bone/25 text-[9px] text-center">
          hold · yell · volume follows
        </div>
      )}
    </div>
  );
}

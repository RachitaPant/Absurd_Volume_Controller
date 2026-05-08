"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { SceneShell } from "./SceneShell";
import { useVolumeStore } from "@/lib/state/use-volume-store";
import { useSceneStore } from "@/lib/state/use-scene-store";
import { useEasterEggStore } from "@/lib/state/use-easter-egg-store";
import { play } from "@/lib/audio/presets";
import { getAudioEngine } from "@/lib/audio/audio-engine";
import { easings } from "@/lib/utils/easings";

const ACCENT = "#D89B4A";

// Lever angle range: -60° (down/0%) to +60° (up/100%). Past 70% the
// resistance ramps non-linearly — drag harder. Too fast and it snaps.
const ANGLE_MIN = -60;
const ANGLE_MAX = 60;

export default function MedievalLeverScene() {
  const introComplete = useSceneStore((s) => s.introComplete);
  const setSceneAccent = useVolumeStore((s) => s.setSceneAccent);
  const setMaster = useVolumeStore((s) => s.setMaster);
  const master = useVolumeStore((s) => s.master);
  const pushToast = useEasterEggStore((s) => s.pushToast);
  const unlock = useEasterEggStore((s) => s.unlock);

  const [effort, setEffort] = useState(0);
  const [broken, setBroken] = useState(false);
  const [balanceMs, setBalanceMs] = useState(0);
  const lastDragSpeed = useRef(0);
  const dragRef = useRef<{ active: boolean; lastY: number; lastT: number } | null>(null);
  const leverRef = useRef<HTMLDivElement>(null);

  useEffect(() => setSceneAccent(ACCENT), [setSceneAccent]);

  const angle = ANGLE_MIN + (master / 100) * (ANGLE_MAX - ANGLE_MIN);

  // Pointer drag = vertical drag, mapped to angle via resistance curve
  useEffect(() => {
    const el = leverRef.current;
    if (!el) return;
    const onDown = (e: PointerEvent) => {
      if (broken) return;
      dragRef.current = { active: true, lastY: e.clientY, lastT: performance.now() };
      el.setPointerCapture(e.pointerId);
      e.preventDefault();
      void getAudioEngine().resume();
    };
    const onMove = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d?.active) return;
      const t = performance.now();
      const dy = d.lastY - e.clientY;
      const dt = (t - d.lastT) / 1000;
      const speed = dt > 0 ? Math.abs(dy / dt) : 0;
      lastDragSpeed.current = speed;

      // resistance grows past 70%
      const cur = useVolumeStore.getState().master;
      const stiffPast70 = cur > 70 ? 1 + (cur - 70) * 0.05 : 1;
      const delta = (dy / 4) / stiffPast70;
      setMaster(Math.max(0, Math.min(100, cur + delta)));
      setEffort(Math.min(1, lastDragSpeed.current / 800));

      // dragged too fast → snap
      if (speed > 1500 && cur > 30) {
        setBroken(true);
        play("glass-shatter", 0.7);
        unlock("lever-snapper");
        pushToast({
          text: "CRACK. blacksmith summoned. ETA 4 seconds.",
          flavor: "warn",
        });
        dragRef.current = null;
        return;
      }

      d.lastY = e.clientY;
      d.lastT = t;
    };
    const onUp = (e: PointerEvent) => {
      if (!dragRef.current) return;
      dragRef.current.active = false;
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {}
      setEffort(0);
      play("knob-tick", 0.4);
    };
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [setMaster, broken, pushToast, unlock]);

  // Repair after 4s
  useEffect(() => {
    if (!broken) return;
    const id = window.setTimeout(() => {
      setBroken(false);
      play("ascend", 0.5);
      pushToast({
        text: "blacksmith arrived. lever restored.",
        flavor: "diary",
      });
    }, 4000);
    return () => window.clearTimeout(id);
  }, [broken, pushToast]);

  // BALANCE ACHIEVED — held at 50% for 7 seconds
  useEffect(() => {
    if (Math.abs(master - 50) > 2) {
      queueMicrotask(() => setBalanceMs(0));
      return;
    }
    const id = window.setInterval(() => {
      setBalanceMs((m) => {
        const next = m + 100;
        if (next >= 7000 && next - 100 < 7000) {
          play("achievement", 0.6);
          unlock("balance-achieved");
          pushToast({
            text: "a peasant runs across the screen yelling BALANCE ACHIEVED.",
            flavor: "achievement",
          });
        }
        return next;
      });
    }, 100);
    return () => window.clearInterval(id);
  }, [master, unlock, pushToast]);

  // Crowd intensity scales with volume
  const crowdMood = master > 80 ? "fervent" : master > 50 ? "engaged" : master > 20 ? "watching" : "bored";

  return (
    <SceneShell>
      {/* dungeon backdrop */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 75%, #2e2218 0%, #14100a 50%, #08080a 100%)",
        }}
      />

      {/* torch flicker glow */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 22% 30%, rgba(216,155,74,0.18) 0%, transparent 35%), radial-gradient(ellipse at 78% 30%, rgba(216,155,74,0.15) 0%, transparent 35%)",
        }}
        animate={{ opacity: [0.7, 0.9, 0.7, 0.85, 0.7] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* narrative */}
      <motion.div
        className="absolute top-[12%] inset-x-0 flex flex-col items-center text-center px-6 pointer-events-none"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: introComplete ? 1 : 0, y: 0 }}
        transition={{ duration: 1.2, delay: 0.3, ease: easings.cinematic }}
      >
        <div className="hud text-bone/40">CURRENTLY</div>
        <div className="font-display italic text-3xl md:text-4xl text-bone mt-1">
          beneath the keep, attending <span style={{ color: ACCENT }}>the lever</span>
        </div>
        <div className="hud text-bone/40 mt-3 max-w-[40rem] mx-auto leading-relaxed">
          drag the iron lever. it has weight. it has feelings. do not yank it.
        </div>
      </motion.div>

      {/* the lever */}
      <div
        ref={leverRef}
        className="absolute left-[14%] bottom-[20%] pointer-events-auto cursor-grab active:cursor-grabbing"
        style={{
          width: 280,
          height: 60,
          transform: `rotate(${-angle}deg)`,
          transformOrigin: "30px 30px",
          touchAction: "none",
          transition: broken ? "transform 0.4s" : "transform 80ms linear",
          opacity: broken ? 0.6 : 1,
        }}
      >
        {/* base pivot */}
        <div
          className="absolute"
          style={{
            left: 0,
            top: 0,
            width: 60,
            height: 60,
            background: "radial-gradient(circle, #1c1c20 30%, #0a0a0c 70%)",
            border: "2px solid #4a4540",
            borderRadius: "50%",
            boxShadow: "inset 0 -4px 8px rgba(0,0,0,0.7), 0 0 30px rgba(0,0,0,0.6)",
          }}
        />
        {/* shaft */}
        <div
          className="absolute"
          style={{
            left: 22,
            top: 22,
            width: 250,
            height: 16,
            background:
              "linear-gradient(180deg, #4a4540 0%, #2c2620 50%, #4a4540 100%)",
            borderRadius: 2,
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), 0 4px 8px rgba(0,0,0,0.6)",
          }}
        />
        {/* handle ball */}
        <div
          className="absolute rounded-full"
          style={{
            right: -10,
            top: 8,
            width: 44,
            height: 44,
            background: "radial-gradient(circle at 30% 30%, #6c6660, #2c2620)",
            boxShadow: "0 0 24px rgba(216,155,74,0.3), inset 0 -4px 8px rgba(0,0,0,0.5)",
            border: "1px solid #5c5650",
          }}
        />
        {broken && (
          <div
            className="absolute inset-0 pointer-events-none flex items-center justify-center"
            style={{ left: 60 }}
          >
            <div className="hud text-[var(--accent)] tracking-[0.3em]">CRACK</div>
          </div>
        )}
      </div>

      {/* effort meter */}
      <div className="absolute left-[14%] bottom-[16%] w-72 hud text-bone/55 pointer-events-none">
        <div className="mb-1 flex justify-between">
          <span>EFFORT</span>
          <span className="tnum text-bone">{Math.round(effort * 100)}</span>
        </div>
        <div className="h-1 bg-bone/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full"
            style={{ background: ACCENT }}
            animate={{ width: `${effort * 100}%` }}
            transition={{ duration: 0.15 }}
          />
        </div>
      </div>

      {/* crowd of 32 */}
      <div className="absolute right-[6%] bottom-[16%] grid grid-cols-8 gap-2 pointer-events-none">
        {Array.from({ length: 32 }).map((_, i) => (
          <Peasant key={i} index={i} mood={crowdMood} master={master} />
        ))}
      </div>
      <div className="absolute right-[6%] bottom-[10%] hud text-bone/55 pointer-events-none">
        CROWD: {crowdMood}
      </div>

      {/* readout */}
      <motion.div
        className="absolute bottom-[8%] left-1/2 -translate-x-1/2 hud text-bone/55 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: introComplete ? 1 : 0 }}
        transition={{ delay: 0.7, duration: 0.6 }}
      >
        LEVER // <span className="tnum text-bone">{Math.round(master)}</span> %
        {balanceMs > 1500 && (
          <span className="ml-3 text-[var(--accent)]">
            balance held: {(balanceMs / 1000).toFixed(1)}s / 7.0s
          </span>
        )}
      </motion.div>

      <AnimatePresence>
        {broken && (
          <motion.div
            className="absolute top-[28%] left-1/2 -translate-x-1/2 px-6 py-3 bg-smoke/90 border border-bone/15 rounded text-center pointer-events-none"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <div className="hud text-bone/40">SYSTEM</div>
            <div className="text-bone font-display italic mt-1">blacksmith summoned. eta 4 hours.</div>
          </motion.div>
        )}
      </AnimatePresence>
    </SceneShell>
  );
}

function Peasant({ index, mood, master }: { index: number; mood: string; master: number }) {
  const intensity = Math.min(1, master / 100);
  const phase = (index * 137) % 628;
  return (
    <motion.div
      className="w-3 h-5 relative"
      animate={{
        y: mood === "bored" ? 0 : [-1, -3 * intensity, -1],
      }}
      transition={{
        duration: 0.6 - intensity * 0.3,
        repeat: Infinity,
        ease: "easeInOut",
        delay: phase / 1000,
      }}
    >
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full"
        style={{ background: "#7c6a52" }}
      />
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2.5 h-3 rounded-sm"
        style={{ background: "#5a4838" }}
      />
    </motion.div>
  );
}

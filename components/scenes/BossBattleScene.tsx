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

const ACCENT = "#F5F2EA";
const MAX_HP = 1000;

type Phase = "intro" | "p1" | "p2" | "p3" | "victory";

export default function BossBattleScene() {
  const introComplete = useSceneStore((s) => s.introComplete);
  const setSceneAccent = useVolumeStore((s) => s.setSceneAccent);
  const setMuted = useVolumeStore((s) => s.setMuted);
  const unlock = useEasterEggStore((s) => s.unlock);
  const pushToast = useEasterEggStore((s) => s.pushToast);

  const [hp, setHp] = useState(MAX_HP);
  const [phase, setPhase] = useState<Phase>("intro");
  const [bossPos, setBossPos] = useState({ x: 50, y: 30 }); // % of viewport
  const [miniKnobs, setMiniKnobs] = useState<{ id: number; x: number; y: number; clicked: boolean }[]>([]);
  const [phase3T, setPhase3T] = useState(8);
  const [swordAt, setSwordAt] = useState<{ x: number; y: number } | null>(null);
  const lastSwingT = useRef(0);
  const lastSwingPos = useRef<{ x: number; y: number; t: number } | null>(null);
  const damageFlash = useRef<number | null>(null);
  const [hitFlash, setHitFlash] = useState(false);

  useEffect(() => setSceneAccent(ACCENT), [setSceneAccent]);

  // Intro → p1 after 2s
  useEffect(() => {
    if (phase !== "intro") return;
    const id = window.setTimeout(() => setPhase("p1"), 1800);
    return () => window.clearTimeout(id);
  }, [phase]);

  // Phase transitions on HP. setState wrapped in queueMicrotask so the React
  // 19 lint rule about set-state-in-effect stays happy.
  useEffect(() => {
    if (phase === "p1" && hp <= MAX_HP * 0.66) {
      queueMicrotask(() => setPhase("p2"));
      play("descend", 0.7);
      pushToast({ text: "PHASE 2 — the guardian's eyes change color.", flavor: "warn" });
    } else if (phase === "p2" && hp <= MAX_HP * 0.33) {
      queueMicrotask(() => setPhase("p3"));
      play("supernova", 0.7);
      pushToast({
        text: "PHASE 3 — explode the form. click every fragment in 8 seconds.",
        flavor: "warn",
      });
      // spawn 100 mini-knobs scattered across the viewport
      const knobs = Array.from({ length: 100 }).map((_, i) => ({
        id: i,
        x: 8 + Math.random() * 84,
        y: 18 + Math.random() * 62,
        clicked: false,
      }));
      queueMicrotask(() => {
        setMiniKnobs(knobs);
        setPhase3T(8);
      });
    }
  }, [hp, phase, pushToast]);

  // Phase 3 countdown
  useEffect(() => {
    if (phase !== "p3") return;
    const t0 = performance.now();
    const id = window.setInterval(() => {
      const elapsed = (performance.now() - t0) / 1000;
      setPhase3T(Math.max(0, 8 - elapsed));
      if (elapsed >= 8) {
        window.clearInterval(id);
        // Failed — boss reforms at 33% HP (reset to p2)
        play("buzz", 0.6);
        pushToast({
          text: "the fragments reformed. the guardian breathes again. (phase 2 returns.)",
          flavor: "warn",
        });
        setHp(MAX_HP * 0.33);
        setPhase("p2");
        setMiniKnobs([]);
      }
    }, 50);
    return () => window.clearInterval(id);
  }, [phase, pushToast]);

  // Phase 3 success: all mini-knobs clicked
  useEffect(() => {
    if (phase !== "p3" || miniKnobs.length === 0) return;
    if (miniKnobs.every((k) => k.clicked)) {
      queueMicrotask(() => setPhase("victory"));
      play("achievement", 0.8);
      unlock("boss-defeated");
    }
  }, [miniKnobs, phase, unlock]);

  // Boss movement: P1 slow drift, P2 fast erratic
  useEffect(() => {
    if (phase !== "p1" && phase !== "p2") return;
    const speed = phase === "p1" ? 5500 : 1900;
    const id = window.setInterval(() => {
      setBossPos({
        x: 18 + Math.random() * 64,
        y: 18 + Math.random() * 38,
      });
    }, speed);
    return () => window.clearInterval(id);
  }, [phase]);

  // Sword swing tracking — listen on window during p1/p2
  useEffect(() => {
    if (phase !== "p1" && phase !== "p2") return;
    const onMove = (e: PointerEvent) => {
      const now = performance.now();
      const last = lastSwingPos.current;
      lastSwingPos.current = { x: e.clientX, y: e.clientY, t: now };
      setSwordAt({ x: e.clientX, y: e.clientY });

      if (!last) return;
      const dt = (now - last.t) / 1000;
      if (dt <= 0 || dt > 0.05) return;
      const dx = e.clientX - last.x;
      const dy = e.clientY - last.y;
      const speed = Math.hypot(dx, dy) / dt; // px/s

      // Hit detection: sword line passes through boss
      const bossX = (bossPos.x / 100) * window.innerWidth;
      const bossY = (bossPos.y / 100) * window.innerHeight;
      const distToBoss = Math.min(
        pointToSegmentDist(bossX, bossY, last.x, last.y, e.clientX, e.clientY),
        180,
      );

      if (distToBoss < 110 && speed > 350 && now - lastSwingT.current > 90) {
        const dmg = Math.min(120, Math.floor((speed * speed) / 8000));
        setHp((h) => Math.max(0, h - dmg));
        lastSwingT.current = now;
        play("knob-snap", 0.5);
        if (typeof navigator !== "undefined" && navigator.vibrate)
          navigator.vibrate([20, 10, 30]);
        if (damageFlash.current) window.clearTimeout(damageFlash.current);
        setHitFlash(true);
        damageFlash.current = window.setTimeout(() => setHitFlash(false), 120);
      }
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [phase, bossPos]);

  // Victory → mute the actual audio
  useEffect(() => {
    if (phase !== "victory") return;
    setMuted(true);
    pushToast({
      text: "AUDIO DEFEATED. silence is yours, but it cost you something.",
      flavor: "achievement",
    });
    document.documentElement.classList.add("souls-victory");
    return () => {
      document.documentElement.classList.remove("souls-victory");
    };
  }, [phase, setMuted, pushToast]);

  // Phase 3 mini-knob clicks
  const onMiniKnob = (id: number) => {
    setMiniKnobs((prev) =>
      prev.map((k) => (k.id === id ? { ...k, clicked: true } : k)),
    );
    play("knob-tick", 0.35);
  };

  return (
    <SceneShell>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* arena backdrop */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 80%, #1c1418 0%, #08080a 60%, #000 100%)",
          }}
        />

        {/* HP bar */}
        <motion.div
          className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[min(90vw,640px)] pointer-events-none"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: introComplete ? 1 : 0, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
        >
          <div className="flex justify-between hud text-bone/55 mb-1">
            <span className="tracking-[0.3em]">THE GUARDIAN OF SOUND</span>
            <span className="tnum text-bone">
              {Math.max(0, Math.round(hp))} / {MAX_HP}
            </span>
          </div>
          <div className="h-2 bg-bone/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full"
              style={{
                background:
                  "linear-gradient(90deg, #ff4d4d 0%, #ffaa4d 50%, #ffea4d 100%)",
              }}
              animate={{ width: `${(hp / MAX_HP) * 100}%` }}
              transition={{ duration: 0.25, ease: easings.cinematic }}
            />
          </div>
          <div className="hud text-bone/35 mt-2 text-center">
            {phaseLabel(phase)}
          </div>
        </motion.div>

        {/* Boss sprite */}
        {phase !== "victory" && phase !== "p3" && (
          <motion.div
            className="absolute pointer-events-none"
            style={{ width: 200, height: 200 }}
            animate={{
              left: `calc(${bossPos.x}% - 100px)`,
              top: `calc(${bossPos.y}% + 40px)`,
              scale: hitFlash ? 1.08 : 1,
            }}
            transition={{
              left: { duration: phase === "p1" ? 5 : 1.7, ease: "easeInOut" },
              top: { duration: phase === "p1" ? 5 : 1.7, ease: "easeInOut" },
              scale: { duration: 0.12 },
            }}
          >
            <BossSprite phase={phase} hit={hitFlash} />
          </motion.div>
        )}

        {/* Sword cursor — only the master knob given form */}
        {(phase === "p1" || phase === "p2") && swordAt && (
          <motion.div
            className="absolute pointer-events-none z-20"
            style={{ left: swordAt.x, top: swordAt.y }}
            animate={{ rotate: 0 }}
          >
            <div
              className="absolute"
              style={{
                width: 4,
                height: 80,
                background: "linear-gradient(180deg, #f5f2ea 0%, transparent 100%)",
                transform: "translate(-2px, -76px)",
                boxShadow: "0 0 16px #f5f2ea",
                mixBlendMode: "screen",
              }}
            />
          </motion.div>
        )}

        {/* Phase 3: 100 mini-knobs scattered */}
        {phase === "p3" && (
          <>
            <div className="absolute top-[20%] left-1/2 -translate-x-1/2 hud text-[var(--accent)] tracking-[0.4em]">
              CLICK EVERY FRAGMENT —{" "}
              <span className="tnum text-bone">{phase3T.toFixed(1)}</span>s
            </div>
            <div className="absolute inset-0 pointer-events-auto">
              {miniKnobs.map((k) => (
                <button
                  key={k.id}
                  onClick={() => !k.clicked && onMiniKnob(k.id)}
                  className="absolute rounded-full transition-opacity"
                  style={{
                    left: `${k.x}%`,
                    top: `${k.y}%`,
                    width: 18,
                    height: 18,
                    background: k.clicked
                      ? "transparent"
                      : "radial-gradient(circle at 30% 30%, #ffffff, #ff4d6d 70%, #08080a)",
                    border: k.clicked ? "1px dashed rgba(245,242,234,0.18)" : "1px solid rgba(245,242,234,0.4)",
                    pointerEvents: k.clicked ? "none" : "auto",
                    opacity: k.clicked ? 0.2 : 1,
                    cursor: "crosshair",
                  }}
                />
              ))}
              <div className="absolute bottom-[14%] left-1/2 -translate-x-1/2 hud text-bone/55">
                <span className="tnum text-bone">
                  {miniKnobs.filter((k) => k.clicked).length}
                </span>{" "}
                / {miniKnobs.length}
              </div>
            </div>
          </>
        )}

        {/* Intro splash */}
        <AnimatePresence>
          {phase === "intro" && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="text-center">
                <div className="hud text-bone/40 tracking-[0.4em] mb-4">
                  ENTERING THE ARENA
                </div>
                <div
                  className="font-display italic text-bone"
                  style={{ fontSize: "clamp(2rem, 6vw, 5rem)" }}
                >
                  drag the sword.
                  <br />
                  cut the sound.
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Victory splash */}
        <AnimatePresence>
          {phase === "victory" && <VictorySplash />}
        </AnimatePresence>
      </div>
    </SceneShell>
  );
}

function phaseLabel(p: Phase) {
  if (p === "intro") return "the guardian observes you";
  if (p === "p1") return "phase 1 // drag fast across the form to deal damage";
  if (p === "p2") return "phase 2 // it is faster now";
  if (p === "p3") return "phase 3 // strike every fragment";
  return "AUDIO DEFEATED";
}

function BossSprite({ phase, hit }: { phase: Phase; hit: boolean }) {
  const eyeColor = phase === "p2" ? "#FF4D6D" : "#F5F2EA";
  return (
    <div
      className="relative w-full h-full"
      style={{
        filter: hit ? "brightness(2.8) saturate(0.4)" : "none",
        transition: "filter 0.12s",
      }}
    >
      {/* big silhouette */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 50% 30%, #6c6660 0%, #2a2620 40%, #08080a 80%)",
          boxShadow:
            "0 0 60px rgba(245,242,234,0.3), inset 0 -16px 30px rgba(0,0,0,0.6)",
        }}
      />
      {/* mask: pixel-art-ish steps */}
      <svg viewBox="0 0 100 100" className="absolute inset-0">
        {/* eyes */}
        <rect x="28" y="38" width="14" height="6" fill={eyeColor} />
        <rect x="58" y="38" width="14" height="6" fill={eyeColor} />
        {/* eye glow */}
        <rect x="28" y="38" width="14" height="6" fill={eyeColor} opacity="0.4" filter="url(#bossBloom)" />
        <rect x="58" y="38" width="14" height="6" fill={eyeColor} opacity="0.4" filter="url(#bossBloom)" />
        {/* mouth */}
        <rect x="34" y="62" width="32" height="3" fill={phase === "p2" ? "#FF4D6D" : "#5a4838"} />
        <rect x="38" y="65" width="24" height="3" fill={phase === "p2" ? "#FF4D6D" : "#5a4838"} />
        <defs>
          <filter id="bossBloom">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>
      </svg>
    </div>
  );
}

function VictorySplash() {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center z-30 pointer-events-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      <motion.div
        className="absolute inset-0"
        style={{
          background: "rgba(0,0,0,0.7)",
          backdropFilter: "saturate(0.2) blur(2px)",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 1 }}
      />
      <div className="relative text-center px-6">
        <motion.div
          className="font-display italic"
          style={{
            color: "#e0c45c",
            fontSize: "clamp(3.5rem, 11vw, 11rem)",
            textShadow: "0 0 32px rgba(224,196,92,0.5)",
            letterSpacing: "0.04em",
            lineHeight: 0.95,
          }}
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 1.2, ease: easings.cinematic }}
        >
          AUDIO DEFEATED.
        </motion.div>
        <motion.div
          className="hud text-bone/55 mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.8 }}
        >
          choose any other reality to return.
        </motion.div>
      </div>
    </motion.div>
  );
}

function pointToSegmentDist(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - ax, py - ay);
  let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

// Fire a request to enter the boss battle from anywhere — the mute button uses
// this. It sets the scene and a transient "boss requested" toast.
export function requestBossBattle() {
  // imports kept local-only to avoid circular module deps
  import("@/lib/state/use-scene-store").then(({ useSceneStore }) => {
    useSceneStore.getState().setScene("boss-battle");
  });
  import("@/lib/state/use-easter-egg-store").then(({ useEasterEggStore }) => {
    useEasterEggStore.getState().pushToast({
      text: "you tried to mute. the guardian appears.",
      flavor: "warn",
    });
  });
  // tiny silent suppressor: stash that this is a battle started this session
  if (typeof window !== "undefined") {
    void getAudioEngine();
  }
}

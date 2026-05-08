"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionStyle,
} from "motion/react";
import { useVolumeStore } from "@/lib/state/use-volume-store";
import { play } from "@/lib/audio/presets";
import { getAudioEngine } from "@/lib/audio/audio-engine";
import { usePrefersReducedMotion } from "@/lib/hooks/use-prefers-reduced-motion";

type Props = {
  size?: number;
  layoutId?: string;
  face?: React.ReactNode;
  className?: string;
};

const MIN = -50;

// Spec: visual rotation should LAG the value by ~80ms — gives the knob weight.
// We let the underlying value-driven rotation feed a spring whose stiffness/damping
// mimic a heavy brushed-metal disc.
const SPRING = { stiffness: 130, damping: 18, mass: 1.4 };

export function MasterKnob({
  size = 320,
  layoutId = "master-knob",
  face,
  className = "",
}: Props) {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const master = useVolumeStore((s) => s.master);
  const isMuted = useVolumeStore((s) => s.isMuted);
  const sceneAccent = useVolumeStore((s) => s.sceneAccent);
  const godMode = useVolumeStore((s) => s.godMode);
  const cap = godMode ? 9001 : 200;

  const [dragging, setDragging] = useState(false);
  const [hover, setHover] = useState(false);

  // raw rotation in degrees (0..270 sweep) tracking the master value
  const targetRotation = useMotionValue(valueToDeg(master));
  const rotation = useSpring(targetRotation, reduced ? { stiffness: 600, damping: 30 } : SPRING);
  const arcOffset = useSpring(valueToArcDash(master), reduced ? { stiffness: 600, damping: 30 } : SPRING);

  useEffect(() => {
    targetRotation.set(valueToDeg(master));
    arcOffset.set(valueToArcDash(master));
  }, [master, targetRotation, arcOffset]);

  // pointer drag — radial
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let startAngle = 0;
    let startValue = 0;
    let active = false;

    const center = () => {
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    };
    const angle = (cx: number, cy: number, x: number, y: number) =>
      (Math.atan2(y - cy, x - cx) * 180) / Math.PI;

    const onPointerDown = (e: PointerEvent) => {
      // allow clicks on children (face input etc) — we only drag from the bezel
      const tgt = e.target as HTMLElement;
      if (tgt.closest("[data-knob-passthrough='true']")) return;
      active = true;
      setDragging(true);
      const c = center();
      startAngle = angle(c.x, c.y, e.clientX, e.clientY);
      startValue = useVolumeStore.getState().master;
      el.setPointerCapture(e.pointerId);
      // touching the knob unlocks audio
      void getAudioEngine().resume();
      e.preventDefault();
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!active) return;
      const c = center();
      const a = angle(c.x, c.y, e.clientX, e.clientY);
      const delta = shortestAngleDelta(startAngle, a);
      // shift modifies precision: shift = glacial, alt = chaos
      const speed = e.shiftKey ? 0.015 : e.altKey ? 4 : 0.6;
      let nextV = startValue + delta * speed;
      if (e.altKey) nextV += (Math.random() - 0.5) * 6;
      const cap = useVolumeStore.getState().godMode ? 9001 : 200;
      nextV = Math.max(MIN, Math.min(cap, nextV));
      const prev = Math.round(useVolumeStore.getState().master);
      const next = Math.round(nextV);
      if (prev !== next) {
        useVolumeStore.getState().setMaster(nextV);
        play("knob-tick", 0.4);
        if (typeof navigator !== "undefined" && navigator.vibrate)
          navigator.vibrate(8);
      } else {
        useVolumeStore.getState().setMaster(nextV);
      }
    };
    const onPointerUp = (e: PointerEvent) => {
      if (!active) return;
      active = false;
      setDragging(false);
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {}
    };

    el.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, []);

  // wheel input
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const dir = e.deltaY > 0 ? -1 : 1;
      const step = e.shiftKey ? 0.1 : e.altKey ? 5 : 1;
      useVolumeStore.getState().delta(dir * step);
      play("knob-tick", 0.3);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // keyboard
  const onKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    let handled = true;
    switch (e.key) {
      case "ArrowUp":
      case "ArrowRight":
        useVolumeStore.getState().delta(e.shiftKey ? 10 : 1);
        play("knob-tick", 0.3);
        break;
      case "ArrowDown":
      case "ArrowLeft":
        useVolumeStore.getState().delta(-(e.shiftKey ? 10 : 1));
        play("knob-tick", 0.3);
        break;
      case "Home":
        useVolumeStore.getState().setMaster(0);
        play("knob-snap", 0.5);
        break;
      case "End":
        useVolumeStore.getState().setMaster(100);
        play("knob-snap", 0.5);
        break;
      case "PageUp":
        useVolumeStore.getState().delta(25);
        break;
      case "PageDown":
        useVolumeStore.getState().delta(-25);
        break;
      default:
        handled = false;
    }
    if (handled) e.preventDefault();
  };

  // active arc length
  const radius = size / 2 - 24;
  const circumference = 2 * Math.PI * radius;
  const sweep = 0.75; // 270 / 360 — full arc visible
  const arcLength = circumference * sweep;

  // bezel ticks. Trig precomputed and rounded to dodge SSR/CSR float ULP
  // mismatches that React would flag as hydration errors.
  const ticks = useMemo(() => {
    const arr: { x1: number; y1: number; x2: number; y2: number; major: boolean }[] = [];
    const cx = size / 2;
    const cy = size / 2;
    for (let i = 0; i <= 60; i++) {
      const rot = -135 + (270 * i) / 60;
      const major = i % 5 === 0;
      const inner = radius - (major ? 18 : 10);
      const outer = radius - 2;
      const rad = (rot * Math.PI) / 180;
      const round = (n: number) => Math.round(n * 1000) / 1000;
      arr.push({
        x1: round(cx + Math.cos(rad) * inner),
        y1: round(cy + Math.sin(rad) * inner),
        x2: round(cx + Math.cos(rad) * outer),
        y2: round(cy + Math.sin(rad) * outer),
        major,
      });
    }
    return arr;
  }, [radius, size]);

  return (
    <motion.div
      ref={ref}
      layoutId={layoutId}
      role="slider"
      tabIndex={0}
      aria-label="Master volume"
      aria-valuemin={MIN}
      aria-valuemax={cap}
      aria-valuenow={Math.round(master)}
      aria-valuetext={ariaValueText(master, isMuted)}
      onKeyDown={onKey}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      className={`relative select-none touch-none cursor-grab active:cursor-grabbing ${className}`}
      style={
        {
          width: size,
          height: size,
          // CSS var so children can pick up the live accent
          ["--knob-accent" as string]: sceneAccent,
        } as MotionStyle
      }
    >
      {/* god rays glow halo */}
      <motion.div
        aria-hidden
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 50%, color-mix(in oklch, ${sceneAccent} 35%, transparent) 0%, transparent 70%)`,
          filter: "blur(40px)",
        }}
        animate={{
          scale: dragging ? 1.15 : hover ? 1.05 : 1,
          opacity: dragging ? 0.9 : hover ? 0.7 : 0.45,
        }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* ambient outer ring (the void) */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 30% 25%, #2a2a32 0%, #0a0a0c 60%, #000 100%)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -10px 30px rgba(0,0,0,0.6), 0 24px 60px -10px rgba(0,0,0,0.8)",
        }}
      />

      {/* tick bezel */}
      <svg
        className="absolute inset-0"
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden
      >
        <defs>
          <linearGradient id="brushed" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1c1c22" />
            <stop offset="40%" stopColor="#2e2e38" />
            <stop offset="50%" stopColor="#3a3a46" />
            <stop offset="60%" stopColor="#262630" />
            <stop offset="100%" stopColor="#0c0c10" />
          </linearGradient>
          <radialGradient id="rim" cx="50%" cy="50%" r="50%">
            <stop offset="92%" stopColor="rgba(245,242,234,0)" />
            <stop offset="100%" stopColor="rgba(245,242,234,0.18)" />
          </radialGradient>
          <filter id="innerGlow">
            <feGaussianBlur stdDeviation="2" />
          </filter>
        </defs>

        {/* tick marks */}
        {ticks.map((t, i) => (
          <line
            key={i}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            stroke={t.major ? "#f5f2ea" : "#54545e"}
            strokeWidth={t.major ? 1.4 : 0.8}
            opacity={t.major ? 0.85 : 0.45}
          />
        ))}

        {/* active value arc */}
        <ActiveArc
          size={size}
          radius={radius}
          accent={sceneAccent}
          arcOffset={arcOffset}
          arcLength={arcLength}
        />
      </svg>

      {/* brushed metal disc */}
      <motion.div
        className="absolute rounded-full overflow-hidden"
        style={{
          inset: 28,
          rotate: rotation,
          background:
            "conic-gradient(from 0deg, #14141a, #2c2c36, #16161c, #2a2a34, #18181f, #2e2e38, #14141a)",
          boxShadow:
            "inset 0 0 0 1px rgba(245,242,234,0.04), inset 0 18px 40px rgba(0,0,0,0.55), inset 0 -8px 24px rgba(255,255,255,0.04)",
        }}
      >
        {/* radial brushed lines */}
        <div
          className="absolute inset-0 opacity-40 mix-blend-overlay"
          style={{
            background:
              "repeating-conic-gradient(from 0deg, rgba(255,255,255,0.04) 0deg 1deg, transparent 1deg 2.5deg)",
          }}
        />

        {/* indicator notch */}
        <div
          className="absolute left-1/2 top-2 -translate-x-1/2 w-[3px] h-[28%] rounded-full"
          style={{
            background: `linear-gradient(180deg, ${sceneAccent}, transparent)`,
            boxShadow: `0 0 14px ${sceneAccent}, 0 0 28px ${sceneAccent}`,
          }}
        />

        {/* center cap */}
        <div className="absolute inset-[35%] rounded-full bg-[#08080a] shadow-[inset_0_2px_6px_rgba(255,255,255,0.05),0_0_24px_rgba(0,0,0,0.8)]" />
      </motion.div>

      {/* bone-white rim */}
      <svg
        className="absolute inset-0 pointer-events-none"
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 1}
          fill="none"
          stroke="rgba(245,242,234,0.08)"
          strokeWidth={1}
        />
      </svg>

      {/* slot for face / overlays — sits OVER the rotating disc, does not rotate */}
      <div
        className="absolute inset-[28%] flex items-center justify-center pointer-events-none"
        aria-hidden
      >
        {face}
      </div>

      {/* hover hint */}
      <motion.div
        className="absolute -bottom-9 left-1/2 -translate-x-1/2 hud whitespace-nowrap"
        animate={{ opacity: hover && !dragging ? 0.5 : 0 }}
      >
        drag · wheel · ↑↓ · shift=glacial · alt=chaos
      </motion.div>
    </motion.div>
  );
}

function ActiveArc({
  size,
  radius,
  accent,
  arcOffset,
  arcLength,
}: {
  size: number;
  radius: number;
  accent: string;
  arcOffset: ReturnType<typeof useSpring>;
  arcLength: number;
}) {
  // The arc starts at -135° (bottom-left), sweeps clockwise 270°.
  // We render a full circle path with stroke-dasharray and animate offset.
  const cx = size / 2;
  const cy = size / 2;
  const dashOffset = useTransform(arcOffset, (v) => {
    const safe = typeof v === "number" && !Number.isNaN(v) ? v : 0;
    return arcLength * (1 - safe);
  });
  return (
    <g transform={`rotate(135 ${cx} ${cy})`}>
      {/* track */}
      <circle
        cx={cx}
        cy={cy}
        r={radius - 5}
        fill="none"
        stroke="rgba(245,242,234,0.06)"
        strokeWidth={2}
        strokeDasharray={`${arcLength} ${2 * Math.PI * (radius - 5) - arcLength}`}
        strokeLinecap="round"
        transform={`rotate(45 ${cx} ${cy})`}
      />
      {/* live arc */}
      <motion.circle
        cx={cx}
        cy={cy}
        r={radius - 5}
        fill="none"
        stroke={accent}
        strokeWidth={2}
        strokeDasharray={`${arcLength} ${2 * Math.PI * (radius - 5) - arcLength}`}
        style={{ strokeDashoffset: dashOffset }}
        strokeLinecap="round"
        transform={`rotate(45 ${cx} ${cy})`}
        opacity={0.95}
        filter="url(#innerGlow)"
      />
    </g>
  );
}

function valueToDeg(v: number) {
  // map -50..200 to -135..(135 + extra). Above 100 rotates further into the void.
  const clamped = Math.max(-50, v);
  if (clamped <= 100) return -135 + (270 * (clamped + 50)) / 150;
  // 100..200 maps onto another 90 deg overshoot
  return 135 + Math.min(90, (clamped - 100) * 0.9);
}

function valueToArcDash(v: number) {
  // 0..1 fill of the active arc. Clamp at 0..1.05 (overdrive shimmer).
  const clamped = Math.max(0, Math.min(120, v));
  return Math.min(1.05, clamped / 100);
}

function shortestAngleDelta(a: number, b: number) {
  let d = b - a;
  while (d > 180) d -= 360;
  while (d < -180) d += 360;
  return d;
}

function ariaValueText(v: number, muted: boolean) {
  const r = Math.round(v);
  if (muted) return `muted, was ${r} percent`;
  if (r === 42) return "forty-two percent — the answer";
  if (r === 69) return "sixty-nine percent — nice";
  if (r === 100) return "one hundred percent — maximum";
  if (r > 100) return `${r} percent — beyond the recommended threshold`;
  if (r < 0) return `${r} percent — below zero`;
  return `${r} percent`;
}

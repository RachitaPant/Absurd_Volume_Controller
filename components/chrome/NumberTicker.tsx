"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

type Props = {
  value: number;
  width?: number;
  align?: "center" | "left" | "right";
  className?: string;
  prefix?: string;
  suffix?: string;
  showSign?: boolean;
};

// Ticks digit-by-digit, never lerps the whole number. Each digit change
// flips like an odometer. NEVER smooth-interpolate the displayed integer.
export function NumberTicker({
  value,
  width = 4,
  align = "center",
  className = "",
  prefix = "",
  suffix = "",
  showSign = false,
}: Props) {
  const [shown, setShown] = useState(Math.round(value));
  const target = Math.round(value);
  const lastTick = useRef(0);

  useEffect(() => {
    if (shown === target) return;
    let cancelled = false;
    const step = () => {
      if (cancelled) return;
      const now = performance.now();
      if (now - lastTick.current < 14) {
        requestAnimationFrame(step);
        return;
      }
      lastTick.current = now;
      setShown((s) => {
        if (s === target) return s;
        const dir = target > s ? 1 : -1;
        // accelerate with distance for big jumps so it feels like a real tape
        const delta = Math.max(1, Math.min(7, Math.floor(Math.abs(target - s) / 3)));
        const next = s + dir * delta;
        if ((dir > 0 && next > target) || (dir < 0 && next < target)) return target;
        return next;
      });
      requestAnimationFrame(step);
    };
    const id = requestAnimationFrame(step);
    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
    };
  }, [target, shown]);

  const sign = showSign && shown < 0 ? "-" : showSign && shown > 0 ? "+" : "";
  const abs = Math.abs(shown);
  const digits = String(abs).padStart(width, "0").split("");

  return (
    <span
      className={`tnum inline-flex items-baseline ${className}`}
      style={{ justifyContent: align === "center" ? "center" : align }}
    >
      {prefix && <span className="opacity-60 mr-1">{prefix}</span>}
      {sign && (
        <span className="opacity-80" aria-hidden>
          {sign}
        </span>
      )}
      {digits.map((d, i) => (
        <Digit key={i} char={d} />
      ))}
      {suffix && <span className="opacity-60 ml-1">{suffix}</span>}
    </span>
  );
}

function Digit({ char }: { char: string }) {
  return (
    <span
      className="relative inline-block overflow-hidden align-baseline"
      style={{ width: "0.62em", height: "1em" }}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={char}
          initial={{ y: "100%" }}
          animate={{ y: "0%" }}
          exit={{ y: "-110%" }}
          transition={{ duration: 0.18, ease: [0.7, 0, 0.3, 1] }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {char}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

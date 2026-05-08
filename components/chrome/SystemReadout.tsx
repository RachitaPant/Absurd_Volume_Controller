"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";

type Line = { label: string; value?: string; pending?: boolean; fail?: boolean };

const SCRIPT: Line[] = [
  { label: "checking ear integrity", value: "OK" },
  { label: "calibrating cochlea", value: "OK" },
  { label: "requesting permission from neighbors", value: "DENIED (proceeding anyway)", fail: true },
  { label: "insurance status", value: "LAPSED", fail: true },
  { label: "establishing audio context", value: "PENDING" },
  { label: "READY.", value: "" },
];

// Plays during the intro and continues to render in the corner forever.
export function SystemReadout({ active = true }: { active?: boolean }) {
  const [shown, setShown] = useState<Line[]>([]);

  useEffect(() => {
    if (!active) return;
    let i = 0;
    const id = window.setInterval(() => {
      if (i >= SCRIPT.length) {
        window.clearInterval(id);
        return;
      }
      setShown((s) => [...s, SCRIPT[i]]);
      i++;
    }, 360);
    return () => window.clearInterval(id);
  }, [active]);

  return (
    <div className="hud space-y-1 leading-snug">
      {shown.map((l, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25 }}
          className="flex items-baseline gap-2"
        >
          <span className="text-bone/35">&gt;</span>
          <span className="text-bone/65">{l.label}</span>
          {l.value && (
            <>
              <span className="text-bone/20 flex-1 truncate">
                {".".repeat(Math.max(2, 36 - l.label.length))}
              </span>
              <span className={l.fail ? "text-[var(--accent)]" : "text-bone"}>
                {l.value}
              </span>
            </>
          )}
        </motion.div>
      ))}
    </div>
  );
}

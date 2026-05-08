"use client";

import { motion, AnimatePresence } from "motion/react";
import type { KnobEmotion } from "@/lib/utils/knob-emotions";

type Props = {
  emotion: KnobEmotion;
  size?: number;
};

// Simple face. Eyes + mouth as SVG paths. Each emotion picks a variant.
// The mouth path is keyed so motion morphs between emotions.
export function KnobFace({ emotion, size = 120 }: Props) {
  return (
    <div
      className="relative"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg viewBox="0 0 100 100" width={size} height={size}>
        <defs>
          <radialGradient id="face-glow" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stopColor="rgba(245,242,234,0.06)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="46" fill="url(#face-glow)" />
        <Eyes emotion={emotion} side="left" />
        <Eyes emotion={emotion} side="right" />
        <Mouth emotion={emotion} />
      </svg>

      {/* asleep Zs */}
      <AnimatePresence>
        {emotion === "asleep" && (
          <>
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="absolute font-display text-bone/70"
                style={{
                  left: 70 + i * 8,
                  top: 22 - i * 8,
                  fontSize: 20 - i * 4,
                }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: [0, 1, 0], y: [-4, -28, -52] }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 2.2,
                  delay: i * 0.6,
                  repeat: Infinity,
                  ease: "easeOut",
                }}
              >
                z
              </motion.span>
            ))}
          </>
        )}
      </AnimatePresence>

      {/* manic vibration */}
      {emotion === "manic" && (
        <motion.div
          className="absolute inset-0"
          animate={{ x: [0, 1, -1, 0], y: [0, -1, 1, 0] }}
          transition={{ duration: 0.18, repeat: Infinity }}
        />
      )}

      {/* transcendent halo */}
      {emotion === "transcendent" && (
        <motion.div
          className="absolute -inset-4 rounded-full"
          style={{
            border: "1px solid rgba(245,242,234,0.4)",
            boxShadow: "0 0 28px rgba(245,242,234,0.4)",
          }}
          animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.04, 1] }}
          transition={{ duration: 2.4, repeat: Infinity }}
        />
      )}
    </div>
  );
}

function Eyes({ emotion, side }: { emotion: KnobEmotion; side: "left" | "right" }) {
  const cx = side === "left" ? 34 : 66;
  const cy = 42;

  // shape of eye depends on emotion
  switch (emotion) {
    case "asleep":
    case "sleepy":
      return (
        <motion.path
          d={`M ${cx - 7} ${cy} Q ${cx} ${cy + 5} ${cx + 7} ${cy}`}
          stroke="#f5f2ea"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
      );
    case "transcendent":
      return (
        <motion.path
          d={`M ${cx - 7} ${cy} Q ${cx} ${cy - 4} ${cx + 7} ${cy}`}
          stroke="#f5f2ea"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
      );
    case "bored":
      return (
        <motion.line
          x1={cx - 8}
          y1={cy}
          x2={cx + 8}
          y2={cy}
          stroke="#f5f2ea"
          strokeWidth={2}
          strokeLinecap="round"
        />
      );
    case "manic":
      return (
        <motion.g
          animate={{ rotate: side === "left" ? 360 : -360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          style={{ originX: `${cx}px`, originY: `${cy}px` }}
        >
          <circle cx={cx} cy={cy} r={6} stroke="#f5f2ea" strokeWidth={1.4} fill="none" />
          <line x1={cx - 6} y1={cy} x2={cx + 6} y2={cy} stroke="#f5f2ea" strokeWidth={1.2} />
          <line x1={cx} y1={cy - 6} x2={cx} y2={cy + 6} stroke="#f5f2ea" strokeWidth={1.2} />
        </motion.g>
      );
    case "existential":
      return <circle cx={cx} cy={cy} r={6} fill="#08080a" stroke="#f5f2ea" strokeWidth={1} />;
    case "striking":
      return (
        <g>
          <line x1={cx - 5} y1={cy - 5} x2={cx + 5} y2={cy + 5} stroke="#f5f2ea" strokeWidth={2} />
          <line x1={cx + 5} y1={cy - 5} x2={cx - 5} y2={cy + 5} stroke="#f5f2ea" strokeWidth={2} />
        </g>
      );
    case "sulking":
      return (
        <motion.line
          x1={cx - 7}
          y1={cy + 1}
          x2={cx + 7}
          y2={cy - 2}
          stroke="#f5f2ea"
          strokeWidth={2}
          strokeLinecap="round"
        />
      );
    case "preening":
      return (
        <g>
          <path
            d={`M ${cx - 7} ${cy} Q ${cx} ${cy - 5} ${cx + 7} ${cy}`}
            stroke="#f5f2ea"
            strokeWidth={2}
            fill="none"
            strokeLinecap="round"
          />
          <circle cx={cx + 3} cy={cy - 2} r={1.4} fill="#f5f2ea" />
        </g>
      );
    case "excited":
      return (
        <motion.circle
          cx={cx}
          cy={cy}
          r={5}
          stroke="#f5f2ea"
          strokeWidth={2}
          fill="#08080a"
          animate={{ r: [5, 5.6, 5] }}
          transition={{ duration: 0.6, repeat: Infinity }}
        />
      );
    case "content":
    default:
      return <circle cx={cx} cy={cy} r={4} fill="#f5f2ea" />;
  }
}

function Mouth({ emotion }: { emotion: KnobEmotion }) {
  // pathLength animation triggered NaN dasharray on first paint when the
  // path's measured length wasn't ready yet. Plain opacity fade dodges that.
  const path = mouthPathFor(emotion);
  return (
    <motion.path
      key={emotion}
      d={path}
      stroke="#f5f2ea"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={emotion === "excited" || emotion === "manic" ? "#08080a" : "none"}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      style={{ originX: "50%", originY: "70%" }}
    />
  );
}

function mouthPathFor(e: KnobEmotion) {
  switch (e) {
    case "asleep":
    case "bored":
      return "M 38 70 L 62 70";
    case "sleepy":
      return "M 42 70 Q 50 74 58 70";
    case "content":
      return "M 38 68 Q 50 76 62 68";
    case "excited":
      return "M 36 66 Q 50 82 64 66 Q 50 74 36 66 Z";
    case "manic":
      return "M 36 70 L 42 64 L 46 72 L 52 64 L 58 72 L 64 66";
    case "transcendent":
      return "M 36 70 Q 50 78 64 70";
    case "existential":
      return "M 38 76 Q 50 68 62 76";
    case "sulking":
      return "M 40 76 Q 50 70 60 76";
    case "preening":
      return "M 40 70 Q 46 76 50 70 Q 54 64 60 70";
    case "striking":
      return "M 36 70 L 64 70";
  }
}

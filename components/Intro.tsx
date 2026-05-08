"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { easings } from "@/lib/utils/easings";
import { useSceneStore } from "@/lib/state/use-scene-store";
import { getAudioEngine } from "@/lib/audio/audio-engine";
import { play } from "@/lib/audio/presets";
import { usePrefersReducedMotion } from "@/lib/hooks/use-prefers-reduced-motion";
import { SystemReadout } from "./chrome/SystemReadout";

const TITLE = "YOU HAVE FOUND THE LOUDEST PLACE ON THE INTERNET.";
const SUBTITLE = "VOLUMETRIC HUBRIS // v4.7.0 // CALIBRATING REALITY...";

export function Intro() {
  const setIntroComplete = useSceneStore((s) => s.setIntroComplete);
  const reduced = usePrefersReducedMotion();
  const [phase, setPhase] = useState<
    "void" | "hairline" | "title" | "knob" | "system" | "whisper" | "unlock"
  >("void");
  const [scrambled, setScrambled] = useState("");
  const subBassRef = useRef<{ stop: () => void } | null>(null);

  // total intro: 8s standard, 1.6s reduced
  useEffect(() => {
    if (reduced) {
      const t = window.setTimeout(() => {
        setPhase("unlock");
        setIntroComplete(true);
      }, 1500);
      return () => window.clearTimeout(t);
    }

    const ts: number[] = [];
    const at = (ms: number, fn: () => void) =>
      ts.push(window.setTimeout(fn, ms));

    at(0, () => setPhase("hairline"));
    at(600, () => {
      setPhase("title");
      try {
        // sub-bass swell synthesized fresh
        const engine = getAudioEngine();
        const ctx = engine.context();
        if (ctx) {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = "sine";
          o.frequency.value = 40;
          g.gain.setValueAtTime(0.0001, ctx.currentTime);
          g.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 1.6);
          g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 7);
          o.connect(g).connect(ctx.destination);
          o.start();
          o.stop(ctx.currentTime + 7.2);
          subBassRef.current = { stop: () => o.stop() };
        }
      } catch {}
    });
    at(2400, () => setPhase("knob"));
    at(3600, () => setPhase("system"));
    at(5000, () => {
      setPhase("whisper");
      try {
        if ("speechSynthesis" in window) {
          const u = new SpeechSynthesisUtterance("Please. Be careful with the knob.");
          u.rate = 0.7;
          u.pitch = 0.4;
          u.volume = 0.55;
          window.speechSynthesis.speak(u);
        }
      } catch {}
    });
    at(8000, () => {
      setPhase("unlock");
      setIntroComplete(true);
      play("shimmer", 0.6);
    });

    return () => {
      ts.forEach(window.clearTimeout);
      subBassRef.current?.stop();
    };
  }, [reduced, setIntroComplete]);

  // scrambled subtitle
  useEffect(() => {
    if (phase === "void" || phase === "hairline") return;
    const target = SUBTITLE;
    let frames = 0;
    const id = window.setInterval(() => {
      frames++;
      const reveal = Math.floor((frames / 26) * target.length);
      const out = target
        .split("")
        .map((c, i) => {
          if (i < reveal || c === " " || c === "/") return c;
          return String.fromCharCode(33 + Math.floor(Math.random() * 90));
        })
        .join("");
      setScrambled(out);
      if (reveal >= target.length) window.clearInterval(id);
    }, 28);
    return () => window.clearInterval(id);
  }, [phase]);

  return (
    <AnimatePresence>
      {phase !== "unlock" && (
        <motion.div
          key="intro"
          className="fixed inset-0 z-[200] bg-void overflow-hidden"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: easings.cinematic }}
        >
          {/* hairline */}
          <motion.div
            aria-hidden
            className="absolute left-0 right-0 top-1/2 h-[1px] bg-bone origin-center breathe-hairline"
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{
              scaleY: phase === "void" ? 0 : phase === "hairline" ? 1 : 1,
              scaleX: phase === "void" || phase === "hairline" ? 1 : 1,
              opacity: phase === "void" ? 0 : 1,
            }}
            transition={{ duration: 0.6, ease: easings.cinematic }}
          />

          {/* expanding column */}
          <motion.div
            aria-hidden
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            initial={{ width: 0, height: 1, opacity: 0 }}
            animate={{
              width:
                phase === "hairline"
                  ? 2
                  : phase === "title" || phase === "knob"
                    ? 800
                    : 0,
              height:
                phase === "hairline"
                  ? 220
                  : phase === "title" || phase === "knob"
                    ? 600
                    : 1,
              opacity:
                phase === "hairline"
                  ? 0.4
                  : phase === "title" || phase === "knob"
                    ? 0.1
                    : 0,
            }}
            style={{
              background:
                "radial-gradient(closest-side, rgba(245,242,234,0.4), transparent 70%)",
            }}
            transition={{ duration: 1.2, ease: easings.cinematic }}
          />

          {/* drifting particles */}
          {phase !== "void" &&
            Array.from({ length: 22 }).map((_, i) => (
              <motion.span
                key={i}
                aria-hidden
                className="absolute w-[2px] h-[2px] rounded-full bg-bone"
                initial={{
                  opacity: 0,
                  x: i % 2 ? "50vw" : "-50vw",
                  y: `${(i * 137) % 100}%`,
                }}
                animate={{
                  opacity: [0, 0.45, 0],
                  x: 0,
                  y: `${(i * 137 + 30) % 100}%`,
                }}
                transition={{
                  duration: 5 + (i % 5),
                  delay: i * 0.08,
                  ease: "linear",
                }}
              />
            ))}

          {/* title */}
          {(phase === "title" ||
            phase === "knob" ||
            phase === "system" ||
            phase === "whisper") && (
            <div className="absolute inset-x-0 top-[34%] flex flex-col items-center px-6">
              <h1
                className="font-display text-bone text-center leading-[0.95]"
                style={{
                  fontSize: "clamp(2.4rem, 6.4vw, 6.4rem)",
                  letterSpacing: "-0.01em",
                }}
                aria-label={TITLE}
              >
                {TITLE.split("").map((ch, i) => (
                  <motion.span
                    key={i}
                    className="inline-block"
                    initial={{
                      clipPath: "inset(0 0 100% 0)",
                      y: "20%",
                      opacity: 0,
                    }}
                    animate={{
                      clipPath: "inset(0 0 0% 0)",
                      y: 0,
                      opacity: 1,
                    }}
                    transition={{
                      duration: 0.7,
                      delay: 0.2 + i * 0.028,
                      ease: easings.cinematic,
                    }}
                  >
                    {ch === " " ? " " : ch}
                  </motion.span>
                ))}
              </h1>

              <motion.div
                className="mt-6 hud text-bone/60 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.6 }}
              >
                {scrambled}
              </motion.div>
            </div>
          )}

          {/* fake knob silhouette during the dolly reveal */}
          {(phase === "knob" || phase === "system" || phase === "whisper") && (
            <motion.div
              aria-hidden
              className="absolute left-1/2 bottom-[14%] -translate-x-1/2"
              initial={{ scale: 0.2, opacity: 0, y: 100 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 1.2, ease: easings.cinematic }}
            >
              <div
                className="w-44 h-44 rounded-full"
                style={{
                  background:
                    "radial-gradient(circle at 30% 25%, #2c2c34, #08080a 70%, #000)",
                  boxShadow:
                    "0 40px 100px -20px rgba(255,77,109,0.25), inset 0 -10px 20px rgba(0,0,0,0.6)",
                }}
              />
            </motion.div>
          )}

          {/* system readout */}
          {(phase === "system" || phase === "whisper") && (
            <div className="absolute left-6 bottom-6 max-w-[60ch] hud">
              <SystemReadout active />
            </div>
          )}

          {/* whisper text */}
          {phase === "whisper" && (
            <motion.div
              className="absolute right-6 bottom-6 max-w-[40ch] text-right"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
            >
              <p className="font-display italic text-bone/70 text-2xl leading-snug">
                &ldquo;please. be careful with the knob.&rdquo;
              </p>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

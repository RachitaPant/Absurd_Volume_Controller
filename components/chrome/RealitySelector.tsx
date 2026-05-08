"use client";

import { motion } from "motion/react";
import { useSceneStore } from "@/lib/state/use-scene-store";
import { useVolumeStore } from "@/lib/state/use-volume-store";
import { play } from "@/lib/audio/presets";
import type { RealityScene } from "@/lib/state/use-volume-store";
import { easings } from "@/lib/utils/easings";

// Eight scenes are wired in the spec. In Phase 1 only "cursed-knob" is
// implemented — the others are visible as locked previews to telegraph that
// more is coming. Selecting them just stays on cursed-knob and posts a toast.
import { useEasterEggStore } from "@/lib/state/use-easter-egg-store";

const SCENES: { id: RealityScene; label: string; accent: string; ready: boolean }[] = [
  { id: "cursed-knob", label: "the cursed knob", accent: "#FF4D6D", ready: true },
  { id: "cosmic-orbit", label: "cosmic orbit", accent: "#7C5CFF", ready: false },
  { id: "medieval-lever", label: "medieval lever", accent: "#D89B4A", ready: false },
  { id: "liquid-reactor", label: "liquid reactor", accent: "#9CFF54", ready: false },
  { id: "boss-battle", label: "boss battle (mute)", accent: "#F5F2EA", ready: false },
  { id: "scream-calibrator", label: "scream calibrator", accent: "#F26B3A", ready: false },
  { id: "black-hole", label: "the black hole", accent: "#0A0A0A", ready: false },
  { id: "forbidden-button", label: "the forbidden button", accent: "#FF1A1A", ready: false },
];

export function RealitySelector() {
  const scene = useSceneStore((s) => s.scene);
  const setScene = useSceneStore((s) => s.setScene);
  const setAccent = useVolumeStore((s) => s.setSceneAccent);
  const pushToast = useEasterEggStore((s) => s.pushToast);

  return (
    <motion.nav
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-full border border-bone/10 bg-smoke/40 backdrop-blur-md flex items-center gap-1 max-w-[92vw] overflow-x-auto"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.7, ease: easings.cinematic }}
    >
      <span className="hud text-bone/35 px-3 hidden md:inline">REALITY //</span>
      {SCENES.map((s) => {
        const active = scene === s.id;
        return (
          <button
            key={s.id}
            disabled={!s.ready}
            onClick={() => {
              if (!s.ready) {
                pushToast({
                  text: `${s.label} — not yet manifested. (phase 2 portal sealed.)`,
                  flavor: "warn",
                });
                play("buzz", 0.35);
                return;
              }
              setScene(s.id);
              setAccent(s.accent);
              play("swoosh", 0.4);
            }}
            className={[
              "relative px-3 py-1.5 rounded-full text-[11px] tracking-[0.18em] uppercase whitespace-nowrap transition-colors",
              active
                ? "text-bone"
                : s.ready
                  ? "text-bone/45 hover:text-bone"
                  : "text-bone/20 cursor-not-allowed",
            ].join(" ")}
            aria-current={active ? "page" : undefined}
          >
            {active && (
              <motion.span
                layoutId="reality-pill"
                className="absolute inset-0 rounded-full"
                style={{
                  background: `color-mix(in oklch, ${s.accent} 18%, transparent)`,
                  border: `1px solid color-mix(in oklch, ${s.accent} 55%, transparent)`,
                }}
                transition={{ duration: 0.5, ease: easings.cinematic }}
              />
            )}
            <span className="relative">
              {s.label}
              {!s.ready && <span className="ml-2 opacity-60">·LOCKED</span>}
            </span>
          </button>
        );
      })}
    </motion.nav>
  );
}
